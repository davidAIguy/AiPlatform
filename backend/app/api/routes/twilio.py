import logging
from base64 import b64decode
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4
from xml.sax.saxutils import escape

import httpx
from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.core.settings import get_settings
from backend.app.db import AgentRecord, CallSessionRecord, PlatformSettingsRecord, get_db

router = APIRouter(prefix="/twilio", tags=["twilio"])
AUDIO_CACHE_TTL_MINUTES = 20
RIME_MODEL_ID = "mist"
RIME_FALLBACK_VOICE = "allison"
audio_cache: dict[str, dict[str, object]] = {}
logger = logging.getLogger("uvicorn.error")
runtime_settings = get_settings()


def _normalize_secret(value: str) -> str:
    trimmed = value.strip()

    if not trimmed or "*" in trimmed:
        return ""

    return trimmed


def _resolve_provider_key(settings_value: str, env_value: str) -> str:
    normalized_settings_value = _normalize_secret(settings_value)

    if normalized_settings_value:
        return normalized_settings_value

    return _normalize_secret(env_value)


def _normalize_phone(value: str) -> str:
    return "".join(char for char in value if char.isdigit())


def _load_agents(db: Session) -> list[AgentRecord]:
    return db.query(AgentRecord).order_by(AgentRecord.id.asc()).all()


def _match_agent_by_number(db: Session, to_number: str) -> AgentRecord:
    agents = _load_agents(db)

    if not agents:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No agents configured",
        )

    normalized_to = _normalize_phone(to_number)

    for agent in agents:
        if _normalize_phone(agent.twilio_number) == normalized_to:
            return agent

    first_active = next((agent for agent in agents if agent.status == "active"), None)
    return first_active if first_active else agents[0]


def _twilio_status_to_domain(call_status: str) -> str:
    normalized = call_status.strip().lower()

    if normalized in {"completed"}:
        return "completed"

    if normalized in {"busy", "no-answer", "canceled"}:
        return "busy"

    if normalized in {"failed"}:
        return "failed"

    return "busy"


def _next_call_id(db: Session) -> str:
    numeric_ids: list[int] = []

    for row in db.query(CallSessionRecord.call_id).all():
        call_id = row[0]

        if not isinstance(call_id, str):
            continue

        try:
            numeric_ids.append(int(call_id.split("-")[-1]))
        except ValueError:
            continue

    next_id = (max(numeric_ids) if numeric_ids else 0) + 1
    return f"call-{next_id}"


def _cleanup_audio_cache() -> None:
    now = datetime.now(timezone.utc)
    expired_ids = []

    for audio_id, payload in audio_cache.items():
        created_at = payload.get("created_at")

        if not isinstance(created_at, datetime):
            expired_ids.append(audio_id)
            continue

        if now - created_at > timedelta(minutes=AUDIO_CACHE_TTL_MINUTES):
            expired_ids.append(audio_id)

    for audio_id in expired_ids:
        audio_cache.pop(audio_id, None)


def _store_audio_blob(audio_bytes: bytes, media_type: str) -> str:
    _cleanup_audio_cache()
    audio_id = uuid4().hex
    audio_cache[audio_id] = {
        "bytes": audio_bytes,
        "media_type": media_type,
        "created_at": datetime.now(timezone.utc),
    }
    return audio_id


def _resolve_voice_name(voice_id: str) -> str:
    value = voice_id.strip().lower()

    if value.startswith("rime-"):
        return value.replace("rime-", "", 1)

    return value or RIME_FALLBACK_VOICE


def _load_platform_settings(db: Session) -> Optional[PlatformSettingsRecord]:
    return db.query(PlatformSettingsRecord).first()


def _generate_greeting_text(
    agent_name: str,
    caller_number: str,
    prompt: str,
    model: str,
    openai_api_key: str,
) -> tuple[str, str]:
    fallback = (
        f"Hello, this is {agent_name}. Thanks for calling. "
        "How can I help you today?"
    )

    safe_key = _normalize_secret(openai_api_key)

    if not safe_key:
        return fallback, "fallback-missing-openai-key"

    user_prompt = (
        "Generate one concise spoken greeting for an inbound phone call. "
        "It must be no more than 2 short sentences and should invite the caller to explain what they need. "
        f"Caller number: {caller_number}."
    )

    try:
        with httpx.Client(timeout=12.0) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {safe_key}",
                    "X-API-Key": safe_key,
                    "Content-Type": "application/json",
                },
                json={
                    "model": model or "gpt-4.1-mini",
                    "messages": [
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.4,
                    "max_tokens": 80,
                },
            )

        response.raise_for_status()
        payload = response.json()
        content = (
            payload.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )

        return (content or fallback), "openai"
    except Exception:
        return fallback, "fallback-openai-error"


def _generate_reply_text(
    agent_name: str,
    caller_text: str,
    prompt: str,
    model: str,
    openai_api_key: str,
) -> tuple[str, str]:
    normalized_caller_text = caller_text.strip()

    if not normalized_caller_text:
        return "I did not catch that clearly. Could you call again so I can assist you better?", "fallback-empty-speech"

    fallback = (
        f"Thanks for sharing. I understood that you said: {normalized_caller_text[:80]}. "
        "I will pass this to the team so they can follow up quickly."
    )

    safe_key = _normalize_secret(openai_api_key)

    if not safe_key:
        return fallback, "fallback-missing-openai-key"

    user_prompt = (
        "Respond as a phone assistant in at most 2 concise sentences. "
        "Acknowledge the caller request and give a clear next step. "
        f"Caller message: {normalized_caller_text}"
    )

    try:
        with httpx.Client(timeout=12.0) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {safe_key}",
                    "X-API-Key": safe_key,
                    "Content-Type": "application/json",
                },
                json={
                    "model": model or "gpt-4.1-mini",
                    "messages": [
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": 0.4,
                    "max_tokens": 120,
                },
            )

        response.raise_for_status()
        payload = response.json()
        content = (
            payload.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )

        return (content or fallback), "openai"
    except Exception:
        return fallback, "fallback-openai-error"


def _synthesize_rime_audio(
    text: str,
    voice_name: str,
    rime_api_key: str,
) -> tuple[Optional[tuple[bytes, str]], str]:
    safe_key = _normalize_secret(rime_api_key)

    if not safe_key:
        return None, "fallback-missing-rime-key"

    candidates = [voice_name.strip().lower(), RIME_FALLBACK_VOICE]
    seen: set[str] = set()

    with httpx.Client(timeout=18.0) as client:
        for candidate in candidates:
            if not candidate or candidate in seen:
                continue

            seen.add(candidate)

            try:
                response = client.post(
                    "https://users.rime.ai/v1/rime-tts",
                    headers={
                        "Authorization": f"Bearer {safe_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "speaker": candidate,
                        "text": text,
                        "modelId": RIME_MODEL_ID,
                    },
                )
                response.raise_for_status()
                content_type = (response.headers.get("content-type") or "").lower()

                if "audio" in content_type:
                    return (response.content, content_type.split(";")[0]), "rime"

                json_payload = response.json()
                encoded_audio = json_payload.get("audioContent") or json_payload.get("audio")

                if isinstance(encoded_audio, str) and encoded_audio.strip():
                    return (b64decode(encoded_audio), "audio/mpeg"), "rime"
            except Exception:
                continue

    return None, "fallback-rime-error"


def _public_url_for(request: Request, route_name: str, **path_params: str) -> str:
    raw_url = str(request.url_for(route_name, **path_params))
    forwarded_proto = request.headers.get("x-forwarded-proto", "").split(",")[0].strip().lower()

    if forwarded_proto == "https" and raw_url.startswith("http://"):
        return raw_url.replace("http://", "https://", 1)

    if raw_url.startswith("http://"):
        return raw_url.replace("http://", "https://", 1)

    return raw_url


@router.post("/voice")
def inbound_voice_webhook(
    request: Request,
    call_sid: str = Form(alias="CallSid"),
    from_number: str = Form(alias="From"),
    to_number: str = Form(alias="To"),
    db: Session = Depends(get_db),
) -> Response:
    agent = _match_agent_by_number(db, to_number)
    existing = db.query(CallSessionRecord).filter(CallSessionRecord.call_sid == call_sid).first()

    if existing is None:
        db.add(
            CallSessionRecord(
                call_id=_next_call_id(db),
                call_sid=call_sid,
                agent_name=agent.name,
                caller_number=from_number,
                started_at=datetime.now(timezone.utc),
                duration_seconds=0,
                status="busy",
                sentiment="neutral",
                recording_url="",
                updated_at=datetime.now(timezone.utc),
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()

    gather_url = _public_url_for(request, "voice_gather_webhook")
    platform_settings = _load_platform_settings(db)
    openai_key = _resolve_provider_key(
        platform_settings.openai_api_key if platform_settings else "",
        runtime_settings.openai_api_key,
    )
    rime_key = _resolve_provider_key(
        platform_settings.rime_api_key if platform_settings else "",
        runtime_settings.rime_api_key,
    )

    greeting_text, text_provider = _generate_greeting_text(
        agent_name=agent.name,
        caller_number=from_number,
        prompt=agent.prompt,
        model=agent.model,
        openai_api_key=openai_key,
    )
    audio_blob, audio_provider = _synthesize_rime_audio(
        text=greeting_text,
        voice_name=_resolve_voice_name(agent.voice_id),
        rime_api_key=rime_key,
    )

    logger.info(
        "twilio.voice agent_id=%s model=%s prompt_version=%s text_provider=%s audio_provider=%s",
        agent.agent_id,
        agent.model,
        agent.prompt_version,
        text_provider,
        audio_provider,
    )

    intro = ""

    if audio_blob:
        audio_bytes, media_type = audio_blob
        audio_id = _store_audio_blob(audio_bytes, media_type)
        audio_url = _public_url_for(request, "twilio_audio_file", audio_id=audio_id)
        intro = f"<Play>{audio_url}</Play>"
    else:
        intro = f"<Say voice=\"alice\">{escape(greeting_text)}</Say>"

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        f"{intro}"
        f"<Gather input=\"speech\" speechTimeout=\"auto\" timeout=\"4\" action=\"{gather_url}\" method=\"POST\">"
        "<Say voice=\"alice\">Please tell me how I can help.</Say>"
        "</Gather>"
        "<Say voice=\"alice\">I did not hear anything. Goodbye.</Say>"
        "<Hangup/>"
        "</Response>"
    )

    return Response(content=twiml, media_type="application/xml")


@router.get("/audio/{audio_id}", name="twilio_audio_file")
def twilio_audio_file(audio_id: str) -> Response:
    _cleanup_audio_cache()
    payload = audio_cache.get(audio_id)

    if payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio not found")

    audio_bytes = payload.get("bytes")
    media_type = payload.get("media_type", "audio/mpeg")

    if not isinstance(audio_bytes, (bytes, bytearray)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audio not found")

    return Response(content=bytes(audio_bytes), media_type=str(media_type))


@router.post("/gather", name="voice_gather_webhook")
def voice_gather_webhook(
    request: Request,
    call_sid: str = Form(alias="CallSid"),
    from_number: str = Form(alias="From"),
    to_number: str = Form(alias="To"),
    speech_result: str = Form(default="", alias="SpeechResult"),
    db: Session = Depends(get_db),
) -> Response:
    voice_finish_url = _public_url_for(request, "voice_finish_webhook")
    existing = db.query(CallSessionRecord).filter(CallSessionRecord.call_sid == call_sid).first()

    if existing is None:
        db.add(
            CallSessionRecord(
                call_id=_next_call_id(db),
                call_sid=call_sid,
                agent_name=_match_agent_by_number(db, to_number).name,
                caller_number=from_number,
                started_at=datetime.now(timezone.utc),
                duration_seconds=0,
                status="busy",
                sentiment="neutral",
                recording_url="",
                updated_at=datetime.now(timezone.utc),
            )
        )
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
        existing = db.query(CallSessionRecord).filter(CallSessionRecord.call_sid == call_sid).first()

    agent = _match_agent_by_number(db, to_number)
    platform_settings = _load_platform_settings(db)
    openai_key = _resolve_provider_key(
        platform_settings.openai_api_key if platform_settings else "",
        runtime_settings.openai_api_key,
    )
    rime_key = _resolve_provider_key(
        platform_settings.rime_api_key if platform_settings else "",
        runtime_settings.rime_api_key,
    )

    reply_text, text_provider = _generate_reply_text(
        agent_name=agent.name,
        caller_text=speech_result,
        prompt=agent.prompt,
        model=agent.model,
        openai_api_key=openai_key,
    )
    audio_blob, audio_provider = _synthesize_rime_audio(
        text=reply_text,
        voice_name=_resolve_voice_name(agent.voice_id),
        rime_api_key=rime_key,
    )

    logger.info(
        "twilio.gather agent_id=%s model=%s prompt_version=%s text_provider=%s audio_provider=%s has_speech=%s",
        agent.agent_id,
        agent.model,
        agent.prompt_version,
        text_provider,
        audio_provider,
        bool(speech_result.strip()),
    )

    if existing is not None:
        existing.sentiment = "positive" if speech_result.strip() else "neutral"
        existing.updated_at = datetime.now(timezone.utc)
        db.add(existing)
        db.commit()

    if audio_blob:
        audio_bytes, media_type = audio_blob
        audio_id = _store_audio_blob(audio_bytes, media_type)
        audio_url = _public_url_for(request, "twilio_audio_file", audio_id=audio_id)
        body = (
            '<?xml version="1.0" encoding="UTF-8"?>'
            "<Response>"
            f"<Play>{audio_url}</Play>"
            f"<Redirect method=\"POST\">{voice_finish_url}</Redirect>"
            "</Response>"
        )
        return Response(content=body, media_type="application/xml")

    body = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        f"<Say voice=\"alice\">{escape(reply_text)}</Say>"
        f"<Redirect method=\"POST\">{voice_finish_url}</Redirect>"
        "</Response>"
    )
    return Response(content=body, media_type="application/xml")


@router.post("/voice-finish", name="voice_finish_webhook")
def voice_finish_webhook() -> Response:
    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        "<Say voice=\"alice\">Thank you. Your message was recorded successfully. Goodbye.</Say>"
        "<Hangup/>"
        "</Response>"
    )

    return Response(content=twiml, media_type="application/xml")


@router.post("/recording", name="recording_status_webhook")
def recording_status_webhook(
    call_sid: str = Form(alias="CallSid"),
    recording_url: str = Form(default="", alias="RecordingUrl"),
    recording_duration: str = Form(default="0", alias="RecordingDuration"),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    existing = db.query(CallSessionRecord).filter(CallSessionRecord.call_sid == call_sid).first()

    if existing is None:
        return {"status": "ignored", "reason": "unknown call sid"}

    if recording_url.strip():
        existing.recording_url = recording_url.strip()

    try:
        duration = int(recording_duration)
    except ValueError:
        duration = existing.duration_seconds

    existing.duration_seconds = max(duration, existing.duration_seconds)
    existing.updated_at = datetime.now(timezone.utc)
    db.add(existing)
    db.commit()

    return {"status": "ok"}


@router.post("/status")
def call_status_webhook(
    call_sid: str = Form(alias="CallSid"),
    call_status: str = Form(alias="CallStatus"),
    call_duration: str = Form(default="0", alias="CallDuration"),
    recording_url: str = Form(default="", alias="RecordingUrl"),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    existing = db.query(CallSessionRecord).filter(CallSessionRecord.call_sid == call_sid).first()

    if existing is None:
        return {"status": "ignored", "reason": "unknown call sid"}

    try:
        duration = int(call_duration)
    except ValueError:
        duration = existing.duration_seconds

    existing.status = _twilio_status_to_domain(call_status)
    existing.duration_seconds = max(duration, 0)

    if recording_url.strip():
        existing.recording_url = recording_url.strip()

    existing.updated_at = datetime.now(timezone.utc)
    db.add(existing)
    db.commit()

    return {"status": "ok"}

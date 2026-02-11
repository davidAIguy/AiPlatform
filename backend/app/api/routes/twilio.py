from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Form, Request, Response
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.api.mock_data import AGENTS
from backend.app.db import CallSessionRecord, get_db

router = APIRouter(prefix="/twilio", tags=["twilio"])


def _normalize_phone(value: str) -> str:
    return "".join(char for char in value if char.isdigit())


def _match_agent_name_by_number(to_number: str) -> str:
    normalized_to = _normalize_phone(to_number)

    for agent in AGENTS:
        if _normalize_phone(agent.twilio_number) == normalized_to:
            return agent.name

    first_active = next((agent for agent in AGENTS if agent.status == "active"), None)
    return first_active.name if first_active else "Reception Concierge"


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
    current_total = db.query(func.count(CallSessionRecord.id)).scalar() or 0
    return f"call-{current_total + 1}"


@router.post("/voice")
def inbound_voice_webhook(
    request: Request,
    call_sid: str = Form(alias="CallSid"),
    from_number: str = Form(alias="From"),
    to_number: str = Form(alias="To"),
    db: Session = Depends(get_db),
) -> Response:
    existing = db.query(CallSessionRecord).filter(CallSessionRecord.call_sid == call_sid).first()

    if existing is None:
        db.add(
            CallSessionRecord(
                call_id=_next_call_id(db),
                call_sid=call_sid,
                agent_name=_match_agent_name_by_number(to_number),
                caller_number=from_number,
                started_at=datetime.now(timezone.utc),
                duration_seconds=0,
                status="busy",
                sentiment="neutral",
                recording_url="",
                updated_at=datetime.now(timezone.utc),
            )
        )
        db.commit()

    recording_callback_url = str(request.url_for("recording_status_webhook"))
    voice_finish_url = str(request.url_for("voice_finish_webhook"))

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        "<Say voice=\"alice\">Thanks for calling. This staging line is active and your call has been logged.</Say>"
        "<Say voice=\"alice\">After the beep, leave a short message so we can verify recording and call flow.</Say>"
        f"<Record playBeep=\"true\" timeout=\"4\" maxLength=\"120\" action=\"{voice_finish_url}\" method=\"POST\" recordingStatusCallback=\"{recording_callback_url}\" recordingStatusCallbackMethod=\"POST\"/>"
        "<Say voice=\"alice\">We did not receive audio. Goodbye.</Say>"
        "<Hangup/>"
        "</Response>"
    )

    return Response(content=twiml, media_type="application/xml")


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

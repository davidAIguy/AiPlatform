from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from backend.app.api import mock_data
from backend.app.db import PlatformSettingsRecord, SettingsAuditRecord, get_db
from backend.app.schemas import (
    PlatformSettings,
    PlatformSettingsAuditEntry,
    PlatformSettingsHistoryMeta,
    PlatformSettingsUpdate,
)
from backend.app.security import require_roles

router = APIRouter(prefix="/settings", tags=["settings"])
SENSITIVE_SETTINGS_FIELDS = {
    "openai_api_key",
    "deepgram_api_key",
    "twilio_account_sid",
    "rime_api_key",
}


def _to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


def _parse_history_timestamp(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")

    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Invalid ISO datetime: {value}",
        ) from exc

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def _to_iso_utc(value: datetime) -> str:
    if value.tzinfo is None:
        normalized = value.replace(tzinfo=timezone.utc)
    else:
        normalized = value.astimezone(timezone.utc)

    return normalized.isoformat().replace("+00:00", "Z")


def _ensure_settings_record(db: Session) -> PlatformSettingsRecord:
    record = db.query(PlatformSettingsRecord).first()

    if record is not None:
        return record

    seeded = mock_data.PLATFORM_SETTINGS
    record = PlatformSettingsRecord(
        id=1,
        openai_api_key=seeded.openai_api_key,
        deepgram_api_key=seeded.deepgram_api_key,
        twilio_account_sid=seeded.twilio_account_sid,
        rime_api_key=seeded.rime_api_key,
        enable_barge_in_interruption=seeded.enable_barge_in_interruption,
        play_latency_filler_phrase_on_timeout=seeded.play_latency_filler_phrase_on_timeout,
        allow_auto_retry_on_failed_calls=seeded.allow_auto_retry_on_failed_calls,
        updated_at=datetime.now(timezone.utc),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def _settings_record_to_schema(record: PlatformSettingsRecord) -> PlatformSettings:
    return PlatformSettings(
        openai_api_key=record.openai_api_key,
        deepgram_api_key=record.deepgram_api_key,
        twilio_account_sid=record.twilio_account_sid,
        rime_api_key=record.rime_api_key,
        enable_barge_in_interruption=record.enable_barge_in_interruption,
        play_latency_filler_phrase_on_timeout=record.play_latency_filler_phrase_on_timeout,
        allow_auto_retry_on_failed_calls=record.allow_auto_retry_on_failed_calls,
    )


def _looks_masked_secret(value: str) -> bool:
    return "*" in value


def _audit_record_to_schema(record: SettingsAuditRecord) -> PlatformSettingsAuditEntry:
    return PlatformSettingsAuditEntry(
        id=record.event_id,
        changed_at=_to_iso_utc(record.changed_at),
        actor=record.actor,
        reason=record.reason,
        changed_fields=list(record.changed_fields or []),
    )


def _filter_history_entries(
    db: Session,
    actor: Optional[str],
    changed_field: Optional[str],
    from_ts: Optional[datetime],
    to_ts: Optional[datetime],
) -> list[PlatformSettingsAuditEntry]:
    rows = db.query(SettingsAuditRecord).order_by(desc(SettingsAuditRecord.changed_at)).all()
    normalized_actor = actor.strip().lower() if actor else None
    normalized_changed_field = changed_field.strip().lower() if changed_field else None
    entries: list[PlatformSettingsAuditEntry] = []

    for row in rows:
        entry = _audit_record_to_schema(row)

        if normalized_actor and entry.actor.strip().lower() != normalized_actor:
            continue

        if normalized_changed_field and not any(
            field.strip().lower() == normalized_changed_field
            for field in entry.changed_fields
        ):
            continue

        changed_at_ts = _parse_history_timestamp(entry.changed_at)

        if from_ts and changed_at_ts < from_ts:
            continue

        if to_ts and changed_at_ts > to_ts:
            continue

        entries.append(entry)

    return entries


@router.get("", response_model=PlatformSettings)
def get_platform_settings(
    _: str = Depends(require_roles(["admin", "editor", "viewer"])),
    db: Session = Depends(get_db),
) -> PlatformSettings:
    record = _ensure_settings_record(db)
    return _settings_record_to_schema(record)


@router.get("/history", response_model=list[PlatformSettingsAuditEntry])
def get_platform_settings_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    actor: Optional[str] = Query(default=None),
    from_date: Optional[str] = Query(default=None, alias="fromDate"),
    to_date: Optional[str] = Query(default=None, alias="toDate"),
    changed_field: Optional[str] = Query(default=None, alias="changedField"),
    _: str = Depends(require_roles(["admin", "editor", "viewer"])),
    db: Session = Depends(get_db),
) -> list[PlatformSettingsAuditEntry]:
    from_ts = _parse_history_timestamp(from_date) if from_date else None
    to_ts = _parse_history_timestamp(to_date) if to_date else None

    if from_ts and to_ts and from_ts > to_ts:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="fromDate must be less than or equal to toDate",
        )

    entries = _filter_history_entries(db, actor, changed_field, from_ts, to_ts)

    return entries[offset : offset + limit]


@router.get("/history/meta", response_model=PlatformSettingsHistoryMeta)
def get_platform_settings_history_meta(
    from_date: Optional[str] = Query(default=None, alias="fromDate"),
    to_date: Optional[str] = Query(default=None, alias="toDate"),
    _: str = Depends(require_roles(["admin", "editor", "viewer"])),
    db: Session = Depends(get_db),
) -> PlatformSettingsHistoryMeta:
    from_ts = _parse_history_timestamp(from_date) if from_date else None
    to_ts = _parse_history_timestamp(to_date) if to_date else None

    if from_ts and to_ts and from_ts > to_ts:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="fromDate must be less than or equal to toDate",
        )

    entries = _filter_history_entries(
        db,
        actor=None,
        changed_field=None,
        from_ts=from_ts,
        to_ts=to_ts,
    )

    actor_set = {entry.actor for entry in entries}
    changed_field_set = {
        changed_field
        for entry in entries
        for changed_field in entry.changed_fields
    }

    return PlatformSettingsHistoryMeta(
        actors=sorted(actor_set),
        changed_fields=sorted(changed_field_set),
        total_entries=len(entries),
        earliest_changed_at=entries[-1].changed_at if entries else None,
        latest_changed_at=entries[0].changed_at if entries else None,
    )


@router.patch("", response_model=PlatformSettings)
def update_platform_settings(
    payload: PlatformSettingsUpdate,
    _: str = Depends(require_roles(["admin", "editor"])),
    db: Session = Depends(get_db),
) -> PlatformSettings:
    record = _ensure_settings_record(db)
    updates = payload.model_dump(exclude_unset=True)
    actor = (updates.pop("audit_actor", None) or "platform-admin").strip() or "platform-admin"
    reason = updates.pop("change_reason", None)
    normalized_reason = reason.strip() if isinstance(reason, str) and reason.strip() else None

    normalized_updates: dict[str, object] = {}

    for field, value in updates.items():
        if field in SENSITIVE_SETTINGS_FIELDS and isinstance(value, str) and _looks_masked_secret(value):
            continue

        normalized_updates[field] = value

    changed_fields = [
        field
        for field, value in normalized_updates.items()
        if hasattr(record, field) and getattr(record, field) != value
    ]

    if changed_fields:
        for field in changed_fields:
            setattr(record, field, normalized_updates[field])

        record.updated_at = datetime.now(timezone.utc)

        next_entry_id = f"settings-audit-{(db.query(func.count(SettingsAuditRecord.id)).scalar() or 0) + 1}"
        db.add(
            SettingsAuditRecord(
                event_id=next_entry_id,
                changed_at=datetime.now(timezone.utc),
                actor=actor,
                reason=normalized_reason,
                changed_fields=[_to_camel(field) for field in changed_fields],
            )
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    return _settings_record_to_schema(record)

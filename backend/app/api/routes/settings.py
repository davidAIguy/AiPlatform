from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from backend.app.api import mock_data
from backend.app.schemas import (
    PlatformSettings,
    PlatformSettingsAuditEntry,
    PlatformSettingsUpdate,
)

router = APIRouter(prefix="/settings", tags=["settings"])


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


@router.get("", response_model=PlatformSettings)
def get_platform_settings() -> PlatformSettings:
    return mock_data.PLATFORM_SETTINGS


@router.get("/history", response_model=list[PlatformSettingsAuditEntry])
def get_platform_settings_history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    actor: Optional[str] = Query(default=None),
    from_date: Optional[str] = Query(default=None, alias="fromDate"),
    to_date: Optional[str] = Query(default=None, alias="toDate"),
    changed_field: Optional[str] = Query(default=None, alias="changedField"),
) -> list[PlatformSettingsAuditEntry]:
    from_ts = _parse_history_timestamp(from_date) if from_date else None
    to_ts = _parse_history_timestamp(to_date) if to_date else None

    if from_ts and to_ts and from_ts > to_ts:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="fromDate must be less than or equal to toDate",
        )

    normalized_actor = actor.strip().lower() if actor else None
    normalized_changed_field = changed_field.strip().lower() if changed_field else None
    entries: list[PlatformSettingsAuditEntry] = []

    for entry in reversed(mock_data.SETTINGS_AUDIT_LOG):
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

    return entries[offset : offset + limit]


@router.patch("", response_model=PlatformSettings)
def update_platform_settings(payload: PlatformSettingsUpdate) -> PlatformSettings:
    updates = payload.model_dump(exclude_unset=True)
    actor = (updates.pop("audit_actor", None) or "platform-admin").strip() or "platform-admin"
    reason = updates.pop("change_reason", None)
    normalized_reason = reason.strip() if isinstance(reason, str) and reason.strip() else None

    changed_fields = [
        field
        for field, value in updates.items()
        if getattr(mock_data.PLATFORM_SETTINGS, field) != value
    ]

    if changed_fields:
        mock_data.PLATFORM_SETTINGS = mock_data.PLATFORM_SETTINGS.model_copy(update=updates)
        next_entry_id = f"settings-audit-{len(mock_data.SETTINGS_AUDIT_LOG) + 1}"
        mock_data.SETTINGS_AUDIT_LOG.append(
            PlatformSettingsAuditEntry(
                id=next_entry_id,
                changed_at=datetime.now(timezone.utc)
                .isoformat()
                .replace("+00:00", "Z"),
                actor=actor,
                reason=normalized_reason,
                changed_fields=[_to_camel(field) for field in changed_fields],
            )
        )

    return mock_data.PLATFORM_SETTINGS

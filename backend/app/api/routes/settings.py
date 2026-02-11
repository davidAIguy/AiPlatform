from datetime import datetime, timezone

from fastapi import APIRouter, Query

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


@router.get("", response_model=PlatformSettings)
def get_platform_settings() -> PlatformSettings:
    return mock_data.PLATFORM_SETTINGS


@router.get("/history", response_model=list[PlatformSettingsAuditEntry])
def get_platform_settings_history(
    limit: int = Query(default=20, ge=1, le=100),
) -> list[PlatformSettingsAuditEntry]:
    return list(reversed(mock_data.SETTINGS_AUDIT_LOG))[:limit]


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

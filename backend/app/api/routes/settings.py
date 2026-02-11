from fastapi import APIRouter

from backend.app.api import mock_data
from backend.app.schemas import PlatformSettings, PlatformSettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=PlatformSettings)
def get_platform_settings() -> PlatformSettings:
    return mock_data.PLATFORM_SETTINGS


@router.patch("", response_model=PlatformSettings)
def update_platform_settings(payload: PlatformSettingsUpdate) -> PlatformSettings:
    mock_data.PLATFORM_SETTINGS = mock_data.PLATFORM_SETTINGS.model_copy(
        update=payload.model_dump(exclude_unset=True)
    )
    return mock_data.PLATFORM_SETTINGS

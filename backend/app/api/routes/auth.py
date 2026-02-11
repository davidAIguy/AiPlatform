from fastapi import APIRouter, HTTPException, status

from backend.app.core.settings import get_settings
from backend.app.schemas import AuthLoginRequest, AuthLoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/login", response_model=AuthLoginResponse)
def login(payload: AuthLoginRequest) -> AuthLoginResponse:
    credential_map = {
        settings.admin_email.lower(): {
            "password": settings.admin_password,
            "token": settings.admin_api_token,
            "role": "admin",
        },
        settings.editor_email.lower(): {
            "password": settings.editor_password,
            "token": settings.editor_api_token,
            "role": "editor",
        },
        settings.viewer_email.lower(): {
            "password": settings.viewer_password,
            "token": settings.viewer_api_token,
            "role": "viewer",
        },
    }

    record = credential_map.get(payload.email.strip().lower())

    if record is None or record["password"] != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    return AuthLoginResponse(
        access_token=record["token"],
        role=record["role"],
    )

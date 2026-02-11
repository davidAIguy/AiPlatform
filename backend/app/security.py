from typing import Callable, Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.app.core.settings import get_settings

security_scheme = HTTPBearer(auto_error=False)
settings = get_settings()


def _token_to_role(token: str) -> str:
    token_map = {
        settings.admin_api_token: "admin",
        settings.editor_api_token: "editor",
        settings.viewer_api_token: "viewer",
    }

    return token_map.get(token, "")


def require_roles(allowed_roles: Iterable[str]) -> Callable:
    allowed_set = set(allowed_roles)

    def _dependency(
        credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    ) -> str:
        if not settings.auth_enabled:
            return "admin"

        if credentials is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing bearer token",
            )

        role = _token_to_role(credentials.credentials)

        if not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid bearer token",
            )

        if role not in allowed_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role",
            )

        return role

    return _dependency

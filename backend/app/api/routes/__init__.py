from backend.app.api.routes.agents import router as agents_router
from backend.app.api.routes.calls import router as calls_router
from backend.app.api.routes.dashboard import router as dashboard_router
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.organizations import router as organizations_router

__all__ = [
    "agents_router",
    "calls_router",
    "dashboard_router",
    "health_router",
    "organizations_router",
]

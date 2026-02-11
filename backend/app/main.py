from fastapi import FastAPI

from backend.app.api.routes import (
    agents_router,
    calls_router,
    dashboard_router,
    health_router,
    organizations_router,
)
from backend.app.core.settings import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)

app.include_router(health_router)
app.include_router(organizations_router, prefix="/api")
app.include_router(agents_router, prefix="/api")
app.include_router(calls_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")

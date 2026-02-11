from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import (
    agents_router,
    auth_router,
    calls_router,
    dashboard_router,
    health_router,
    organizations_router,
    settings_router,
)
from backend.app.core.settings import get_settings
from backend.app.db import initialize_database

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

cors_origins = settings.parsed_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in cors_origins else cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router, prefix="/api")
app.include_router(organizations_router, prefix="/api")
app.include_router(agents_router, prefix="/api")
app.include_router(calls_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(settings_router, prefix="/api")

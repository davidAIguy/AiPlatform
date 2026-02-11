from pathlib import Path
from typing import Generator

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import Session, declarative_base, mapped_column, sessionmaker

from backend.app.api import mock_data
from backend.app.core.settings import get_settings

settings = get_settings()


def _build_engine() -> tuple:
    database_url = settings.database_url
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, future=True, connect_args=connect_args)

    return engine, connect_args


def _ensure_sqlite_parent_dir() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    raw_path = settings.database_url.removeprefix("sqlite:///")
    db_path = Path(raw_path)

    if db_path.parent and not db_path.parent.exists():
        db_path.parent.mkdir(parents=True, exist_ok=True)


Base = declarative_base()


class PlatformSettingsRecord(Base):
    __tablename__ = "platform_settings"

    id = mapped_column(Integer, primary_key=True)
    openai_api_key = mapped_column(String(255), nullable=False)
    deepgram_api_key = mapped_column(String(255), nullable=False)
    twilio_account_sid = mapped_column(String(255), nullable=False)
    rime_api_key = mapped_column(String(255), nullable=False)
    enable_barge_in_interruption = mapped_column(Boolean, nullable=False)
    play_latency_filler_phrase_on_timeout = mapped_column(Boolean, nullable=False)
    allow_auto_retry_on_failed_calls = mapped_column(Boolean, nullable=False)
    updated_at = mapped_column(DateTime(timezone=True), nullable=False)


class SettingsAuditRecord(Base):
    __tablename__ = "settings_audit_log"

    id = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id = mapped_column(String(64), unique=True, nullable=False)
    changed_at = mapped_column(DateTime(timezone=True), nullable=False)
    actor = mapped_column(String(128), nullable=False)
    reason = mapped_column(Text, nullable=True)
    changed_fields = mapped_column(JSON, nullable=False)


_ensure_sqlite_parent_dir()
engine, _ = _build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def initialize_database() -> None:
    from datetime import datetime, timezone

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        settings_exists = db.query(PlatformSettingsRecord).first()

        if settings_exists is None:
            seeded_settings = mock_data.PLATFORM_SETTINGS
            db.add(
                PlatformSettingsRecord(
                    id=1,
                    openai_api_key=seeded_settings.openai_api_key,
                    deepgram_api_key=seeded_settings.deepgram_api_key,
                    twilio_account_sid=seeded_settings.twilio_account_sid,
                    rime_api_key=seeded_settings.rime_api_key,
                    enable_barge_in_interruption=seeded_settings.enable_barge_in_interruption,
                    play_latency_filler_phrase_on_timeout=seeded_settings.play_latency_filler_phrase_on_timeout,
                    allow_auto_retry_on_failed_calls=seeded_settings.allow_auto_retry_on_failed_calls,
                    updated_at=datetime.now(timezone.utc),
                )
            )

        audit_exists = db.query(SettingsAuditRecord).first()

        if audit_exists is None:
            for seed_entry in mock_data.SETTINGS_AUDIT_LOG:
                db.add(
                    SettingsAuditRecord(
                        event_id=seed_entry.id,
                        changed_at=datetime.fromisoformat(seed_entry.changed_at.replace("Z", "+00:00")),
                        actor=seed_entry.actor,
                        reason=seed_entry.reason,
                        changed_fields=seed_entry.changed_fields,
                    )
                )

        db.commit()

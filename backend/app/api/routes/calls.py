from datetime import timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc
from sqlalchemy.orm import Session

from backend.app.db import CallSessionRecord, get_db
from backend.app.schemas import CallSession, CallStatus

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("", response_model=list[CallSession])
def list_calls(
    status: Optional[CallStatus] = Query(default=None),
    agent_name: Optional[str] = Query(default=None, alias="agentName"),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[CallSession]:
    query = db.query(CallSessionRecord)

    if status is not None:
        query = query.filter(CallSessionRecord.status == status.value)

    if agent_name is not None:
        normalized_agent = agent_name.strip().lower()
        query = query.filter(CallSessionRecord.agent_name.ilike(normalized_agent))

    rows = query.order_by(desc(CallSessionRecord.started_at)).limit(limit).all()

    return [
        CallSession(
            id=row.call_id,
            agent_name=row.agent_name,
            caller_number=row.caller_number,
            started_at=(
                row.started_at.replace(tzinfo=timezone.utc)
                if row.started_at.tzinfo is None
                else row.started_at.astimezone(timezone.utc)
            ).strftime("%Y-%m-%d %H:%M"),
            duration_seconds=row.duration_seconds,
            status=row.status,
            sentiment=row.sentiment,
            recording_url=row.recording_url,
        )
        for row in rows
    ]

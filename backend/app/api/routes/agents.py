from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.db import AgentRecord, get_db
from backend.app.schemas import Agent, AgentCreate, AgentStatus, AgentUpdate

router = APIRouter(prefix="/agents", tags=["agents"])


def _to_schema(record: AgentRecord) -> Agent:
    return Agent(
        id=record.agent_id,
        name=record.name,
        organization_name=record.organization_name,
        model=record.model,
        voice_id=record.voice_id,
        twilio_number=record.twilio_number,
        status=record.status,
        prompt=record.prompt,
        prompt_version=record.prompt_version,
        average_latency_ms=record.average_latency_ms,
    )


def _next_agent_id(db: Session) -> str:
    numeric_ids = []

    for record in db.query(AgentRecord).all():
        try:
            numeric_ids.append(int(record.agent_id.split("-")[-1]))
        except ValueError:
            continue

    next_id = (max(numeric_ids) if numeric_ids else 0) + 1
    return f"agent-{next_id}"


@router.get("", response_model=list[Agent])
def list_agents(
    status: Optional[AgentStatus] = Query(default=None),
    organization_name: Optional[str] = Query(default=None, alias="organizationName"),
    db: Session = Depends(get_db),
) -> list[Agent]:
    query = db.query(AgentRecord)

    if status is not None:
        query = query.filter(AgentRecord.status == status.value)

    if organization_name is not None:
        normalized_org = organization_name.strip().lower()
        query = query.filter(AgentRecord.organization_name.ilike(normalized_org))

    return [_to_schema(record) for record in query.order_by(AgentRecord.id.asc()).all()]


@router.post("", response_model=Agent, status_code=status.HTTP_201_CREATED)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db)) -> Agent:
    record = AgentRecord(
        agent_id=_next_agent_id(db),
        name=payload.name,
        organization_name=payload.organization_name,
        model=payload.model,
        voice_id=payload.voice_id,
        twilio_number=payload.twilio_number,
        status=payload.status,
        prompt=payload.prompt,
        prompt_version=payload.prompt_version,
        average_latency_ms=payload.average_latency_ms,
        updated_at=datetime.now(timezone.utc),
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_schema(record)


@router.patch("/{agent_id}", response_model=Agent)
def update_agent(agent_id: str, payload: AgentUpdate, db: Session = Depends(get_db)) -> Agent:
    record = db.query(AgentRecord).filter(AgentRecord.agent_id == agent_id).first()

    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        if hasattr(record, field):
            setattr(record, field, value)

    record.updated_at = datetime.now(timezone.utc)

    db.add(record)
    db.commit()
    db.refresh(record)
    return _to_schema(record)


@router.delete("/{agent_id}", response_model=Agent)
def delete_agent(agent_id: str, db: Session = Depends(get_db)) -> Agent:
    record = db.query(AgentRecord).filter(AgentRecord.agent_id == agent_id).first()

    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    deleted = _to_schema(record)
    db.delete(record)
    db.commit()
    return deleted

from typing import Optional

from fastapi import APIRouter, Query

from backend.app.api.mock_data import CALL_SESSIONS
from backend.app.schemas import CallSession, CallStatus

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("", response_model=list[CallSession])
def list_calls(
    status: Optional[CallStatus] = Query(default=None),
    agent_name: Optional[str] = Query(default=None, alias="agentName"),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[CallSession]:
    calls = CALL_SESSIONS

    if status is not None:
        calls = [call for call in calls if call.status == status]

    if agent_name is not None:
        normalized_agent = agent_name.strip().lower()
        calls = [
            call for call in calls if call.agent_name.strip().lower() == normalized_agent
        ]

    return calls[:limit]

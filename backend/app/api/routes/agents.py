from typing import Optional

from fastapi import APIRouter, Query

from backend.app.api.mock_data import AGENTS
from backend.app.schemas import Agent, AgentStatus

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=list[Agent])
def list_agents(
    status: Optional[AgentStatus] = Query(default=None),
    organization_name: Optional[str] = Query(default=None, alias="organizationName"),
) -> list[Agent]:
    agents = AGENTS

    if status is not None:
        agents = [agent for agent in agents if agent.status == status]

    if organization_name is not None:
        normalized_org = organization_name.strip().lower()
        agents = [
            agent
            for agent in agents
            if agent.organization_name.strip().lower() == normalized_org
        ]

    return agents

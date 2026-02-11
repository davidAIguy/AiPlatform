from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from backend.app.api.mock_data import AGENTS
from backend.app.schemas import Agent, AgentCreate, AgentStatus, AgentUpdate

router = APIRouter(prefix="/agents", tags=["agents"])


def _next_agent_id() -> str:
    numeric_ids = []

    for agent in AGENTS:
        try:
            numeric_ids.append(int(agent.id.split("-")[-1]))
        except ValueError:
            continue

    next_id = (max(numeric_ids) if numeric_ids else 0) + 1
    return f"agent-{next_id}"


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


@router.post("", response_model=Agent, status_code=status.HTTP_201_CREATED)
def create_agent(payload: AgentCreate) -> Agent:
    new_agent = Agent(
        id=_next_agent_id(),
        name=payload.name,
        organization_name=payload.organization_name,
        model=payload.model,
        voice_id=payload.voice_id,
        twilio_number=payload.twilio_number,
        status=payload.status,
        prompt=payload.prompt,
        prompt_version=payload.prompt_version,
        average_latency_ms=payload.average_latency_ms,
    )

    AGENTS.append(new_agent)
    return new_agent


@router.patch("/{agent_id}", response_model=Agent)
def update_agent(agent_id: str, payload: AgentUpdate) -> Agent:
    for index, agent in enumerate(AGENTS):
        if agent.id != agent_id:
            continue

        updated_agent = agent.model_copy(update=payload.model_dump(exclude_unset=True))
        AGENTS[index] = updated_agent
        return updated_agent

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")


@router.delete("/{agent_id}", response_model=Agent)
def delete_agent(agent_id: str) -> Agent:
    for index, agent in enumerate(AGENTS):
        if agent.id != agent_id:
            continue

        return AGENTS.pop(index)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

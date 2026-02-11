from fastapi import APIRouter

from backend.app.api.mock_data import AGENTS, ORGANIZATIONS, RECENT_SESSIONS, USAGE_BY_DAY
from backend.app.schemas import AgentStatus, DashboardKpi, DashboardOverview, UsagePoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _build_kpi() -> DashboardKpi:
    total_clients = len(ORGANIZATIONS)
    active_agents = sum(1 for agent in AGENTS if agent.status == AgentStatus.active)
    total_minutes = sum(organization.monthly_minutes for organization in ORGANIZATIONS)
    average_latency = round(
        sum(agent.average_latency_ms for agent in AGENTS) / len(AGENTS)
    )
    healthy = all(agent.status != AgentStatus.error for agent in AGENTS)

    return DashboardKpi(
        total_clients=total_clients,
        active_agents=active_agents,
        total_minutes=total_minutes,
        system_latency_ms=average_latency,
        healthy=healthy,
    )


@router.get("/overview", response_model=DashboardOverview)
def dashboard_overview() -> DashboardOverview:
    return DashboardOverview(
        kpi=_build_kpi(),
        usage_by_day=USAGE_BY_DAY,
        recent_sessions=RECENT_SESSIONS,
    )


@router.get("/usage", response_model=list[UsagePoint])
def dashboard_usage() -> list[UsagePoint]:
    return USAGE_BY_DAY

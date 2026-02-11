from enum import Enum

from pydantic import BaseModel, ConfigDict


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class ApiSchema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class SubscriptionStatus(str, Enum):
    trial = "trial"
    active = "active"
    past_due = "past_due"


class AgentStatus(str, Enum):
    active = "active"
    offline = "offline"
    error = "error"


class CallStatus(str, Enum):
    completed = "completed"
    busy = "busy"
    failed = "failed"


class Sentiment(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class SessionStatus(str, Enum):
    completed = "Completed"
    failed = "Failed"
    active = "Active"


class Organization(ApiSchema):
    id: str
    name: str
    subscription_status: SubscriptionStatus
    active_agents: int
    monthly_minutes: int


class Agent(ApiSchema):
    id: str
    name: str
    organization_name: str
    model: str
    voice_id: str
    twilio_number: str
    status: AgentStatus
    prompt_version: str
    average_latency_ms: int


class CallSession(ApiSchema):
    id: str
    agent_name: str
    caller_number: str
    started_at: str
    duration_seconds: int
    status: CallStatus
    sentiment: Sentiment
    recording_url: str


class UsagePoint(ApiSchema):
    day: str
    minutes: int


class RecentSession(ApiSchema):
    client: str
    plan: str
    agent_id: str
    start_time: str
    duration: str
    status: SessionStatus


class DashboardKpi(ApiSchema):
    total_clients: int
    active_agents: int
    total_minutes: int
    system_latency_ms: int
    healthy: bool


class DashboardOverview(ApiSchema):
    kpi: DashboardKpi
    usage_by_day: list[UsagePoint]
    recent_sessions: list[RecentSession]

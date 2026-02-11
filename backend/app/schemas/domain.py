import re
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

OPENAI_KEY_PATTERN = re.compile(r"^sk-[A-Za-z0-9*._-]{10,}$")
DEEPGRAM_KEY_PATTERN = re.compile(r"^dg-[A-Za-z0-9*._-]{8,}$")
TWILIO_SID_PATTERN = re.compile(r"^AC[A-Za-z0-9*]{10,}$")
RIME_KEY_PATTERN = re.compile(r"^rm-[A-Za-z0-9*._-]{8,}$")


def _require_pattern(value: str, pattern: re.Pattern[str], message: str) -> str:
    if pattern.match(value):
        return value

    raise ValueError(message)


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
    prompt: str
    prompt_version: str
    average_latency_ms: int


class AgentCreate(ApiSchema):
    name: str
    organization_name: str
    model: str
    voice_id: str
    twilio_number: str
    status: AgentStatus = AgentStatus.active
    prompt: str
    prompt_version: str
    average_latency_ms: int = 0


class AgentUpdate(ApiSchema):
    name: Optional[str] = None
    organization_name: Optional[str] = None
    model: Optional[str] = None
    voice_id: Optional[str] = None
    twilio_number: Optional[str] = None
    status: Optional[AgentStatus] = None
    prompt: Optional[str] = None
    prompt_version: Optional[str] = None
    average_latency_ms: Optional[int] = None


class PlatformSettings(ApiSchema):
    openai_api_key: str
    deepgram_api_key: str
    twilio_account_sid: str
    rime_api_key: str
    enable_barge_in_interruption: bool
    play_latency_filler_phrase_on_timeout: bool
    allow_auto_retry_on_failed_calls: bool

    @field_validator("openai_api_key")
    @classmethod
    def validate_openai_api_key(cls, value: str) -> str:
        return _require_pattern(
            value,
            OPENAI_KEY_PATTERN,
            "openaiApiKey must start with 'sk-' and contain at least 10 additional characters",
        )

    @field_validator("deepgram_api_key")
    @classmethod
    def validate_deepgram_api_key(cls, value: str) -> str:
        return _require_pattern(
            value,
            DEEPGRAM_KEY_PATTERN,
            "deepgramApiKey must start with 'dg-' and contain at least 8 additional characters",
        )

    @field_validator("twilio_account_sid")
    @classmethod
    def validate_twilio_account_sid(cls, value: str) -> str:
        return _require_pattern(
            value,
            TWILIO_SID_PATTERN,
            "twilioAccountSid must start with 'AC' and contain at least 10 additional characters",
        )

    @field_validator("rime_api_key")
    @classmethod
    def validate_rime_api_key(cls, value: str) -> str:
        return _require_pattern(
            value,
            RIME_KEY_PATTERN,
            "rimeApiKey must start with 'rm-' and contain at least 8 additional characters",
        )


class PlatformSettingsUpdate(ApiSchema):
    openai_api_key: Optional[str] = None
    deepgram_api_key: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    rime_api_key: Optional[str] = None
    enable_barge_in_interruption: Optional[bool] = None
    play_latency_filler_phrase_on_timeout: Optional[bool] = None
    allow_auto_retry_on_failed_calls: Optional[bool] = None

    @field_validator("openai_api_key")
    @classmethod
    def validate_openai_api_key(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        return _require_pattern(
            value,
            OPENAI_KEY_PATTERN,
            "openaiApiKey must start with 'sk-' and contain at least 10 additional characters",
        )

    @field_validator("deepgram_api_key")
    @classmethod
    def validate_deepgram_api_key(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        return _require_pattern(
            value,
            DEEPGRAM_KEY_PATTERN,
            "deepgramApiKey must start with 'dg-' and contain at least 8 additional characters",
        )

    @field_validator("twilio_account_sid")
    @classmethod
    def validate_twilio_account_sid(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        return _require_pattern(
            value,
            TWILIO_SID_PATTERN,
            "twilioAccountSid must start with 'AC' and contain at least 10 additional characters",
        )

    @field_validator("rime_api_key")
    @classmethod
    def validate_rime_api_key(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        return _require_pattern(
            value,
            RIME_KEY_PATTERN,
            "rimeApiKey must start with 'rm-' and contain at least 8 additional characters",
        )


class PlatformSettingsAuditEntry(ApiSchema):
    id: str
    changed_at: str
    actor: str
    changed_fields: list[str]


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

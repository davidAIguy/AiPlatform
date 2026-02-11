from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert "service" in payload
    assert "environment" in payload


def test_organizations_endpoint() -> None:
    response = client.get("/api/organizations")

    assert response.status_code == 200
    organizations = response.json()
    assert len(organizations) >= 1
    assert "subscriptionStatus" in organizations[0]


def test_organizations_filter_by_subscription_status() -> None:
    response = client.get("/api/organizations", params={"subscriptionStatus": "active"})

    assert response.status_code == 200
    organizations = response.json()
    assert len(organizations) >= 1
    assert all(org["subscriptionStatus"] == "active" for org in organizations)


def test_agents_endpoint() -> None:
    response = client.get("/api/agents")

    assert response.status_code == 200
    agents = response.json()
    assert len(agents) >= 1
    assert "organizationName" in agents[0]


def test_agents_filter_by_status() -> None:
    response = client.get("/api/agents", params={"status": "active"})

    assert response.status_code == 200
    agents = response.json()
    assert len(agents) >= 1
    assert all(agent["status"] == "active" for agent in agents)


def test_create_agent_endpoint() -> None:
    response = client.post(
        "/api/agents",
        json={
            "name": "Retention Follow-Up",
            "organizationName": "Dental Clinic X",
            "model": "gpt-4.1-mini",
            "voiceId": "rime-luna",
            "twilioNumber": "+1 (415) 555-2222",
            "status": "active",
            "prompt": "You are a retention follow-up assistant.",
            "promptVersion": "v2.0",
            "averageLatencyMs": 640,
        },
    )

    assert response.status_code == 201
    agent = response.json()
    assert agent["id"].startswith("agent-")
    assert agent["name"] == "Retention Follow-Up"
    assert agent["organizationName"] == "Dental Clinic X"


def test_update_agent_endpoint() -> None:
    create_response = client.post(
        "/api/agents",
        json={
            "name": "Billing Assistant",
            "organizationName": "Prime Auto Group",
            "model": "gpt-4.1-mini",
            "voiceId": "rime-echo",
            "twilioNumber": "+1 (646) 555-2299",
            "status": "active",
            "prompt": "You are a billing assistant.",
            "promptVersion": "v1.0",
            "averageLatencyMs": 710,
        },
    )
    assert create_response.status_code == 201
    agent_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/agents/{agent_id}",
        json={
            "status": "offline",
            "prompt": "You are a billing assistant with offline fallback.",
            "averageLatencyMs": 777,
        },
    )

    assert update_response.status_code == 200
    agent = update_response.json()
    assert agent["id"] == agent_id
    assert agent["status"] == "offline"
    assert agent["prompt"] == "You are a billing assistant with offline fallback."
    assert agent["averageLatencyMs"] == 777


def test_delete_agent_endpoint() -> None:
    create_response = client.post(
        "/api/agents",
        json={
            "name": "Collections Bot",
            "organizationName": "Harbor Legal Services",
            "model": "gpt-4.1-mini",
            "voiceId": "rime-milo",
            "twilioNumber": "+1 (212) 555-4477",
            "status": "active",
            "prompt": "You are a collections bot.",
            "promptVersion": "v1.1",
            "averageLatencyMs": 690,
        },
    )
    assert create_response.status_code == 201
    created_agent = create_response.json()
    agent_id = created_agent["id"]

    delete_response = client.delete(f"/api/agents/{agent_id}")

    assert delete_response.status_code == 200
    deleted_agent = delete_response.json()
    assert deleted_agent["id"] == agent_id

    agents_response = client.get("/api/agents")
    assert agents_response.status_code == 200
    agents = agents_response.json()
    assert all(agent["id"] != agent_id for agent in agents)


def test_calls_endpoint_with_limit() -> None:
    response = client.get("/api/calls", params={"limit": 2})

    assert response.status_code == 200
    calls = response.json()
    assert len(calls) == 2
    assert "agentName" in calls[0]


def test_dashboard_overview_endpoint() -> None:
    response = client.get("/api/dashboard/overview")

    assert response.status_code == 200
    overview = response.json()
    assert "kpi" in overview
    assert "usageByDay" in overview
    assert "recentSessions" in overview


def test_dashboard_usage_endpoint() -> None:
    response = client.get("/api/dashboard/usage")

    assert response.status_code == 200
    usage = response.json()
    assert len(usage) == 7
    assert "day" in usage[0]
    assert "minutes" in usage[0]


def test_settings_endpoint() -> None:
    response = client.get("/api/settings")

    assert response.status_code == 200
    settings = response.json()
    assert "openaiApiKey" in settings
    assert "enableBargeInInterruption" in settings


def test_update_settings_endpoint() -> None:
    response = client.patch(
        "/api/settings",
        json={
            "allowAutoRetryOnFailedCalls": True,
            "playLatencyFillerPhraseOnTimeout": False,
        },
    )

    assert response.status_code == 200
    settings = response.json()
    assert settings["allowAutoRetryOnFailedCalls"] is True
    assert settings["playLatencyFillerPhraseOnTimeout"] is False

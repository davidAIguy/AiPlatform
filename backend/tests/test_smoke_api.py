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

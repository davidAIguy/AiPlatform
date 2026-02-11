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


def test_settings_history_endpoint() -> None:
    response = client.get("/api/settings/history", params={"limit": 5})

    assert response.status_code == 200
    entries = response.json()
    assert len(entries) >= 1
    assert "changedAt" in entries[0]
    assert "changedFields" in entries[0]


def test_settings_history_meta_endpoint() -> None:
    response = client.get("/api/settings/history/meta")

    assert response.status_code == 200
    payload = response.json()
    assert "actors" in payload
    assert "changedFields" in payload
    assert "totalEntries" in payload
    assert isinstance(payload["actors"], list)
    assert isinstance(payload["changedFields"], list)


def test_settings_history_filters_by_actor_and_date() -> None:
    current_settings_response = client.get("/api/settings")
    assert current_settings_response.status_code == 200
    current_settings = current_settings_response.json()

    update_response = client.patch(
        "/api/settings",
        json={
            "allowAutoRetryOnFailedCalls": not current_settings["allowAutoRetryOnFailedCalls"],
            "auditActor": "history-filter-user",
            "changeReason": "Verify actor/date filters",
        },
    )
    assert update_response.status_code == 200

    actor_filtered_response = client.get(
        "/api/settings/history",
        params={"actor": "history-filter-user", "limit": 10},
    )
    assert actor_filtered_response.status_code == 200
    actor_entries = actor_filtered_response.json()
    assert len(actor_entries) >= 1
    assert all(entry["actor"] == "history-filter-user" for entry in actor_entries)

    changed_field_response = client.get(
        "/api/settings/history",
        params={
            "changedField": "allowAutoRetryOnFailedCalls",
            "limit": 10,
        },
    )
    assert changed_field_response.status_code == 200
    changed_field_entries = changed_field_response.json()
    assert len(changed_field_entries) >= 1
    assert all(
        "allowAutoRetryOnFailedCalls" in entry["changedFields"]
        for entry in changed_field_entries
    )

    anchor_entry = actor_entries[0]
    date_filtered_response = client.get(
        "/api/settings/history",
        params={
            "fromDate": anchor_entry["changedAt"],
            "toDate": anchor_entry["changedAt"],
            "limit": 10,
        },
    )
    assert date_filtered_response.status_code == 200
    date_entries = date_filtered_response.json()
    assert any(entry["id"] == anchor_entry["id"] for entry in date_entries)

    paged_response = client.get(
        "/api/settings/history",
        params={
            "limit": 1,
            "offset": 1,
        },
    )
    assert paged_response.status_code == 200
    paged_entries = paged_response.json()
    assert len(paged_entries) <= 1


def test_settings_history_rejects_invalid_date_range() -> None:
    response = client.get(
        "/api/settings/history",
        params={
            "fromDate": "2026-02-11T00:00:00Z",
            "toDate": "2026-02-10T00:00:00Z",
        },
    )

    assert response.status_code == 422


def test_update_settings_endpoint() -> None:
    current_settings_response = client.get("/api/settings")
    assert current_settings_response.status_code == 200
    current_settings = current_settings_response.json()
    next_auto_retry = not current_settings["allowAutoRetryOnFailedCalls"]
    next_latency_filler = not current_settings["playLatencyFillerPhraseOnTimeout"]

    before_response = client.get("/api/settings/history")
    assert before_response.status_code == 200
    before_entries = before_response.json()

    response = client.patch(
        "/api/settings",
        json={
            "allowAutoRetryOnFailedCalls": next_auto_retry,
            "playLatencyFillerPhraseOnTimeout": next_latency_filler,
            "auditActor": "qa-admin",
            "changeReason": "Enable retries for resilience test.",
        },
    )

    assert response.status_code == 200
    settings = response.json()
    assert settings["allowAutoRetryOnFailedCalls"] is next_auto_retry
    assert settings["playLatencyFillerPhraseOnTimeout"] is next_latency_filler

    after_response = client.get("/api/settings/history")
    assert after_response.status_code == 200
    after_entries = after_response.json()
    assert len(after_entries) == len(before_entries) + 1

    latest_entry = after_entries[0]
    assert latest_entry["actor"] == "qa-admin"
    assert latest_entry["reason"] == "Enable retries for resilience test."
    assert "allowAutoRetryOnFailedCalls" in latest_entry["changedFields"]
    assert "playLatencyFillerPhraseOnTimeout" in latest_entry["changedFields"]


def test_update_settings_without_changes_does_not_append_history() -> None:
    baseline_response = client.get("/api/settings")
    assert baseline_response.status_code == 200
    baseline_settings = baseline_response.json()

    before_history_response = client.get("/api/settings/history")
    assert before_history_response.status_code == 200
    before_entries = before_history_response.json()

    update_response = client.patch(
        "/api/settings",
        json={
            "allowAutoRetryOnFailedCalls": baseline_settings["allowAutoRetryOnFailedCalls"],
            "auditActor": "qa-admin",
            "changeReason": "No-op verification",
        },
    )
    assert update_response.status_code == 200

    after_history_response = client.get("/api/settings/history")
    assert after_history_response.status_code == 200
    after_entries = after_history_response.json()

    assert len(after_entries) == len(before_entries)


def test_update_settings_rejects_invalid_keys() -> None:
    response = client.patch(
        "/api/settings",
        json={
            "openaiApiKey": "invalid-key",
        },
    )

    assert response.status_code == 422
    payload = response.json()
    assert "detail" in payload

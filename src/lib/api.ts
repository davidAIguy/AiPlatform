import {
  Agent,
  AgentCreateInput,
  AgentUpdateInput,
  CallSession,
  DashboardOverview,
  Organization,
  PlatformSettings,
  PlatformSettingsUpdateInput,
} from '../types/domain';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function sendJson<T>(path: string, method: 'POST' | 'PATCH', payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function deleteJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function listOrganizations(subscriptionStatus?: Organization['subscriptionStatus']) {
  const params = new URLSearchParams();

  if (subscriptionStatus) {
    params.set('subscriptionStatus', subscriptionStatus);
  }

  const query = params.toString();
  return getJson<Organization[]>(`/api/organizations${query ? `?${query}` : ''}`);
}

export function listAgents(filters?: { status?: Agent['status']; organizationName?: string }) {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set('status', filters.status);
  }

  if (filters?.organizationName) {
    params.set('organizationName', filters.organizationName);
  }

  const query = params.toString();
  return getJson<Agent[]>(`/api/agents${query ? `?${query}` : ''}`);
}

export function createAgent(payload: AgentCreateInput) {
  return sendJson<Agent>('/api/agents', 'POST', payload);
}

export function updateAgent(agentId: string, payload: AgentUpdateInput) {
  return sendJson<Agent>(`/api/agents/${agentId}`, 'PATCH', payload);
}

export function deleteAgent(agentId: string) {
  return deleteJson<Agent>(`/api/agents/${agentId}`);
}

export function listCalls(filters?: { status?: CallSession['status']; agentName?: string; limit?: number }) {
  const params = new URLSearchParams();

  if (filters?.status) {
    params.set('status', filters.status);
  }

  if (filters?.agentName) {
    params.set('agentName', filters.agentName);
  }

  if (typeof filters?.limit === 'number') {
    params.set('limit', String(filters.limit));
  }

  const query = params.toString();
  return getJson<CallSession[]>(`/api/calls${query ? `?${query}` : ''}`);
}

export function getDashboardOverview() {
  return getJson<DashboardOverview>('/api/dashboard/overview');
}

export function getPlatformSettings() {
  return getJson<PlatformSettings>('/api/settings');
}

export function updatePlatformSettings(payload: PlatformSettingsUpdateInput) {
  return sendJson<PlatformSettings>('/api/settings', 'PATCH', payload);
}

import {
  Agent,
  AgentCreateInput,
  AgentUpdateInput,
  CallSession,
  DashboardOverview,
  Organization,
  PlatformSettings,
  PlatformSettingsAuditEntry,
  PlatformSettingsUpdateInput,
} from '../types/domain';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

async function toRequestError(response: Response): Promise<Error> {
  let detailMessage = '';

  try {
    const payload = (await response.json()) as { detail?: unknown };

    if (typeof payload.detail === 'string') {
      detailMessage = payload.detail;
    } else if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      const firstIssue = payload.detail[0] as { msg?: string } | undefined;
      detailMessage = firstIssue?.msg ?? '';
    }
  } catch {
    detailMessage = '';
  }

  const fallback = `Request failed: ${response.status} ${response.statusText}`;
  return new Error(detailMessage || fallback);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw await toRequestError(response);
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
    throw await toRequestError(response);
  }

  return response.json() as Promise<T>;
}

async function deleteJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw await toRequestError(response);
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

export function listPlatformSettingsHistory(filters?: {
  limit?: number;
  offset?: number;
  actor?: string;
  fromDate?: string;
  toDate?: string;
  changedField?: string;
}) {
  const params = new URLSearchParams();

  params.set('limit', String(filters?.limit ?? 20));

  if (typeof filters?.offset === 'number') {
    params.set('offset', String(filters.offset));
  }

  if (filters?.actor) {
    params.set('actor', filters.actor);
  }

  if (filters?.fromDate) {
    params.set('fromDate', filters.fromDate);
  }

  if (filters?.toDate) {
    params.set('toDate', filters.toDate);
  }

  if (filters?.changedField) {
    params.set('changedField', filters.changedField);
  }

  return getJson<PlatformSettingsAuditEntry[]>(`/api/settings/history?${params.toString()}`);
}

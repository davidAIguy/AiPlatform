import { Agent, CallSession, DashboardOverview, Organization } from '../types/domain';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

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

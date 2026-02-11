export type AgentStatus = 'active' | 'offline' | 'error';

export interface Organization {
  id: string;
  name: string;
  subscriptionStatus: 'trial' | 'active' | 'past_due';
  activeAgents: number;
  monthlyMinutes: number;
}

export interface Agent {
  id: string;
  name: string;
  organizationName: string;
  model: string;
  voiceId: string;
  twilioNumber: string;
  status: AgentStatus;
  prompt: string;
  promptVersion: string;
  averageLatencyMs: number;
}

export interface AgentCreateInput {
  name: string;
  organizationName: string;
  model: string;
  voiceId: string;
  twilioNumber: string;
  status: AgentStatus;
  prompt: string;
  promptVersion: string;
  averageLatencyMs: number;
}

export interface AgentUpdateInput {
  name?: string;
  organizationName?: string;
  model?: string;
  voiceId?: string;
  twilioNumber?: string;
  status?: AgentStatus;
  prompt?: string;
  promptVersion?: string;
  averageLatencyMs?: number;
}

export interface CallSession {
  id: string;
  agentName: string;
  callerNumber: string;
  startedAt: string;
  durationSeconds: number;
  status: 'completed' | 'busy' | 'failed';
  sentiment: 'positive' | 'neutral' | 'negative';
  recordingUrl: string;
}

export interface UsagePoint {
  day: string;
  minutes: number;
}

export interface RecentSession {
  client: string;
  plan: string;
  agentId: string;
  startTime: string;
  duration: string;
  status: 'Completed' | 'Failed' | 'Active';
}

export interface DashboardKpi {
  totalClients: number;
  activeAgents: number;
  totalMinutes: number;
  systemLatencyMs: number;
  healthy: boolean;
}

export interface DashboardOverview {
  kpi: DashboardKpi;
  usageByDay: UsagePoint[];
  recentSessions: RecentSession[];
}

export interface PlatformSettings {
  openaiApiKey: string;
  deepgramApiKey: string;
  twilioAccountSid: string;
  rimeApiKey: string;
  enableBargeInInterruption: boolean;
  playLatencyFillerPhraseOnTimeout: boolean;
  allowAutoRetryOnFailedCalls: boolean;
}

export interface PlatformSettingsUpdateInput {
  openaiApiKey?: string;
  deepgramApiKey?: string;
  twilioAccountSid?: string;
  rimeApiKey?: string;
  enableBargeInInterruption?: boolean;
  playLatencyFillerPhraseOnTimeout?: boolean;
  allowAutoRetryOnFailedCalls?: boolean;
}

export interface PlatformSettingsAuditEntry {
  id: string;
  changedAt: string;
  actor: string;
  changedFields: string[];
}

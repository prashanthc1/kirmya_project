import { authApiClient } from '../../../services/authService';

export interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown' | 'disabled' | 'maintenance';
  weight: 'critical' | 'important' | 'optional';
  latencyMs: number;
  lastChecked: string;
  message: string;
  metricsDetails?: Record<string, any>;
  circuitBreakerStatus?: 'closed' | 'open' | 'half_open';
  recentFailures: number;
}

export interface OverallHealthSummary {
  status: 'healthy' | 'degraded' | 'critical' | 'maintenance';
  version: string;
  buildSha: string;
  uptimeSeconds: number;
  isMaintenance: boolean;
  components: Record<string, ComponentHealth>;
  activeIncidents: number;
  checkedAt: string;
}

export interface HealthIncident {
  id: string;
  componentName: string;
  severity: string;
  status: string;
  failureType: string;
  errorMessage: string;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt?: string;
  dedupCount: number;
  createdAt: string;
}

export interface HealthRecoveryAction {
  id: string;
  actionType: string;
  componentName: string;
  status: string;
  resultSummary: string;
  executedBy?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface MaintenanceModeConfig {
  id: string;
  isEnabled: boolean;
  reason: string;
  allowedAdminIds: string[];
  enabledBy?: string;
  enabledAt?: string;
  disabledAt?: string;
  createdAt: string;
}

export interface DiagnosticReport {
  reportId: string;
  generatedAt: string;
  expiresAt: string;
  downloadUrl: string;
  overallStatus: string;
  systemComponents: Record<string, ComponentHealth>;
  activeIncidents: HealthIncident[];
  recentRecoveryLogs: HealthRecoveryAction[];
  configurationSummary: Record<string, string>;
}

const apiClient = authApiClient;

export const systemHealthApi = {
  // Public status
  async getPublicStatus(): Promise<{ overallStatus: string; isMaintenance: boolean; publicComponents: Record<string, string>; checkedAt: string }> {
    const res = await apiClient.get('/status');
    return res.data;
    
  },

  // Admin Health Summary
  async getAdminHealthSummary(): Promise<OverallHealthSummary> {
    const res = await apiClient.get<OverallHealthSummary>('/admin/system/health');
    return res.data;
    
  },

  // Trigger Self-Healing Action
  async triggerSelfHealing(actionType: string, componentName: string): Promise<HealthRecoveryAction> {
    const res = await apiClient.post<HealthRecoveryAction>('/admin/system/health/self-healing', { actionType, componentName });
    return res.data;
  },

  // Toggle Maintenance Mode
  async toggleMaintenanceMode(enable: boolean, reason: string, allowedAdminIds: string[] = []): Promise<MaintenanceModeConfig> {
    const res = await apiClient.post<MaintenanceModeConfig>('/admin/system/health/maintenance', { enable, reason, allowedAdminIds });
    return res.data;
  },

  // Generate Diagnostic Report
  async generateDiagnosticReport(): Promise<DiagnosticReport> {
    const res = await apiClient.post<DiagnosticReport>('/admin/system/health/diagnostics/report');
    return res.data;
  },

  // Incidents & Recoveries
  async listIncidents(): Promise<HealthIncident[]> {
    const res = await apiClient.get<HealthIncident[]>('/admin/system/health/incidents');
    return res.data;
    
  },

  async listRecoveryActions(): Promise<HealthRecoveryAction[]> {
    const res = await apiClient.get<HealthRecoveryAction[]>('/admin/system/health/recoveries');
    return res.data;
    
  },
};

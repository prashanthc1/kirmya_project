import { authApiClient } from '../../../services/authService';

export interface ObservabilitySummary {
  status: string;
  environment: string;
  timestamp: string;
  api_requests_per_min: number;
  error_rate_pct: number;
  api_p50_latency_ms: number;
  api_p95_latency_ms: number;
  api_p99_latency_ms: number;
  db_pool_active: number;
  db_pool_idle: number;
  redis_hit_ratio_pct: number;
  worker_queue_depth: number;
  active_websockets: number;
  active_incidents_cnt: number;
}

export interface DependencyHealthItem {
  status: string;
  latency_ms?: number;
}

export interface ObservabilityHealthReport {
  status: string;
  dependencies: Record<string, DependencyHealthItem>;
}

export interface OperationalIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  affected_area: string;
  description: string;
  created_at: string;
}

const apiClient = authApiClient;

export const observabilityApi = {
  async getSummary(): Promise<ObservabilitySummary> {
    const res = await apiClient.get<ObservabilitySummary>('/admin/observability');
    return res.data;
    
  },

  async getHealth(): Promise<ObservabilityHealthReport> {
    const res = await apiClient.get<ObservabilityHealthReport>('/admin/observability/health');
    return res.data;
    
  },

  async getIncidents(): Promise<OperationalIncident[]> {
    const res = await apiClient.get<OperationalIncident[]>('/admin/observability/incidents');
    return res.data;
    
  },
};

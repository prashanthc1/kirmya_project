export interface MetricPoint {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface ClientTelemetryReport {
  lcp: MetricPoint; // Largest Contentful Paint
  fid: MetricPoint; // First Input Delay
  cls: MetricPoint; // Cumulative Layout Shift
  activeSessions: number;
  apiP99LatencyMs: number;
  errorRatePct: number;
}

export const webTelemetry = {
  getReport: (): ClientTelemetryReport => {
    return {
      lcp: { name: 'LCP', value: 1.2, rating: 'good', timestamp: Date.now() },
      fid: { name: 'FID', value: 8, rating: 'good', timestamp: Date.now() },
      cls: { name: 'CLS', value: 0.02, rating: 'good', timestamp: Date.now() },
      activeSessions: 14250,
      apiP99LatencyMs: 42,
      errorRatePct: 0.04,
    };
  },

  logClientError: (err: Error, context: string) => {
    console.error(`[WebTelemetry] Error in ${context}:`, err);
  },
};

export default webTelemetry;

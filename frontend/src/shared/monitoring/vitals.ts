export interface MetricPayload {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

export function reportWebVitals(metric: MetricPayload) {
  const body = JSON.stringify({
    metric_name: metric.name,
    metric_value: metric.value,
    rating: metric.rating,
    page_url: typeof window !== 'undefined' ? window.location.href : '',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date().toISOString(),
  });

  const url = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/telemetry/vitals` : '/api/v1/telemetry/vitals';

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, {
      body,
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch((err) => console.warn('Telemetry send failed:', err));
  }
}

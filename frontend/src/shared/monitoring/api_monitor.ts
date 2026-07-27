import axios from 'axios';

export function setupAPIMonitoring() {
  axios.interceptors.request.use((config) => {
    (config as any).metadata = { startTime: Date.now() };
    return config;
  });

  axios.interceptors.response.use(
    (response) => {
      const startTime = (response.config as any).metadata?.startTime;
      if (startTime) {
        const duration = Date.now() - startTime;
        if (duration > 1500) {
          console.warn(`[API Performance Warning] Slow API call: ${response.config.url} took ${duration}ms`);
        }
      }
      return response;
    },
    (error) => {
      const config = error.config || {};
      const status = error.response ? error.response.status : 0;
      const url = config.url || 'unknown';

      console.error(`[API Failure Monitor] Endpoint ${url} failed with status ${status}:`, error.message);

      // Report client-side API failure telemetry
      const payload = {
        event_type: 'CLIENT_API_FAILURE',
        endpoint: url,
        status_code: status,
        error_message: error.message,
        timestamp: new Date().toISOString(),
      };

      const telemetryUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/telemetry/client-errors`;
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(telemetryUrl, JSON.stringify(payload));
      }

      return Promise.reject(error);
    }
  );
}

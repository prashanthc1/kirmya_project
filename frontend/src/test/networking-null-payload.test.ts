import { describe, it, expect, vi, beforeEach } from 'vitest';

// Go marshals nil slices as JSON null: a 200 with `data: null` must not crash callers.
const get = vi.fn();

vi.mock('../services/authService', () => ({
  API_BASE_URL: 'http://127.0.0.1:8080/api/v1',
  extractApiError: (err: any, fallback = 'error') => ({ message: err?.response?.data?.error || err?.message || fallback }),
  authApiClient: { get: (...args: unknown[]) => get(...args) },
}));

import { networkingApi } from '../features/networking/services/networkingApi';

describe('networkingApi null list payloads', () => {
  beforeEach(() => {
    get.mockReset();
    get.mockResolvedValue({ data: null });
  });

  it('returns empty arrays instead of null', async () => {
    expect(await networkingApi.listConnections()).toEqual([]);
    expect(await networkingApi.listIncomingRequests()).toEqual([]);
    expect(await networkingApi.getSuggestions()).toEqual([]);
    expect(await networkingApi.getNetworkingGoals()).toEqual([]);
  });
});

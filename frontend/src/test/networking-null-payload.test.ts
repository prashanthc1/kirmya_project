import { describe, it, expect, vi, beforeEach } from 'vitest';

// Go marshals nil slices as JSON null: a 200 with `data: null` must not crash callers.
const get = vi.fn();

vi.mock('../services/authService', () => ({
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

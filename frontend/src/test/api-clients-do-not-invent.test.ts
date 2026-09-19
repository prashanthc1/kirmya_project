import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { adminApi } from '../features/admin/services/adminApi';
import { authApiClient } from '../services/authService';

/**
 * No API client answers a failure with fabricated data.
 *
 * F24 was found by scanning for specific invented names, which caught fourteen
 * files. The defect underneath was wider: 120 places across fourteen API
 * clients wrote
 *
 *     try { return (await apiClient.get(...)).data } catch { return [ ...  ] }
 *
 * so a 404, a 500 or an expired session produced a plausible answer instead of
 * an error. Every consumer downstream - loading state, error state, the reader -
 * was told the request had succeeded. The admin dashboard reported 9,800
 * verified users and 32,900 applications this way; the impersonation call
 * fabricated an *active session* when it failed.
 *
 * The rule is the same one the server side adopted in batch 5: an error is
 * reported, and empty is empty. This test is what stops the pattern returning.
 */

const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const sourceFiles = (dir: string, found: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'test', '__tests__'].includes(entry.name)) continue;
      sourceFiles(full, found);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
};

describe('API clients', () => {
  it('never answer a failed request with a literal', () => {
    const root = path.resolve(__dirname, '..');
    // A catch block whose body begins by returning an array or object literal,
    // or by reaching for a MOCK_ fixture.
    const fabricating = /catch\s*(?:\([^)]*\))?\s*\{\s*(?:return\s*[[{]|[^}]{0,200}?MOCK_)/;

    const offenders = sourceFiles(path.join(root, 'features'))
      .filter(file => fabricating.test(stripComments(fs.readFileSync(file, 'utf8'))))
      .map(file => path.relative(root, file).split(path.sep).join('/'))
      .sort();

    expect(
      offenders,
      'these answer a failed request with invented data instead of reporting it'
    ).toEqual([]);
  });

  it('holds for the whole of src, not only the feature clients', () => {
    const root = path.resolve(__dirname, '..');
    const fabricating = /catch\s*(?:\([^)]*\))?\s*\{\s*return\s*[[{]/;
    const offenders = sourceFiles(root)
      .filter(file => fabricating.test(stripComments(fs.readFileSync(file, 'utf8'))))
      .map(file => path.relative(root, file).split(path.sep).join('/'))
      .sort();
    expect(offenders).toEqual([]);
  });

  it('adminApi surfaces API errors and does not invent data on failure', async () => {
    const error = new Error('500 Internal Server Error');
    const getSpy = vi.spyOn(authApiClient, 'get').mockRejectedValue(error);
    const postSpy = vi.spyOn(authApiClient, 'post').mockRejectedValue(error);
    const putSpy = vi.spyOn(authApiClient, 'put').mockRejectedValue(error);

    try {
      await expect(adminApi.createIncident({ title: 'Test Incident' })).rejects.toThrow('500 Internal Server Error');
      await expect(adminApi.listIncidents()).rejects.toThrow('500 Internal Server Error');
      await expect(adminApi.listBackgroundJobs()).rejects.toThrow('500 Internal Server Error');
      await expect(adminApi.getMaintenanceModeConfig()).rejects.toThrow('500 Internal Server Error');
      await expect(adminApi.listImpersonationSessions()).rejects.toThrow('500 Internal Server Error');
      await expect(adminApi.getDashboardStats()).rejects.toThrow('500 Internal Server Error');
    } finally {
      getSpy.mockRestore();
      postSpy.mockRestore();
      putSpy.mockRestore();
    }
  });
});

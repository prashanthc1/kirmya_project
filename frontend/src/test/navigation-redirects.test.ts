import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import nextConfig from '../../next.config.mjs';

const redirects = async () => (await (nextConfig as any).redirects()) as Array<{
  source: string;
  destination: string;
  permanent: boolean;
}>;

describe('route consolidation', () => {
  it('sends the generic user dashboard to the feed', async () => {
    const rule = (await redirects()).find(r => r.source === '/dashboard');
    expect(rule).toBeDefined();
    expect(rule!.destination).toBe('/feed');
    expect(rule!.permanent).toBe(true);
  });

  it('sends every duplicated dashboard sub-page to its canonical route', async () => {
    const all = await redirects();
    const expected: Record<string, string> = {
      '/dashboard/applications': '/applications',
      '/dashboard/saved-jobs': '/saved-jobs',
      '/dashboard/jobs': '/jobs',
      '/dashboard/job-alerts': '/job-alerts',
      '/dashboard/job-recommendations': '/jobs/recommendations',
      '/dashboard/recommended-jobs': '/jobs/recommendations',
    };
    for (const [source, destination] of Object.entries(expected)) {
      const rule = all.find(r => r.source === source);
      expect(rule, `no redirect for ${source}`).toBeDefined();
      expect(rule!.destination).toBe(destination);
    }
  });

  it('retires the duplicate module prefixes', async () => {
    const all = await redirects();
    expect(all.find(r => r.source === '/messaging')?.destination).toBe('/messages');
    expect(all.find(r => r.source === '/networking')?.destination).toBe('/network');
  });

  it('cannot loop: no destination is itself a redirect source', async () => {
    const all = await redirects();
    const sources = new Set(all.map(r => r.source));
    const looping = all.filter(r => sources.has(r.destination));
    expect(looping.map(r => `${r.source} -> ${r.destination}`)).toEqual([]);
  });

  it('redirects only paths that no longer serve a page', async () => {
    const appDir = path.resolve(__dirname, '..', 'app');
    const exists = (route: string) =>
      fs.existsSync(path.join(appDir, ...route.split('/').filter(Boolean), 'page.tsx'));
    for (const rule of await redirects()) {
      if (rule.source.includes(':')) continue;
      expect(exists(rule.source), `${rule.source} both redirects and renders`).toBe(false);
    }
  });
});

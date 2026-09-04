import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('../services/authService', () => ({
  authApiClient: {
    get: vi.fn((url: string) => {
      if (url === '/feed') {
        return Promise.resolve({
          data: {
            items: [
              {
                id: 'feed-item-1',
                itemType: 'job',
                score: 95,
                rationale: '95% Match on Go, PostgreSQL',
                timestamp: new Date().toISOString(),
                job: {
                  id: 'job-1',
                  title: 'Senior Go Backend Architect',
                  company: 'Stripe Global',
                  location: 'Dubai',
                  salaryMax: 25000,
                  currency: 'AED',
                  industry: 'Technology',
                  requiredSkills: ['Go', 'PostgreSQL', 'Redis'],
                },
              },
              {
                id: 'feed-item-2',
                itemType: 'person',
                score: 90,
                rationale: 'Shared connection with Salim',
                timestamp: new Date().toISOString(),
                person: {
                  userId: 'user-2',
                  name: 'Ayesha Siddiqui',
                  headline: 'Lead Cloud Architect',
                  location: 'Dubai',
                  industry: 'Technology',
                  mutualCount: 2,
                  sharedSkills: ['Go', 'Docker'],
                  matchScore: 90,
                  reason: '2 mutual connections',
                },
              },
            ],
            nextCursor: 'next-page-cursor',
            hasMore: true,
            totalCount: 2,
          },
        });
      }
      if (url === '/recommendations') {
        return Promise.resolve({
          data: [
            {
              id: 'rec-1',
              userId: 'user-1',
              jobId: 'job-1',
              matchScore: 95,
              matchReasons: '["Matches target title", "Matches core skills"]',
              isActive: true,
              jobDetails: {
                id: 'job-1',
                title: 'Senior Go Backend Architect',
                company: 'Stripe Global',
                location: 'Dubai',
                salaryMax: 25000,
                currency: 'AED',
                industry: 'Technology',
                requiredSkills: ['Go', 'PostgreSQL'],
              },
            },
          ],
        });
      }
      if (url === '/recommendations/preferences') {
        return Promise.resolve({
          data: {
            preferredTitles: ['Go Backend Architect'],
            preferredLocations: ['Dubai'],
            preferredIndustries: ['Technology'],
            minSalary: 20000,
            currency: 'AED',
          },
        });
      }
      if (url === '/recommendation-engine/unified') {
        return Promise.resolve({
          data: {
            jobs: [{ item_id: 'job-1', title: 'Senior Go Architect', match_score: 95 }],
            people: [{ item_id: 'p-1', title: 'Sarah Chen', match_score: 92 }],
            communities: [],
            courses: [],
            events: [],
            candidates: [],
            talent_pools: [],
          },
        });
      }
      if (url === '/recommendation-engine/career-gaps') {
        return Promise.resolve({
          data: {
            targetRole: 'Principal Distributed Systems Architect',
            currentSkills: ['Go', 'PostgreSQL'],
            missingSkills: [{ skillName: 'eBPF', category: 'Observability' }],
          },
        });
      }
      if (url === '/admin/recommendations/config') {
        return Promise.resolve({
          data: {
            id: 'conf-1',
            modelName: 'kirmya_hybrid_v1',
            algorithmVersion: 'v1.4.0',
            skillMatchWeight: 0.35,
            titleMatchWeight: 0.25,
          },
        });
      }
      if (url === '/admin/recommendations/metrics') {
        return Promise.resolve({
          data: [
            { id: '1', itemType: 'job', totalImpressions: 1000 },
          ],
        });
      }
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn(() => Promise.resolve({ data: { message: 'success' } })),
    put: vi.fn((_url: string, data: any) => Promise.resolve({ data })),
    delete: vi.fn(() => Promise.resolve({ data: { message: 'deleted' } })),
  },
}));

import { DiscoveryCard, PersonalizedFeedStream } from '../components/recommendations';
import { recommendationApi as recApi } from '../features/recommendation/services/recommendationApi';
import { recommendationApi as recEngineApi } from '../features/recommendation_engine/api';

describe('Recommendation, Personalization & Feed Intelligence Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders DiscoveryCard with Job details and match score badge', () => {
    const jobItem = {
      id: 'item-1',
      itemType: 'job' as const,
      score: 95,
      rationale: '95% Match on Go, PostgreSQL',
      timestamp: new Date().toISOString(),
      job: {
        id: 'job-1',
        title: 'Senior Go Backend Architect',
        company: 'Stripe Global',
        location: 'Dubai',
        salaryMax: 25000,
        currency: 'AED',
        industry: 'Technology',
        requiredSkills: ['Go', 'PostgreSQL', 'Redis'],
      },
    };

    render(<DiscoveryCard item={jobItem} />);
    expect(screen.getByText('Senior Go Backend Architect')).toBeInTheDocument();
    expect(screen.getByText(/Stripe Global/i)).toBeInTheDocument();
    expect(screen.getAllByText(/95% Match/i).length).toBeGreaterThan(0);
    expect(screen.getByText('95% Match on Go, PostgreSQL')).toBeInTheDocument();
  });

  it('renders DiscoveryCard with Person details and mutual connections', () => {
    const personItem = {
      id: 'item-2',
      itemType: 'person' as const,
      score: 88,
      rationale: 'Shares 2 mutual connections',
      timestamp: new Date().toISOString(),
      person: {
        userId: 'user-2',
        name: 'Ayesha Siddiqui',
        headline: 'Lead Cloud Architect',
        location: 'Dubai',
        industry: 'Technology',
        mutualCount: 2,
        sharedSkills: ['Go', 'Docker'],
        matchScore: 88,
        reason: '2 mutual connections',
      },
    };

    render(<DiscoveryCard item={personItem} />);
    expect(screen.getByText('Ayesha Siddiqui')).toBeInTheDocument();
    expect(screen.getByText('Lead Cloud Architect')).toBeInTheDocument();
    expect(screen.getAllByText(/2 mutual connections/i).length).toBeGreaterThan(0);
  });

  it('renders PersonalizedFeedStream and fetches feed items', async () => {
    render(<PersonalizedFeedStream />);
    await waitFor(() => {
      expect(screen.getByText('Senior Go Backend Architect')).toBeInTheDocument();
      expect(screen.getByText('Ayesha Siddiqui')).toBeInTheDocument();
    });
  });

  it('fetches feed via recommendationApi', async () => {
    const feed = await recApi.getFeed();
    expect(feed.items.length).toBe(2);
    expect(feed.hasMore).toBe(true);
    expect(feed.nextCursor).toBe('next-page-cursor');
  });

  it('fetches recommendations and preferences via recommendationApi', async () => {
    const recs = await recApi.getRecommendations();
    expect(recs.length).toBe(1);
    expect(recs[0].jobDetails?.title).toBe('Senior Go Backend Architect');

    const prefs = await recApi.getPreferences();
    expect(prefs.preferredTitles).toContain('Go Backend Architect');
  });

  it('fetches unified recommendations and admin config via recommendation_engine api', async () => {
    const unified = await recEngineApi.getUnifiedRecommendations();
    expect(unified.jobs.length).toBeGreaterThan(0);
    expect(unified.people.length).toBeGreaterThan(0);

    const gaps = await recEngineApi.getCareerGaps();
    expect(gaps.targetRole).toContain('Architect');

    const config = await recEngineApi.getAdminConfig();
    expect(config.modelName).toBe('kirmya_hybrid_v1');
  });
});

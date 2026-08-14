import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

import AdminRecommendationCenter from '../components/admin/recommendations/AdminRecommendationCenter';
import { recommendationApi } from '../features/recommendation_engine/api';

describe('Recommendation, Personalization & Career Intelligence Test Suite', () => {
  it('renders AdminRecommendationCenter header and weight controls', () => {
    render(<AdminRecommendationCenter />);
    expect(screen.getByText(/Kirmya Recommendation Studio & Algorithm Tuning/i)).toBeInTheDocument();
  });

  it('fetches unified recommendations safely', async () => {
    const data = await recommendationApi.getUnifiedRecommendations();
    expect(data.jobs.length).toBeGreaterThan(0);
    expect(data.people.length).toBeGreaterThan(0);
  });

  it('fetches career gap analysis safely', async () => {
    const gaps = await recommendationApi.getCareerGaps();
    expect(gaps.targetRole).toContain('Architect');
    expect(gaps.missingSkills.length).toBeGreaterThan(0);
  });

  it('fetches admin config and metrics', async () => {
    const cfg = await recommendationApi.getAdminConfig();
    expect(cfg.modelName).toBe('kirmya_hybrid_v1');

    const metrics = await recommendationApi.getAdminMetrics();
    expect(metrics.length).toBeGreaterThan(0);
  });
});

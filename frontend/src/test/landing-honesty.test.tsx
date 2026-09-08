import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import StatisticsSection from '../components/landing/StatisticsSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import NetworkingSection from '../components/landing/NetworkingSection';
import { landingApi } from '../features/landing/api';

// NetworkingSection renders a router-driven call to action.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
}));

/**
 * F08. The landing page must not present anything it cannot support.
 *
 * Every assertion here failed before this change: the statistics band rendered
 * four invented figures whenever the API returned nothing, the testimonials
 * carousel rendered three invented people at named companies under the same
 * condition, and an unreachable API produced a whole fabricated page including
 * job postings attributed to real employers.
 *
 * The rule these encode is narrow and absolute: with no data, render nothing.
 */

/** Figures that appeared in the shipped fabrications. */
const FABRICATED = [
  '25,480+',
  '4,850+',
  '150,000+',
  '500,000+',
  '350,000+',
  '18,450+',
  '45,000+',
  '94.8%',
  '18 Days',
];

describe('platform statistics', () => {
  it('renders nothing when no figures could be counted', () => {
    const { container } = render(<StatisticsSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the counted figures and no invented ones', async () => {
    const { container } = render(
      <StatisticsSection
        statistics={{
          open_jobs: 142,
          hiring_companies: 12,
          members: 87,
          applications_submitted: 305,
        }}
      />
    );

    // The counter renders its prefix, number and suffix as separate text nodes
    // and animates up to the target, so this waits for the settled figures and
    // reads them off the rendered text rather than matching a single node.
    // The counter runs for 1.5s by design, so this waits past its default.
    await waitFor(
      () => {
        const rendered = container.textContent ?? '';
        expect(rendered).toContain('142');
        expect(rendered).toContain('305');
        expect(rendered).toContain('87');
      },
      { timeout: 4000 }
    );

    const rendered = container.textContent ?? '';
    expect(rendered).toContain('Open Jobs');
    expect(rendered).toContain('Companies Hiring');
    for (const figure of FABRICATED) {
      expect(rendered).not.toContain(figure);
    }
  });

  it('shows a genuinely small platform as small', async () => {
    // The point of counting: a brand-new deployment says zero rather than
    // "25,480+". Zero is checkable; the alternative is not.
    const { container } = render(
      <StatisticsSection
        statistics={{ open_jobs: 0, hiring_companies: 0, members: 1, applications_submitted: 0 }}
      />
    );
    await waitFor(
      () => {
        expect(container.textContent ?? '').toContain('0Open Jobs');
      },
      { timeout: 4000 }
    );
  });
});

describe('testimonials', () => {
  it('renders nothing when there are none', () => {
    const { container } = render(<TestimonialsSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an empty list rather than falling back', () => {
    const { container } = render(<TestimonialsSection testimonials={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not ship the invented people it used to', () => {
    const { container } = render(<TestimonialsSection testimonials={[]} />);
    for (const name of ['Elena Rostova', 'Tariq Al-Mansoor', 'Sarah Jenkins']) {
      expect(container.textContent ?? '').not.toContain(name);
    }
  });
});

describe('landing API fallback', () => {
  it('answers an unreachable backend with empty sections, not a fabricated page', async () => {
    // The suite's global setup rejects all network access, so this exercises
    // the failure path exactly as a real outage would.
    const content = await landingApi.getLandingContent();

    expect(content.statistics).toEqual([]);
    expect(content.featured_jobs).toEqual([]);
    expect(content.featured_companies).toEqual([]);
    expect(content.testimonials).toEqual([]);
    expect(content.platform_statistics).toBeUndefined();

    // Job postings were previously invented against real named employers.
    const asText = JSON.stringify(content);
    for (const employer of ['Stripe', 'Emaar', 'Careem', 'Noon']) {
      expect(asText).not.toContain(employer);
    }
  });
});

describe('the networking panel', () => {
  it('does not present invented people as members of the network', () => {
    // This panel rendered three named people at named employers with specific
    // mutual-connection counts and a live "Connect" button each. None of them
    // existed. It is the same defect as the testimonials, one section down the
    // page, and it survived the first pass at F08.
    const { container } = render(<NetworkingSection />);
    const rendered = container.textContent ?? '';

    for (const invented of [
      'Sarah Chen',
      'Tariq Al-Mansoor',
      'Elena Rostova',
      'Hyperion Labs',
      'Nexus AI',
      'Amazon Web Services',
      'Mutual Connections',
    ]) {
      expect(rendered).not.toContain(invented);
    }
  });

  it('describes the referral flow instead', () => {
    const { container } = render(<NetworkingSection />);
    const rendered = container.textContent ?? '';

    expect(rendered).toContain('How a referral happens');
    // And makes no unsourced claim about the industry.
    expect(rendered).not.toContain('70%');
  });
});

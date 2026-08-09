import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import CompanyHeader from '../CompanyHeader';
import CompanyProfile from '../CompanyProfile';
import CompanyRecruiters from '../CompanyRecruiters';
import CompanyDashboardShell from '../CompanyDashboardShell';
import { AutoGrid } from '../CompanyBadges';
import { renderWithProviders } from '../../../test/utils';
import { styleAt, VIEWPORT } from '../../../test/css';
import { companyDetail, membership, page, person } from '../../../test/fixtures';

/**
 * Responsive behaviour of the company screens.
 *
 * jsdom lays nothing out, so these read the stylesheet the components generated
 * and resolve it at a phone width and at a laptop width (see `test/css.ts`).
 * That answers what the layout is asked to do at each width — it is not a
 * substitute for looking at the page in a browser.
 */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/company/dashboard',
}));

const auth = { isAuthenticated: true, loading: false };
vi.mock('../../../hooks/useAuth', () => ({
  default: () => auth,
  useAuth: () => auth,
}));

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getCompany: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn(),
    listMyCompanies: vi.fn(),
    getRecruiters: vi.fn(),
    getDepartments: vi.fn(),
    getPermissionCatalog: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

const owner = membership(
  ['company_owner'],
  ['company:view', 'recruiter:view', 'recruiter:invite', 'recruiter:manage']
);

describe('the company header at different widths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHeader = () => {
    const { container } = renderWithProviders(
      <CompanyHeader
        company={companyDetail({ logoUrl: 'https://northwind.example/logo.png' })}
        identifier="northwind-logistics"
        isAuthenticated={false}
      />
    );
    const avatar = screen
      .getByRole('img', { name: 'Northwind Logistics logo' })
      .closest('.MuiAvatar-root') as HTMLElement;
    return {
      container,
      avatar,
      /** Logo, identity block and actions share one row on a wide screen. */
      identity: avatar.parentElement as HTMLElement,
      cover: container.querySelector('[role="presentation"]') as HTMLElement,
    };
  };

  it('stacks the logo above the company details on a phone', () => {
    const { identity } = renderHeader();

    expect(styleAt(identity, VIEWPORT.phone)['flex-direction']).toBe('column');
  });

  it('puts the logo beside the company details on a laptop', () => {
    const { identity } = renderHeader();

    expect(styleAt(identity, VIEWPORT.laptop)['flex-direction']).toBe('row');
  });

  // A 128px logo and a 240px cover would take most of a phone screen before a
  // word of the company's own text appeared.
  it('gives less of a phone screen to the logo and cover than of a laptop screen', () => {
    const { avatar, cover } = renderHeader();

    expect(styleAt(avatar, VIEWPORT.phone).width).toBe('88px');
    expect(styleAt(avatar, VIEWPORT.laptop).width).toBe('128px');
    expect(styleAt(cover, VIEWPORT.phone).height).toBe('140px');
    expect(styleAt(cover, VIEWPORT.laptop).height).toBe('240px');
  });
});

describe('the company page at different widths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getCompany.mockResolvedValue(companyDetail() as never);
  });

  // Eight section tabs do not fit across a phone. They scroll rather than wrap
  // or clip, so every section stays reachable.
  it('keeps every section tab reachable on a narrow screen', async () => {
    renderWithProviders(
      <CompanyProfile slug="northwind-logistics" activeTab="home">
        {() => <div data-testid="tab-content">home</div>}
      </CompanyProfile>
    );

    await screen.findByTestId('tab-content');
    const tabs = screen.getByRole('tablist', { name: 'Company sections' });
    const scroller = tabs.closest('.MuiTabs-root')?.querySelector('.MuiTabs-scroller') as HTMLElement;

    expect(scroller).toBeTruthy();
    expect(styleAt(scroller, VIEWPORT.phone)['overflow-x']).toBe('auto');
  });
});

describe('the dashboard shell at different widths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.isAuthenticated = true;
    auth.loading = false;
    api.listMyCompanies.mockResolvedValue([owner] as never);
  });

  const renderShell = async () => {
    renderWithProviders(
      <CompanyDashboardShell title="Overview">{() => <div>panel</div>}</CompanyDashboardShell>
    );
    return (await screen.findByRole('navigation', { name: 'Company dashboard' })) as HTMLElement;
  };

  it('runs the navigation across the full width above the panel on a phone', async () => {
    const nav = await renderShell();

    const phone = styleAt(nav, VIEWPORT.phone);
    expect(phone.width).toBe('100%');
    expect(styleAt(nav.parentElement as HTMLElement, VIEWPORT.phone)['flex-direction']).toBe(
      'column'
    );
  });

  it('sets the navigation beside the panel on a laptop', async () => {
    const nav = await renderShell();

    expect(styleAt(nav, VIEWPORT.laptop).width).toBe('264px');
    expect(styleAt(nav.parentElement as HTMLElement, VIEWPORT.laptop)['flex-direction']).toBe(
      'row'
    );
  });

  // Sticky navigation on a phone would pin a full-width block over the content
  // the person scrolled to read.
  it('pins the navigation only where there is a column to pin it in', async () => {
    const nav = await renderShell();

    expect(styleAt(nav, VIEWPORT.phone).position).toBeUndefined();
    expect(styleAt(nav, VIEWPORT.laptop).position).toBe('sticky');
  });
});

describe('figures and tables at different widths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getDepartments.mockResolvedValue([] as never);
  });

  it('lays the figure tiles out one per row on a phone and side by side above it', () => {
    renderWithProviders(
      <AutoGrid>
        <div data-testid="tile">one</div>
      </AutoGrid>
    );

    const grid = screen.getByTestId('tile').parentElement as HTMLElement;
    expect(styleAt(grid, VIEWPORT.phone)['grid-template-columns']).toBe('1fr');
    expect(styleAt(grid, VIEWPORT.tablet)['grid-template-columns']).toBe(
      'repeat(auto-fit, minmax(220px, 1fr))'
    );
  });

  // A five-column roster cannot be narrowed to a phone without losing columns,
  // so the table scrolls sideways inside the card instead of being cut off.
  it('lets a phone reach every column of the recruiter table', async () => {
    api.getRecruiters.mockResolvedValue(
      page([person({ id: 'member-5', name: 'Ravi Menon', role: 'recruiter' })]) as never
    );

    renderWithProviders(<CompanyRecruiters membership={owner} />);

    const table = await screen.findByRole('table', { name: 'Recruiting team' });
    const scroller = table.parentElement as HTMLElement;
    expect(styleAt(scroller, VIEWPORT.phone)['overflow-x']).toBe('auto');
  });
});

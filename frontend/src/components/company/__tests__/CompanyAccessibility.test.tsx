import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyProfile from '../CompanyProfile';
import CompanyAnalytics from '../CompanyAnalytics';
import CompanyRecruiters from '../CompanyRecruiters';
import CompanyVerification from '../CompanyVerification';
import { renderWithProviders } from '../../../test/utils';
import { companyDetail, membership, page, person } from '../../../test/fixtures';

/**
 * Accessibility of the company screens.
 *
 * These are the checks that can be made without a browser: that the page has
 * one first-level heading and named landmarks, that every icon-only control and
 * every figure carries a name a screen reader can read, that nothing is
 * conveyed by colour alone, that form errors are announced, and that the
 * keyboard reaches what the mouse reaches.
 */

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/company/northwind-logistics',
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
    getAnalytics: vi.fn(),
    getRecruiters: vi.fn(),
    getDepartments: vi.fn(),
    getPermissionCatalog: vi.fn(),
    setRecruiterSuspended: vi.fn(),
    removeRecruiter: vi.fn(),
    getVerification: vi.fn(),
    submitVerification: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

const renderProfile = (company = companyDetail()) => {
  api.getCompany.mockResolvedValue(company as never);
  return renderWithProviders(
    <CompanyProfile slug="northwind-logistics" activeTab="home">
      {(loaded) => <div data-testid="tab-content">{loaded.name}</div>}
    </CompanyProfile>
  );
};

describe('the public company page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.isAuthenticated = true;
  });

  it('has one first-level heading, and it names the company', async () => {
    renderProfile();

    await screen.findByTestId('tab-content');
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Northwind Logistics');
  });

  it('names its landmarks so they can be jumped between', async () => {
    renderProfile();

    await screen.findByTestId('tab-content');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Company sections' })).toBeInTheDocument();
  });

  // The badge is the one claim on the page a company cannot make for itself, so
  // it has to reach a screen reader. MUI hides an icon from assistive
  // technology unless it is given a title, which is what this guards.
  it('announces the verified badge rather than hiding it from a screen reader', async () => {
    renderProfile(companyDetail({ isVerified: true, verificationStatus: 'verified' }));

    await screen.findByTestId('tab-content');
    const badge = await screen.findByRole('img', { name: 'Verified company' });
    expect(badge).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('reports whether the viewer already follows the company, not just its colour', async () => {
    renderProfile(companyDetail({ isFollowing: true }));

    await screen.findByTestId('tab-content');
    const button = screen.getByRole('button', { name: /following/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('reaches every section tab from the keyboard', async () => {
    const user = userEvent.setup();
    renderProfile();

    await screen.findByTestId('tab-content');
    const about = screen.getByRole('tab', { name: 'About' });
    about.focus();
    expect(about).toHaveFocus();
    // A link, so the keyboard follows it without a click handler of its own.
    expect(about.tagName).toBe('A');
    await user.keyboard('{Tab}');
    expect(about).not.toHaveFocus();
  });
});

describe('figures and charts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getAnalytics.mockResolvedValue({
      from: '2024-10-01T00:00:00Z',
      to: '2024-10-31T00:00:00Z',
      profileViews: 4820,
      uniqueVisitors: 3110,
      jobViews: 2400,
      applications: 120,
      applicationConversion: 0.05,
      followers: 1280,
      followerGrowth: 46,
      interviews: 30,
      interviewRate: 0.25,
      offers: 9,
      offerRate: 0.075,
      hires: 6,
      hireRate: 0.05,
      candidateSources: { search: 70, referral: 50 },
      recruiterActivity: [],
      series: [
        { date: '2024-10-01', profileViews: 100, jobViews: 60, applications: 4, followers: 2 },
        { date: '2024-10-02', profileViews: 140, jobViews: 80, applications: 6, followers: 1 },
      ],
    } as never);
  });

  // A chart drawn as an SVG is nothing at all to a screen reader unless its
  // figures are also said in words.
  it('says the trend chart’s figures in words', async () => {
    renderWithProviders(<CompanyAnalytics companyId="company-1" />);

    const chart = await screen.findByRole('img', { name: /Daily totals\./ });
    expect(chart).toHaveAccessibleName(/Profile views: \d/);
  });

  // The source bars differ only by colour and length on screen; the share is on
  // each bar as a label so it does not depend on either.
  it('labels each share rather than leaving it to the colour of a bar', async () => {
    renderWithProviders(<CompanyAnalytics companyId="company-1" />);

    await screen.findByText('4,820');
    expect(screen.getByLabelText(/Kirmya search: \d+ percent/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Referral: \d+ percent/)).toBeInTheDocument();
  });
});

const owner = membership(
  ['company_owner'],
  ['company:view', 'recruiter:view', 'recruiter:invite', 'recruiter:manage', 'analytics:view']
);

describe('the recruiter roster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getDepartments.mockResolvedValue([] as never);
    api.removeRecruiter.mockResolvedValue(undefined as never);
    api.getRecruiters.mockResolvedValue(
      page([
        person({ id: 'member-5', userId: 'user-5', name: 'Ravi Menon', role: 'recruiter' }),
      ]) as never
    );
  });

  it('gives the table a name and column headers', async () => {
    renderWithProviders(<CompanyRecruiters membership={owner} />);

    const table = await screen.findByRole('table', { name: 'Recruiting team' });
    const headers = within(table).getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual(['Recruiter', 'Role', 'Status', 'Joined', 'Actions']);
  });

  // One icon per row, all identical. The name says whose row it belongs to so
  // the control is distinguishable when the rows are read out.
  it('names each row’s icon-only control after the person in that row', async () => {
    renderWithProviders(<CompanyRecruiters membership={owner} />);

    expect(
      await screen.findByRole('button', { name: 'Actions for Ravi Menon' })
    ).toBeInTheDocument();
  });

  it('opens the row menu and moves into it from the keyboard alone', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyRecruiters membership={owner} />);

    const actions = await screen.findByRole('button', { name: 'Actions for Ravi Menon' });
    actions.focus();
    await user.keyboard('{Enter}');

    const menu = await screen.findByRole('menu');
    await waitFor(() => expect(menu).toContainElement(document.activeElement as HTMLElement));
  });

  it('closes a confirmation with Escape and returns focus to what opened it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyRecruiters membership={owner} />);

    const actions = await screen.findByRole('button', { name: 'Actions for Ravi Menon' });
    await user.click(actions);
    await user.click(await screen.findByRole('menuitem', { name: 'Remove from recruiting team' }));

    // Focus moves into the modal — onto the dialog's own container while the
    // dialog is opening — so the keyboard cannot wander behind it.
    const dialog = await screen.findByRole('dialog');
    const modal = dialog.closest('.MuiModal-root') as HTMLElement;
    await waitFor(() => expect(modal).toContainElement(document.activeElement as HTMLElement));

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.removeRecruiter).not.toHaveBeenCalled();
    await waitFor(() => expect(actions).toHaveFocus());
  });
});

describe('the verification form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getVerification.mockResolvedValue({ status: 'not_verified', verification: null } as never);
  });

  it('labels every field it asks for', async () => {
    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);

    await screen.findByText('Not verified');
    expect(screen.getByLabelText(/Registered legal name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Registration number/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Country of registration/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact email/)).toBeInTheDocument();
    expect(screen.getByLabelText('Document URL')).toBeInTheDocument();
  });

  // Two documents mean two identical delete icons. Each is named after the row
  // it removes, so they are not read out as the same control twice.
  it('distinguishes the delete control of one document from another', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);

    await screen.findByText('Not verified');
    // A single document cannot be removed — there would be nothing to review.
    expect(screen.queryByRole('button', { name: /Remove document/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add another document' }));

    expect(screen.getByRole('button', { name: 'Remove document 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove document 2' })).toBeInTheDocument();
  });

  // A field that is merely outlined in red says nothing when it is read out.
  // The message is tied to the field it belongs to.
  it('ties a rejected value to the field it came from', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);

    await screen.findByText('Not verified');
    await user.type(screen.getByLabelText(/Registered legal name/), 'N');
    await user.type(screen.getByLabelText(/Registration number/), 'FZE-119284');
    await user.type(screen.getByLabelText(/Country of registration/), 'United Arab Emirates');
    await user.type(screen.getByLabelText(/Contact email/), 'legal@northwind.example');
    await user.type(
      screen.getByLabelText('Document URL'),
      'https://northwind.example/docs/registration.pdf'
    );
    await user.click(screen.getByRole('button', { name: 'Submit for review' }));

    const field = screen.getByLabelText(/Registered legal name/);
    await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'));
    expect(field).toHaveAccessibleDescription(/legal name/i);
    expect(api.submitVerification).not.toHaveBeenCalled();
  });

  it('announces a refusal from the server instead of only printing it', async () => {
    api.getVerification.mockRejectedValue(new Error('Verification could not be loaded.'));

    renderWithProviders(<CompanyVerification companyId="company-1" canSubmit />);

    // The status banner is an alert too, so the failure is looked for among
    // them rather than assumed to be the only one.
    await waitFor(() => {
      const announced = screen
        .getAllByRole('alert')
        .some((alert) => alert.textContent?.includes('Verification could not be loaded.'));
      expect(announced).toBe(true);
    });
  });
});

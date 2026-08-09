import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CompanyReviews from '../CompanyReviews';
import { renderWithProviders } from '../../../test/utils';
import { review } from '../../../test/fixtures';
import { ViewerContext } from '../../../features/company/types';

vi.mock('../../../features/company/api', () => ({
  companyManagementApi: {
    getReviews: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
    reportReview: vi.fn(),
    respondToReview: vi.fn(),
  },
}));

import { companyManagementApi } from '../../../features/company/api';

const api = vi.mocked(companyManagementApi);

const reviewsPage = (
  items: ReturnType<typeof review>[],
  overrides: Record<string, unknown> = {}
) =>
  ({
    items,
    total: items.length,
    page: 1,
    limit: 10,
    totalPages: 1,
    averageRating: items.length
      ? items.reduce((sum, entry) => sum + entry.overallRating, 0) / items.length
      : 0,
    ratingBreakdown: {},
    canReview: false,
    ...overrides,
  }) as never;

const props = {
  identifier: 'northwind-logistics',
  companyId: 'company-1',
  companyName: 'Northwind Logistics',
};

describe('CompanyReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.reportReview.mockResolvedValue(undefined as never);
    api.respondToReview.mockResolvedValue(undefined as never);
    api.deleteReview.mockResolvedValue(undefined as never);
  });

  // Nothing is invented when there is nothing to show: no score, no stars, no
  // summarised prose about what people supposedly think.
  it('states there is no score rather than estimating one', async () => {
    api.getReviews.mockResolvedValue(reviewsPage([]));

    renderWithProviders(<CompanyReviews {...props} isAuthenticated={false} />);

    expect(
      await screen.findByText(
        'No reviews yet. Nothing here is estimated — the score appears once people write one.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Nobody has reviewed Northwind Logistics yet.')).toBeInTheDocument();
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  // The average and the breakdown are the server's numbers. The component
  // renders them and adds no commentary of its own.
  it('shows the server’s average and nothing beyond it', async () => {
    api.getReviews.mockResolvedValue(
      reviewsPage([review({ id: 'review-1', overallRating: 4 }), review({ id: 'review-2', overallRating: 5 })], {
        averageRating: 4.5,
        ratingBreakdown: { '5': 1, '4': 1 },
      })
    );

    renderWithProviders(<CompanyReviews {...props} isAuthenticated={false} />);

    expect(await screen.findByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('2 reviews')).toBeInTheDocument();
  });

  it('renders exactly the reviews the server returned', async () => {
    api.getReviews.mockResolvedValue(
      reviewsPage([
        review({
          id: 'review-1',
          title: 'Steady work, good people',
          summary: 'The operations team is well run.',
          pros: 'Predictable shifts',
          cons: 'Parking is tight',
        }),
      ])
    );

    renderWithProviders(<CompanyReviews {...props} isAuthenticated={false} />);

    const card = await screen.findByRole('article');
    expect(within(card).getByText('Steady work, good people')).toBeInTheDocument();
    expect(within(card).getByText('The operations team is well run.')).toBeInTheDocument();
    expect(within(card).getByText('Predictable shifts')).toBeInTheDocument();
    expect(within(card).getByText('Parking is tight')).toBeInTheDocument();
  });

  it('keeps an anonymous author anonymous', async () => {
    api.getReviews.mockResolvedValue(
      reviewsPage([
        review({
          isAnonymous: true,
          authorName: 'Amina Farouk',
          authorPhotoUrl: 'https://northwind.example/amina.png',
        }),
      ])
    );

    renderWithProviders(<CompanyReviews {...props} isAuthenticated={false} />);

    const card = await screen.findByRole('article');
    expect(within(card).getByText('Anonymous')).toBeInTheDocument();
    expect(within(card).queryByText('Amina Farouk')).not.toBeInTheDocument();
    expect(card.querySelector('img')).toBeNull();
  });

  // Eligibility is the server's answer — one review per person per company.
  // The button appears only when it says so.
  it('offers the write button only when the server says the viewer may review', async () => {
    api.getReviews.mockResolvedValue(reviewsPage([review()], { canReview: false }));

    const { unmount } = renderWithProviders(<CompanyReviews {...props} isAuthenticated />);
    await screen.findByRole('article');
    expect(screen.queryByRole('button', { name: 'Write a review' })).not.toBeInTheDocument();
    unmount();

    api.getReviews.mockResolvedValue(reviewsPage([review()], { canReview: true }));
    renderWithProviders(<CompanyReviews {...props} isAuthenticated />);
    expect(await screen.findByRole('button', { name: 'Write a review' })).toBeInTheDocument();
  });

  it('sends an anonymous visitor to sign in before reporting', async () => {
    const user = userEvent.setup();
    const requireSignIn = vi.fn();
    api.getReviews.mockResolvedValue(reviewsPage([review()]));

    renderWithProviders(
      <CompanyReviews {...props} isAuthenticated={false} onRequireSignIn={requireSignIn} />
    );

    await user.click(await screen.findByRole('button', { name: 'Report this review' }));

    expect(requireSignIn).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.reportReview).not.toHaveBeenCalled();
  });

  it('reports a review without removing it from the page', async () => {
    const user = userEvent.setup();
    api.getReviews.mockResolvedValue(reviewsPage([review({ id: 'review-3' })]));

    renderWithProviders(<CompanyReviews {...props} isAuthenticated />);

    await user.click(await screen.findByRole('button', { name: 'Report this review' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        'Reports go to Kirmya moderation. The review stays visible while it is assessed.'
      )
    ).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Details (optional)'), 'This is an advert.');
    await user.click(within(dialog).getByRole('button', { name: 'Submit report' }));

    await waitFor(() =>
      expect(api.reportReview).toHaveBeenCalledWith('company-1', 'review-3', {
        reason: 'spam',
        details: 'This is an advert.',
      })
    );
    expect(await screen.findByText('Thanks — the moderation team will take a look.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  // A company may answer a review. It may not edit or delete one, and the
  // response is attributed to the company rather than posted as the reviewer.
  it('lets a permitted member respond without touching the review', async () => {
    const user = userEvent.setup();
    const viewer = { isMember: true, permissions: ['review:respond'] } as ViewerContext;
    api.getReviews.mockResolvedValue(reviewsPage([review({ id: 'review-3' })]));

    renderWithProviders(<CompanyReviews {...props} isAuthenticated viewer={viewer} />);

    await user.click(await screen.findByRole('button', { name: 'Respond' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(
        'Your response is public and attributed to the company, not to you personally.'
      )
    ).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Response'), 'Thank you — parking is being fixed.');
    await user.click(within(dialog).getByRole('button', { name: 'Publish response' }));

    await waitFor(() =>
      expect(api.respondToReview).toHaveBeenCalledWith(
        'company-1',
        'review-3',
        'Thank you — parking is being fixed.'
      )
    );
    expect(api.updateReview).not.toHaveBeenCalled();
    expect(api.deleteReview).not.toHaveBeenCalled();
  });

  it('offers no response control to a member without review:respond', async () => {
    const viewer = { isMember: true, permissions: ['team:view'] } as ViewerContext;
    api.getReviews.mockResolvedValue(reviewsPage([review()]));

    renderWithProviders(<CompanyReviews {...props} isAuthenticated viewer={viewer} />);

    await screen.findByRole('article');
    expect(screen.queryByRole('button', { name: 'Respond' })).not.toBeInTheDocument();
  });

  // Editing and deleting belong to the author alone, and the server marks which
  // row is theirs.
  it('offers edit and delete only on the viewer’s own review', async () => {
    api.getReviews.mockResolvedValue(
      reviewsPage([
        review({ id: 'review-1', isOwnReview: false, title: 'Someone else' }),
        review({ id: 'review-2', isOwnReview: true, title: 'Mine' }),
      ])
    );

    renderWithProviders(<CompanyReviews {...props} isAuthenticated />);

    await screen.findByText('Someone else');
    const cards = screen.getAllByRole('article');
    const [others, own] = cards;

    expect(within(others).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(others).getByRole('button', { name: 'Report this review' })).toBeInTheDocument();

    expect(within(own).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    // Nobody reports their own review.
    expect(within(own).queryByRole('button', { name: 'Report this review' })).not.toBeInTheDocument();
  });

  it('deletes the viewer’s own review only after confirmation', async () => {
    const user = userEvent.setup();
    api.getReviews.mockResolvedValue(
      reviewsPage([review({ id: 'review-2', isOwnReview: true })])
    );

    renderWithProviders(<CompanyReviews {...props} isAuthenticated />);

    await user.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Keep it' }));
    expect(api.deleteReview).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' })
    );

    await waitFor(() => expect(api.deleteReview).toHaveBeenCalledWith('company-1', 'review-2'));
  });

  it('asks the server to re-sort rather than reordering what it holds', async () => {
    const user = userEvent.setup();
    api.getReviews.mockResolvedValue(reviewsPage([review()]));

    renderWithProviders(<CompanyReviews {...props} isAuthenticated={false} pageSize={10} />);
    await screen.findByRole('article');

    await user.click(screen.getByRole('combobox', { name: 'Sort' }));
    await user.click(await screen.findByRole('option', { name: 'Lowest rated' }));

    await waitFor(() =>
      expect(api.getReviews).toHaveBeenCalledWith('northwind-logistics', {
        page: 1,
        limit: 10,
        sort: 'rating_asc',
      })
    );
  });

  it('reports a failed load', async () => {
    api.getReviews.mockRejectedValue(new Error('Reviews could not be loaded.'));

    renderWithProviders(<CompanyReviews {...props} isAuthenticated={false} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Reviews could not be loaded.');
  });
});

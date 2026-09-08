import axios from 'axios';
import { LandingContentResponse } from './types';
import { API_BASE_URL } from '../../shared/api_base';

/**
 * An unreachable API produces an empty page, not an invented one.
 *
 * This client used to answer a failed request with a complete fabricated
 * landing page: made-up platform statistics, made-up testimonials, and made-up
 * job postings attributed to real named employers — "Senior Go Backend
 * Engineer, Stripe Global, $140,000 - $180,000" — none of which existed. A
 * visitor could click a role that was never posted, at a company that never
 * posted it, and the only condition required to see it was the backend being
 * down.
 *
 * Empty sections render as nothing at all, so an outage looks like a sparse
 * page rather than a fictional one.
 */
const emptyContent: LandingContentResponse = {
  statistics: [],
  featured_jobs: [],
  featured_companies: [],
  testimonials: [],
};

export const landingApi = {
  getLandingContent: async (): Promise<LandingContentResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/landing/content`);
      return response.data;
    } catch {
      return emptyContent;
    }
  },
};

import axios from 'axios';
import { LandingContentResponse } from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

export const landingApi = {
  getLandingContent: async (): Promise<LandingContentResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/landing/content`);
      return response.data;
    } catch (err) {
      // Graceful fallback if backend is unreachable
      return {
        statistics: [
          { id: '1', stat_key: 'professionals', stat_value: '150,000+', stat_label: 'Professionals Reconnected', display_order: 1 },
          { id: '2', stat_key: 'jobs', stat_value: '45,000+', stat_label: 'Active Opportunities', display_order: 2 },
          { id: '3', stat_key: 'hire_time', stat_value: '18 Days', stat_label: 'Average Time-to-Offer', display_order: 3 },
          { id: '4', stat_key: 'match_acc', stat_value: '94.8%', stat_label: 'AI Match Accuracy', display_order: 4 },
        ],
        featured_jobs: [
          {
            id: 'j1',
            title: 'Facilities Coordinator',
            company: 'Emaar Properties',
            location: 'Dubai, UAE',
            match_percentage: 92,
            salary_range: '$65,000 - $85,000 / yr',
            tags: ['Facilities', 'Vendor Ops'],
            created_at: new Date().toISOString(),
          },
          {
            id: 'j2',
            title: 'Senior Go Backend Engineer',
            company: 'Stripe Global',
            location: 'Remote / Dubai',
            match_percentage: 96,
            salary_range: '$140,000 - $180,000 / yr',
            tags: ['Go', 'PostgreSQL', 'Microservices'],
            created_at: new Date().toISOString(),
          },
        ],
        featured_companies: [],
        testimonials: [
          {
            id: 't1',
            author_name: 'Tariq Al-Mansoor',
            author_role: 'Lead Facilities Manager',
            company_name: 'Emaar Hospitality',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            quote: 'After an unexpected layoff, Kirmya optimized my resume and matched me with Emaar recruiters in 12 days.',
            achievement: 'Landed 3 offers in 14 days post-layoff',
            rating: 5,
            is_featured: true,
            created_at: new Date().toISOString(),
          },
        ],
      };
    }
  },
};

export default landingApi;

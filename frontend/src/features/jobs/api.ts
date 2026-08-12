import axios from 'axios';

import { JobListPage, JobSearchParams } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
});

export const jobsApi = {
  /**
   * Public, platform-wide job board. Backed by the real `jobs` table; only
   * active, unexpired postings are returned. No auth required — this is the
   * landing page's primary destination and has to work signed out.
   */
  search: async (params?: JobSearchParams): Promise<JobListPage> => {
    // Drop empty values so the querystring stays clean and shareable.
    const cleaned = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== '' && v !== null),
    );
    const res = await apiClient.get<JobListPage>('/jobs', { params: cleaned });
    return res.data;
  },
};

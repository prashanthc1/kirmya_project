// The shared authenticated client: it attaches the signed-in user's access
// token and handles refresh. This module previously created its own axios
// instance pointed at http://localhost:8080 with a fixed bearer, so in a
// production build it called the developer's machine as a synthetic user.
import { authApiClient as client } from '../../services/authService';
import {
  Country,
  Currency,
  InternationalJobItem,
  Region,
} from './types';



export const marketplaceApi = {
  searchJobs: async (region?: string, country?: string, arrangement?: string): Promise<{ data: InternationalJobItem[]; count: number }> => {
    const response = await client.get('/global/jobs', {
      params: { region, country, arrangement },
    });
    return response.data;
  },

  getCountries: async (): Promise<{ data: Country[]; count: number }> => {
    const response = await client.get('/global/countries');
    return response.data;
  },

  getRegions: async (): Promise<{ data: Region[]; count: number }> => {
    const response = await client.get('/global/regions');
    return response.data;
  },

  getCurrencies: async (): Promise<{ data: Currency[]; count: number }> => {
    const response = await client.get('/global/currencies');
    return response.data;
  },
};

export default marketplaceApi;

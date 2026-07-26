import axios from 'axios';
import {
  Country,
  Currency,
  InternationalJobItem,
  Region,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

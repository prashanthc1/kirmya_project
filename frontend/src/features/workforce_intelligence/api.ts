import axios from 'axios';
import {
  CareerRecommendation,
  HiringStatistic,
  MarketInsight,
  SkillTrend,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer 9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  },
});

export const intelligenceApi = {
  getMarketInsights: async (industry?: string, region?: string): Promise<{ data: MarketInsight[]; count: number }> => {
    const response = await client.get('/intelligence/market', {
      params: { industry, region },
    });
    return response.data;
  },

  getSkillTrends: async (): Promise<{ data: SkillTrend[]; count: number }> => {
    const response = await client.get('/intelligence/skills');
    return response.data;
  },

  getHiringStatistics: async (region?: string): Promise<{ data: HiringStatistic[]; count: number }> => {
    const response = await client.get('/intelligence/hiring-stats', {
      params: { region },
    });
    return response.data;
  },

  getUserRecommendations: async (): Promise<{ data: CareerRecommendation[]; count: number }> => {
    const response = await client.get('/intelligence/user-recommendations');
    return response.data;
  },
};

export default intelligenceApi;

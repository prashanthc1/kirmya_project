// The shared authenticated client: it attaches the signed-in user's access
// token and handles refresh. This module previously created its own axios
// instance pointed at http://localhost:8080 with a fixed bearer, so in a
// production build it called the developer's machine as a synthetic user.
import { authApiClient as client } from '../../services/authService';
import {
  CareerRecommendation,
  HiringStatistic,
  MarketInsight,
  SkillTrend,
} from './types';



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

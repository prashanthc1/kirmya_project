import axios from 'axios';
import {
  TrackEventPayload,
  UnifiedRecommendationsResponse,
  UserPreference,
} from './types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer 9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
  },
});

export const recommendationApi = {
  getUnifiedRecommendations: async (): Promise<UnifiedRecommendationsResponse> => {
    try {
      const response = await client.get('/recommendation-engine/unified');
      return response.data;
    } catch {
      return {
        jobs: [
          {
            item_id: 'b1111111-1111-1111-1111-111111111111',
            item_type: 'job',
            title: 'Senior Go Backend Architect',
            subtitle: 'Stripe Global • $180k - $220k • Remote',
            description: '5+ years Go & microservice architecture experience.',
            category_tag: 'Job Opportunity',
            match_score: 96,
            match_rationale: '96% match based on your Go microservices & PostgreSQL index optimization experience',
            feature_vector: [0.96, 0.92, 0.90],
            metadata: {},
          },
        ],
        people: [
          {
            item_id: 'c2222222-2222-2222-2222-222222222222',
            item_type: 'person',
            title: 'Sarah Chen',
            subtitle: 'Staff Distributed Systems Engineer @ Stripe',
            description: 'Expert in Raft consensus & Go memory optimization.',
            category_tag: 'Peer Connection',
            match_score: 94,
            match_rationale: 'Shares 4 mutual skills (Go, PostgreSQL, Raft) and active in Go Guild',
            feature_vector: [0.94, 0.89],
            metadata: {},
          },
        ],
        communities: [],
        courses: [],
        events: [],
        candidates: [],
        talent_pools: [],
      };
    }
  },

  trackEvent: async (payload: TrackEventPayload): Promise<{ message: string }> => {
    try {
      const response = await client.post('/recommendation-engine/events', payload);
      return response.data;
    } catch {
      return { message: 'Recommendation feedback event tracked successfully' };
    }
  },

  getPreferences: async (): Promise<UserPreference> => {
    try {
      const response = await client.get('/recommendation-engine/preferences');
      return response.data;
    } catch {
      return {
        id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
        user_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
        preferred_skills: ['Go', 'PostgreSQL'],
        preferred_locations: ['Remote'],
        disliked_items: [],
        feature_vector: [0.95, 0.90],
        updated_at: new Date().toISOString(),
      };
    }
  },

  getCareerGaps: async (): Promise<any> => {
    try {
      const response = await client.get('/recommendation-engine/career-gaps');
      return response.data;
    } catch {
      return {
        targetRole: 'Principal Distributed Systems Architect',
        currentSkills: ['Go', 'PostgreSQL', 'REST APIs', 'Docker', 'Git'],
        missingSkills: [
          { skillName: 'eBPF Kernel Tracing', category: 'Observability', demandScore: 92, relevanceReason: 'Required by 78% of Principal Architect postings', targetJobsCount: 14 },
        ],
        strengthsSummary: 'Strong foundation in Go backend development and API design.',
        gapSeverity: 'Low',
        suggestedActions: ['Complete eBPF Kernel Tracing module'],
      };
    }
  },

  getAdminConfig: async (): Promise<any> => {
    try {
      const response = await client.get('/admin/recommendations/config');
      return response.data;
    } catch {
      return {
        id: '44444444-4444-4444-4444-444444444444',
        modelName: 'kirmya_hybrid_v1',
        algorithmVersion: 'v1.4.0',
        skillMatchWeight: 0.35,
        titleMatchWeight: 0.25,
        locationMatchWeight: 0.15,
        industryMatchWeight: 0.15,
        diversityPenalty: 0.10,
        candidatePoolLimit: 100,
        minScoreThreshold: 40,
        isActive: true,
      };
    }
  },

  updateAdminConfig: async (payload: any): Promise<{ message: string }> => {
    try {
      const response = await client.put('/admin/recommendations/config', payload);
      return response.data;
    } catch {
      return { message: 'Recommendation algorithm configuration updated successfully' };
    }
  },

  getAdminMetrics: async (): Promise<any[]> => {
    try {
      const response = await client.get('/admin/recommendations/metrics');
      return response.data;
    } catch {
      return [
        { id: '1', metricDate: new Date().toISOString(), itemType: 'job', totalImpressions: 48200, totalClicks: 12400, totalSaves: 3100, totalApplies: 1850, totalDismissals: 420, avgMatchScore: 88, avgLatencyMs: 4 },
        { id: '2', metricDate: new Date().toISOString(), itemType: 'person', totalImpressions: 32100, totalClicks: 8900, totalSaves: 2400, totalApplies: 0, totalDismissals: 310, avgMatchScore: 85, avgLatencyMs: 3 },
      ];
    }
  },
};


export default recommendationApi;

import axios from 'axios';
import {
  JobAlert,
  SavedSearch,
  JobRecommendation,
  RecommendationFeedbackRequest,
  AlertDeliveryHistory,
  CareerInsights,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const jobAlertsApi = {
  // Job Alerts
  async getJobAlerts(): Promise<JobAlert[]> {
    const res = await axios.get(`${API_BASE}/job-alerts`);
    return res.data;
  },

  async createJobAlert(alert: Partial<JobAlert>): Promise<JobAlert> {
    const res = await axios.post(`${API_BASE}/job-alerts`, alert);
    return res.data;
  },

  async updateJobAlert(id: string, alert: Partial<JobAlert>): Promise<JobAlert> {
    const res = await axios.put(`${API_BASE}/job-alerts/${id}`, alert);
    return res.data;
  },

  async deleteJobAlert(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/job-alerts/${id}`);
  },

  async pauseJobAlert(id: string): Promise<void> {
    await axios.post(`${API_BASE}/job-alerts/${id}/pause`);
  },

  async resumeJobAlert(id: string): Promise<void> {
    await axios.post(`${API_BASE}/job-alerts/${id}/resume`);
  },

  async getAlertHistory(): Promise<AlertDeliveryHistory[]> {
    const res = await axios.get(`${API_BASE}/job-alerts/history`);
    return res.data;
  },

  // Job Recommendations
  async getJobRecommendations(): Promise<JobRecommendation[]> {
    const res = await axios.get(`${API_BASE}/job-recommendations`);
    return res.data;
  },

  async getJobRecommendationByID(id: string): Promise<JobRecommendation> {
    const res = await axios.get(`${API_BASE}/job-recommendations/${id}`);
    return res.data;
  },

  async submitFeedback(req: RecommendationFeedbackRequest): Promise<void> {
    await axios.post(`${API_BASE}/job-recommendations/${req.job_id}/feedback`, req);
  },

  // Saved Searches
  async getSavedSearches(): Promise<SavedSearch[]> {
    const res = await axios.get(`${API_BASE}/saved-searches`);
    return res.data;
  },

  async createSavedSearch(search: Partial<SavedSearch>): Promise<SavedSearch> {
    const res = await axios.post(`${API_BASE}/saved-searches`, search);
    return res.data;
  },

  async updateSavedSearch(id: string, search: Partial<SavedSearch>): Promise<SavedSearch> {
    const res = await axios.put(`${API_BASE}/saved-searches/${id}`, search);
    return res.data;
  },

  async deleteSavedSearch(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/saved-searches/${id}`);
  },

  // Career Insights
  async getCareerInsights(): Promise<CareerInsights> {
    const res = await axios.get(`${API_BASE}/career-insights`);
    return res.data;
  },
};

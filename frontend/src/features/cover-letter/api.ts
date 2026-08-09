import axios from 'axios';
import {
  CoverLetter,
  CoverLetterTemplate,
  CoverLetterVersion,
  CoverLetterShare,
  CoverLetterAnalytics,
  GenerateCoverLetterRequest,
  RewriteRequest,
  TailorJobResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const CoverLetterAPI = {
  async list(): Promise<CoverLetter[]> {
    const res = await axios.get(`${API_BASE}/cover-letters`, { withCredentials: true });
    return res.data;
  },

  async getById(id: string): Promise<CoverLetter> {
    const res = await axios.get(`${API_BASE}/cover-letters/${id}`, { withCredentials: true });
    return res.data;
  },

  async create(name: string, templateName: string = 'modern'): Promise<CoverLetter> {
    const res = await axios.post(`${API_BASE}/cover-letters`, { name, templateName }, { withCredentials: true });
    return res.data;
  },

  async update(id: string, letter: Partial<CoverLetter>): Promise<CoverLetter> {
    const res = await axios.put(`${API_BASE}/cover-letters/${id}`, letter, { withCredentials: true });
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/cover-letters/${id}`, { withCredentials: true });
  },

  async duplicate(id: string): Promise<CoverLetter> {
    const res = await axios.post(`${API_BASE}/cover-letters/${id}/duplicate`, {}, { withCredentials: true });
    return res.data;
  },

  async generate(req: GenerateCoverLetterRequest): Promise<CoverLetter> {
    const res = await axios.post(`${API_BASE}/cover-letters/generate`, req, { withCredentials: true });
    return res.data;
  },

  async rewrite(id: string, req: RewriteRequest): Promise<CoverLetter> {
    const res = await axios.post(`${API_BASE}/cover-letters/${id}/rewrite`, req, { withCredentials: true });
    return res.data;
  },

  async tailor(id: string, jobDescription: string): Promise<TailorJobResponse> {
    const res = await axios.post(`${API_BASE}/cover-letters/${id}/tailor`, { jobDescription }, { withCredentials: true });
    return res.data;
  },

  async getTemplates(): Promise<CoverLetterTemplate[]> {
    const res = await axios.get(`${API_BASE}/cover-letters/templates`, { withCredentials: true });
    return res.data;
  },

  async getVersions(id: string): Promise<CoverLetterVersion[]> {
    const res = await axios.get(`${API_BASE}/cover-letters/${id}/versions`, { withCredentials: true });
    return res.data;
  },

  async createShare(id: string, privacyLevel: string): Promise<CoverLetterShare> {
    const res = await axios.post(`${API_BASE}/cover-letters/${id}/share`, { privacyLevel }, { withCredentials: true });
    return res.data;
  },

  async deleteShare(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/cover-letters/${id}/share`, { withCredentials: true });
  },

  async getAnalytics(id: string): Promise<CoverLetterAnalytics> {
    const res = await axios.get(`${API_BASE}/cover-letters/${id}/analytics`, { withCredentials: true });
    return res.data;
  },
};

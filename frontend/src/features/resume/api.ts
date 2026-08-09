import axios from 'axios';
import {
  Resume,
  ResumeSection,
  ResumeVersion,
  ResumeTemplate,
  ResumeShare,
  ResumeAnalytics,
  ATSAnalysis,
  TailorJobResponse,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const resumeApi = {
  getResumes: async (): Promise<Resume[]> => {
    const res = await axios.get<Resume[]>(`${API_BASE}/resumes`);
    return res.data;
  },

  getResume: async (id: string): Promise<Resume> => {
    const res = await axios.get<Resume>(`${API_BASE}/resumes/${id}`);
    return res.data;
  },

  createResume: async (payload: { title: string; templateName?: string }): Promise<Resume> => {
    const res = await axios.post<Resume>(`${API_BASE}/resumes`, payload);
    return res.data;
  },

  updateSections: async (id: string, sections: ResumeSection[]): Promise<Resume> => {
    const res = await axios.put<Resume>(`${API_BASE}/resumes/${id}`, { sections });
    return res.data;
  },

  deleteResume: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/resumes/${id}`);
  },

  duplicateResume: async (id: string): Promise<Resume> => {
    const res = await axios.post<Resume>(`${API_BASE}/resumes/${id}/duplicate`);
    return res.data;
  },

  setDefaultResume: async (id: string): Promise<void> => {
    await axios.post(`${API_BASE}/resumes/${id}/default`);
  },

  getVersions: async (id: string): Promise<ResumeVersion[]> => {
    const res = await axios.get<ResumeVersion[]>(`${API_BASE}/resumes/${id}/versions`);
    return res.data;
  },

  importResume: async (payload: { fileName: string; fileData?: string; fileType?: string }): Promise<Resume> => {
    const res = await axios.post<Resume>(`${API_BASE}/resumes/import`, payload);
    return res.data;
  },

  getTemplates: async (): Promise<ResumeTemplate[]> => {
    const res = await axios.get<ResumeTemplate[]>(`${API_BASE}/resumes/templates`);
    return res.data;
  },

  analyzeResume: async (id: string): Promise<ATSAnalysis> => {
    const res = await axios.post<ATSAnalysis>(`${API_BASE}/resumes/${id}/analyze`);
    return res.data;
  },

  optimizeResume: async (id: string): Promise<Resume> => {
    const res = await axios.post<Resume>(`${API_BASE}/resumes/${id}/optimize`);
    return res.data;
  },

  tailorResume: async (id: string, payload: { jobId?: string; jobDescription?: string }): Promise<TailorJobResponse> => {
    const res = await axios.post<TailorJobResponse>(`${API_BASE}/resumes/${id}/tailor`, payload);
    return res.data;
  },

  shareResume: async (id: string, privacyLevel: string): Promise<ResumeShare> => {
    const res = await axios.post<ResumeShare>(`${API_BASE}/resumes/${id}/share`, { privacyLevel });
    return res.data;
  },

  deleteShare: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/resumes/${id}/share`);
  },

  getAnalytics: async (id: string): Promise<ResumeAnalytics> => {
    const res = await axios.get<ResumeAnalytics>(`${API_BASE}/resumes/${id}/analytics`);
    return res.data;
  },

  downloadResumeUrl: (id: string) => `${API_BASE}/resumes/${id}/download`,
};

import { authApiClient } from '../../services/authService';
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

export * from './types';

const apiClient = authApiClient;

export const resumeApi = {
  getResumes: async (): Promise<Resume[]> => {
    const res = await apiClient.get<Resume[]>('/resumes');
    return res.data;
  },

  listResumes: async (): Promise<Resume[]> => {
    const res = await apiClient.get<Resume[]>('/resumes');
    return res.data;
  },

  getResume: async (id: string): Promise<Resume> => {
    const res = await apiClient.get<Resume>(`/resumes/${id}`);
    return res.data;
  },

  createResume: async (payload: { title: string; templateName?: string }): Promise<Resume> => {
    const res = await apiClient.post<Resume>('/resumes', payload);
    return res.data;
  },

  updateSections: async (id: string, sections: ResumeSection[]): Promise<Resume> => {
    const res = await apiClient.put<Resume>(`/resumes/${id}`, { sections });
    return res.data;
  },

  updateResumeSections: async (id: string, sections: { sectionType: string; content: string; sortOrder: number }[]): Promise<Resume> => {
    const res = await apiClient.put<Resume>(`/resumes/${id}`, { sections });
    return res.data;
  },

  deleteResume: async (id: string): Promise<void> => {
    await apiClient.delete(`/resumes/${id}`);
  },

  duplicateResume: async (id: string): Promise<Resume> => {
    const res = await apiClient.post<Resume>(`/resumes/${id}/duplicate`);
    return res.data;
  },

  setDefaultResume: async (id: string): Promise<void> => {
    await apiClient.post(`/resumes/${id}/default`);
  },

  getVersions: async (id: string): Promise<ResumeVersion[]> => {
    const res = await apiClient.get<ResumeVersion[]>(`/resumes/${id}/versions`);
    return res.data;
  },

  listVersions: async (id: string): Promise<ResumeVersion[]> => {
    const res = await apiClient.get<ResumeVersion[]>(`/resumes/${id}/versions`);
    return res.data;
  },

  importResume: async (payload: { fileName: string; fileData?: string; fileType?: string }): Promise<Resume> => {
    const res = await apiClient.post<Resume>('/resumes/import', payload);
    return res.data;
  },

  getTemplates: async (): Promise<ResumeTemplate[]> => {
    const res = await apiClient.get<ResumeTemplate[]>('/resumes/templates');
    return res.data;
  },

  analyzeResume: async (id: string): Promise<ATSAnalysis> => {
    const res = await apiClient.post<ATSAnalysis>(`/resumes/${id}/analyze`);
    return res.data;
  },

  optimizeResume: async (id: string): Promise<Resume> => {
    const res = await apiClient.post<Resume>(`/resumes/${id}/optimize`);
    return res.data;
  },

  tailorResume: async (id: string, payload: { jobId?: string; jobDescription?: string }): Promise<TailorJobResponse> => {
    const res = await apiClient.post<TailorJobResponse>(`/resumes/${id}/tailor`, payload);
    return res.data;
  },

  shareResume: async (id: string, privacyLevel: string): Promise<ResumeShare> => {
    const res = await apiClient.post<ResumeShare>(`/resumes/${id}/share`, { privacyLevel });
    return res.data;
  },

  deleteShare: async (id: string): Promise<void> => {
    await apiClient.delete(`/resumes/${id}/share`);
  },

  getAnalytics: async (id: string): Promise<ResumeAnalytics> => {
    const res = await apiClient.get<ResumeAnalytics>(`/resumes/${id}/analytics`);
    return res.data;
  },

  downloadResumeUrl: (id: string) => `/api/v1/resumes/${id}/download`,
};

export default resumeApi;

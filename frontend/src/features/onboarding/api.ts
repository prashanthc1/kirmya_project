import axios from 'axios';
import {
  OnboardingProgress,
  ProfileCompletion,
  PersonalInfoFormData,
  ProfessionalDetailsFormData,
  SkillItem,
  WorkExperienceItem,
  EducationItem,
  CertificationItem,
  ResumeParsedResult,
  CareerPreferencesData,
  JobAlertPreferencesData,
  CommunityRecommendation,
  ConnectionRecommendation,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const onboardingApi = {
  getProgress: async (): Promise<OnboardingProgress> => {
    const res = await apiClient.get<OnboardingProgress>('/onboarding');
    return res.data;
  },

  startOnboarding: async (): Promise<{ message: string; current_step: number }> => {
    const res = await apiClient.post('/onboarding/start');
    return res.data;
  },

  saveProgress: async (step: number): Promise<{ message: string; step: number }> => {
    const res = await apiClient.put('/onboarding/save', { step });
    return res.data;
  },

  completeOnboarding: async (): Promise<{ message: string; redirect: string }> => {
    const res = await apiClient.post('/onboarding/complete');
    return res.data;
  },

  getProfileCompletion: async (): Promise<ProfileCompletion> => {
    const res = await apiClient.get<ProfileCompletion>('/profile/completion');
    return res.data;
  },

  uploadPhoto: async (formData: FormData): Promise<{ message: string; photo_url: string }> => {
    const res = await apiClient.post('/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  uploadResume: async (formData: FormData): Promise<ResumeParsedResult> => {
    const res = await apiClient.post<ResumeParsedResult>('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  saveSkills: async (skills: SkillItem[]): Promise<{ message: string }> => {
    const res = await apiClient.post('/skills', { skills });
    return res.data;
  },

  saveWorkExperience: async (experiences: WorkExperienceItem[]): Promise<{ message: string }> => {
    const res = await apiClient.post('/work-experience', { experiences });
    return res.data;
  },

  saveEducation: async (educations: EducationItem[]): Promise<{ message: string }> => {
    const res = await apiClient.post('/education', { educations });
    return res.data;
  },

  saveCertifications: async (certifications: CertificationItem[]): Promise<{ message: string }> => {
    const res = await apiClient.post('/certifications', { certifications });
    return res.data;
  },

  saveCareerPreferences: async (pref: CareerPreferencesData): Promise<{ message: string }> => {
    const res = await apiClient.post('/career-preferences', pref);
    return res.data;
  },

  getRecommendedCommunities: async (): Promise<CommunityRecommendation[]> => {
    const res = await apiClient.get<CommunityRecommendation[]>('/onboarding/communities');
    return res.data;
  },

  getRecommendedConnections: async (): Promise<ConnectionRecommendation[]> => {
    const res = await apiClient.get<ConnectionRecommendation[]>('/onboarding/connections');
    return res.data;
  },
};

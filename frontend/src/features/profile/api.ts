import { authApiClient } from '../../services/authService';
import {
  UserProfile,
  WorkExperience,
  Education,
  UserSkill,
  UserCertification,
  UserAchievement,
  CareerPreferences,
  ProfileCompleteness,
  ResumeConsistency,
  ProfileAnalytics,
  ProfilePrivacySettingsData,
} from './types';

const client = authApiClient;

export const profileApi = {
  getMyProfile: async (): Promise<UserProfile> => {
    const res = await client.get<UserProfile>('/profile/me');
    return res.data;
  },

  getPublicProfile: async (identifier: string): Promise<UserProfile> => {
    const res = await client.get<UserProfile>(`/profile/${identifier}`);
    return res.data;
  },

  getProfilePreview: async (view: string = 'public'): Promise<{ viewMode: string; profile: UserProfile }> => {
    const res = await client.get<{ viewMode: string; profile: UserProfile }>(`/profile/me/preview?view=${view}`);
    return res.data;
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await client.put<UserProfile>('/profile/me', data);
    return res.data;
  },

  updateAbout: async (summary: string): Promise<UserProfile> => {
    const res = await client.put<UserProfile>('/profile/me/about', { summary });
    return res.data;
  },

  updateHeadline: async (headline: string): Promise<UserProfile> => {
    const res = await client.put<UserProfile>('/profile/me/headline', { headline });
    return res.data;
  },

  // Media Uploads
  uploadPhoto: async (formData: FormData): Promise<{ message: string; photo_url: string }> => {
    const res = await client.post<{ message: string; photo_url: string }>('/profile/me/photo', formData, {
      headers: { 'Content-Type': null as unknown as string },
    });
    return res.data;
  },

  uploadCoverPhoto: async (formData: FormData): Promise<{ message: string; cover_url: string }> => {
    const res = await client.post<{ message: string; cover_url: string }>('/profile/me/cover', formData, {
      headers: { 'Content-Type': null as unknown as string },
    });
    return res.data;
  },

  deletePhoto: async (): Promise<{ message: string }> => {
    const res = await client.delete<{ message: string }>('/profile/me/photo');
    return res.data;
  },

  // Career Preferences
  updateCareerPreferences: async (prefs: CareerPreferences): Promise<CareerPreferences> => {
    const res = await client.put<CareerPreferences>('/profile/me/career-preferences', prefs);
    return res.data;
  },

  getPreferences: async (): Promise<CareerPreferences> => {
    const res = await client.get<CareerPreferences>('/profiles/me/preferences');
    return res.data;
  },

  // Profile Verification
  requestVerification: async (data: {
    documentType: string;
    documentUrl: string;
    notes?: string;
  }): Promise<{ message: string; status: string }> => {
    const res = await client.post<{ message: string; status: string }>('/profile/me/verify', data);
    return res.data;
  },

  getVerificationStatus: async (): Promise<{ status: string; notes?: string }> => {
    const res = await client.get<{ status: string; notes?: string }>('/profile/me/verification-status');
    return res.data;
  },

  // Privacy & Settings
  updatePrivacySettings: async (settings: Partial<ProfilePrivacySettingsData>): Promise<ProfilePrivacySettingsData> => {
    const res = await client.put<ProfilePrivacySettingsData>('/profile/me/privacy', settings);
    return res.data;
  },

  updatePrivacy: async (profileVisibility: string): Promise<any> => {
    const res = await client.put('/profile/me/privacy', { profileVisibility });
    return res.data;
  },

  // Resume Alignment & Consistency
  getResumeConsistency: async (): Promise<ResumeConsistency> => {
    const res = await client.get<ResumeConsistency>('/profile/me/resume-consistency');
    return res.data;
  },

  // Analytics & Insights
  getProfileAnalytics: async (): Promise<ProfileAnalytics> => {
    const res = await client.get<ProfileAnalytics>('/profile/me/analytics');
    return res.data;
  },

  // Profile Completeness
  getProfileCompleteness: async (): Promise<ProfileCompleteness> => {
    const res = await client.get<ProfileCompleteness>('/profile/me/completeness');
    return res.data;
  },

  // Work Experience
  addExperience: async (exp: WorkExperience): Promise<WorkExperience[]> => {
    const res = await client.post<WorkExperience[]>('/profile/me/experience', exp);
    return res.data;
  },

  updateExperience: async (id: string, exp: WorkExperience): Promise<WorkExperience[]> => {
    const res = await client.put<WorkExperience[]>(`/profile/me/experience/${id}`, exp);
    return res.data;
  },

  deleteExperience: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete<{ message: string }>(`/profile/me/experience/${id}`);
    return res.data;
  },

  // Education
  addEducation: async (edu: Education): Promise<Education[]> => {
    const res = await client.post<Education[]>('/profile/me/education', edu);
    return res.data;
  },

  updateEducation: async (id: string, edu: Education): Promise<Education[]> => {
    const res = await client.put<Education[]>(`/profile/me/education/${id}`, edu);
    return res.data;
  },

  deleteEducation: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete<{ message: string }>(`/profile/me/education/${id}`);
    return res.data;
  },

  // Skills
  addSkill: async (name: string, proficiencyLevel: string): Promise<UserSkill[]> => {
    const res = await client.post<UserSkill[]>('/profile/me/skills', { name, proficiencyLevel });
    return res.data;
  },

  deleteSkill: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete<{ message: string }>(`/profile/me/skills/${id}`);
    return res.data;
  },

  // Certifications
  addCertification: async (cert: UserCertification): Promise<UserCertification[]> => {
    const res = await client.post<UserCertification[]>('/profile/me/certifications', cert);
    return res.data;
  },

  deleteCertification: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete<{ message: string }>(`/profile/me/certifications/${id}`);
    return res.data;
  },

  // Projects
  addProject: async (proj: any): Promise<any[]> => {
    const res = await client.post<any[]>('/profile/me/projects', proj);
    return res.data;
  },

  deleteProject: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete<{ message: string }>(`/profile/me/projects/${id}`);
    return res.data;
  },

  // Languages & Achievements
  addLanguage: async (name: string, proficiency: string): Promise<any[]> => {
    const res = await client.post<any[]>('/profile/me/languages', { name, proficiency });
    return res.data;
  },

  deleteLanguage: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete<{ message: string }>(`/profile/me/languages/${id}`);
    return res.data;
  },

  addAchievement: async (ach: UserAchievement): Promise<UserAchievement[]> => {
    const res = await client.post<UserAchievement[]>('/profile/me/achievements', ach);
    return res.data;
  },

  deleteAchievement: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete<{ message: string }>(`/profile/me/achievements/${id}`);
    return res.data;
  },

  // Reporting
  reportProfile: async (username: string, reason: string, description: string): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>(`/profile/${username}/report`, { reason, description });
    return res.data;
  },

  // Admin APIs
  adminGetProfile: async (userId: string): Promise<UserProfile> => {
    const res = await client.get<UserProfile>(`/admin/users/${userId}/profile`);
    return res.data;
  },

  adminUpdateProfile: async (userId: string, data: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await client.put<UserProfile>(`/admin/users/${userId}/profile`, data);
    return res.data;
  },

  adminVerifyProfile: async (userId: string, status: string, notes: string): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>(`/admin/users/${userId}/profile/verify`, { status, notes });
    return res.data;
  },

  adminRestrictProfile: async (userId: string, isRestricted: boolean, reason?: string): Promise<{ message: string }> => {
    const res = await client.post<{ message: string }>(`/admin/users/${userId}/profile/restrict`, { isRestricted, reason });
    return res.data;
  },
};

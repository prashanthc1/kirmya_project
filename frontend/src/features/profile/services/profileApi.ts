import { authApiClient } from '../../../services/authService';

const client = authApiClient;

export interface WorkExperienceItem {
  id?: string;
  company: string;
  jobTitle: string;
  employmentType?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrentJob?: boolean;
  description?: string;
  skillsUsed?: string[];
  achievements?: string;
}

export interface EducationItem {
  id?: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  description?: string;
}

export interface ProfileData {
  id: string;
  userId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl: string;
  coverUrl: string;
  headline: string;
  summary: string;
  location: string;
  country: string;
  industry: string;
  currentPosition: string;
  availabilityStatus: string;
  openToWork: boolean;
  openToRecruiters: boolean;
  targetRoles: string[];
  preferredLocations: string[];
  profileCompletedPercentage: number;
  volunteering: string;
  publications: string;
  licenses: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  isRestricted: boolean;
  isPrivate: boolean;
  profileViewsCount: number;
  searchAppearancesCount: number;
  workExperiences?: WorkExperienceItem[];
  educations?: EducationItem[];
  skills?: any[];
  certifications?: any[];
  projects?: any[];
  languages?: any[];
  achievements?: any[];
}

export const profileApi = {
  getMyProfile: async (): Promise<ProfileData> => {
    const res = await client.get<ProfileData>('/profile/me');
    return res.data;
  },

  getPublicProfile: async (identifier: string): Promise<ProfileData> => {
    const res = await client.get<ProfileData>(`/profile/${identifier}`);
    return res.data;
  },

  getProfilePreview: async (view: string = 'public'): Promise<{ viewMode: string; profile: ProfileData }> => {
    const res = await client.get<{ viewMode: string; profile: ProfileData }>(`/profile/me/preview?view=${view}`);
    return res.data;
  },

  updateProfile: async (data: Partial<ProfileData>): Promise<ProfileData> => {
    const res = await client.put<ProfileData>('/profile/me', data);
    return res.data;
  },

  updateAbout: async (summary: string): Promise<ProfileData> => {
    const res = await client.put<ProfileData>('/profile/me/about', { summary });
    return res.data;
  },

  updateHeadline: async (headline: string): Promise<ProfileData> => {
    const res = await client.put<ProfileData>('/profile/me/headline', { headline });
    return res.data;
  },

  // Work Experience
  addExperience: async (exp: WorkExperienceItem): Promise<WorkExperienceItem[]> => {
    const res = await client.post<WorkExperienceItem[]>('/profile/me/experience', exp);
    return res.data;
  },

  updateExperience: async (id: string, exp: WorkExperienceItem): Promise<WorkExperienceItem[]> => {
    const res = await client.put<WorkExperienceItem[]>(`/profile/me/experience/${id}`, exp);
    return res.data;
  },

  deleteExperience: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/profile/me/experience/${id}`);
    return res.data;
  },

  // Education
  addEducation: async (edu: EducationItem): Promise<EducationItem[]> => {
    const res = await client.post<EducationItem[]>('/profile/me/education', edu);
    return res.data;
  },

  updateEducation: async (id: string, edu: EducationItem): Promise<EducationItem[]> => {
    const res = await client.put<EducationItem[]>(`/profile/me/education/${id}`, edu);
    return res.data;
  },

  deleteEducation: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/profile/me/education/${id}`);
    return res.data;
  },

  // Skills
  addSkill: async (name: string, proficiencyLevel: string): Promise<any[]> => {
    const res = await client.post('/profile/me/skills', { name, proficiencyLevel });
    return res.data;
  },

  deleteSkill: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/profile/me/skills/${id}`);
    return res.data;
  },

  // Certifications
  addCertification: async (cert: any): Promise<any[]> => {
    const res = await client.post('/profile/me/certifications', cert);
    return res.data;
  },

  deleteCertification: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/profile/me/certifications/${id}`);
    return res.data;
  },

  // Projects
  addProject: async (proj: any): Promise<any[]> => {
    const res = await client.post('/profile/me/projects', proj);
    return res.data;
  },

  deleteProject: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/profile/me/projects/${id}`);
    return res.data;
  },

  // Languages & Achievements
  addLanguage: async (name: string, proficiency: string): Promise<any[]> => {
    const res = await client.post('/profile/me/languages', { name, proficiency });
    return res.data;
  },

  deleteLanguage: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/profile/me/languages/${id}`);
    return res.data;
  },

  addAchievement: async (ach: any): Promise<any[]> => {
    const res = await client.post('/profile/me/achievements', ach);
    return res.data;
  },

  deleteAchievement: async (id: string): Promise<{ message: string }> => {
    const res = await client.delete(`/profile/me/achievements/${id}`);
    return res.data;
  },

  // Media & Privacy
  uploadPhoto: async (formData: FormData): Promise<{ message: string; photo_url: string }> => {
    const res = await client.post('/profile/me/photo', formData, {
      headers: { 'Content-Type': null },
    });
    return res.data;
  },

  deletePhoto: async (): Promise<{ message: string }> => {
    const res = await client.delete('/profile/me/photo');
    return res.data;
  },

  getPreferences: async (): Promise<any> => {
    const res = await client.get('/profiles/me/preferences');
    return res.data;
  },

  updatePrivacy: async (profileVisibility: string): Promise<any> => {
    const res = await client.put('/profile/me/privacy', { profileVisibility });
    return res.data;
  },

  reportProfile: async (username: string, reason: string, description: string): Promise<{ message: string }> => {
    const res = await client.post(`/profile/${username}/report`, { reason, description });
    return res.data;
  },

  // Admin APIs
  adminGetProfile: async (userId: string): Promise<ProfileData> => {
    const res = await client.get<ProfileData>(`/admin/users/${userId}/profile`);
    return res.data;
  },

  adminUpdateProfile: async (userId: string, data: Partial<ProfileData>): Promise<ProfileData> => {
    const res = await client.put<ProfileData>(`/admin/users/${userId}/profile`, data);
    return res.data;
  },

  adminVerifyProfile: async (userId: string, status: string, notes: string): Promise<{ message: string }> => {
    const res = await client.post(`/admin/users/${userId}/profile/verify`, { status, notes });
    return res.data;
  },

  adminRestrictProfile: async (userId: string, isRestricted: boolean, reason?: string): Promise<{ message: string }> => {
    const res = await client.post(`/admin/users/${userId}/profile/restrict`, { isRestricted, reason });
    return res.data;
  },
};

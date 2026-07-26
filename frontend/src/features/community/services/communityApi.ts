import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';
const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config: any) => {
  config.headers.Authorization = `Bearer ${MOCK_USER_ID}`;
  return config;
});

export const communityApi = {
  getMockUserId: () => MOCK_USER_ID,

  listCommunities: async (category?: string, location?: string) => {
    const response = await client.get('/communities', {
      params: { category, location },
    });
    return response.data;
  },

  createCommunity: async (data: {
    title: string;
    description: string;
    category: string;
    location: string;
    isPrivate: boolean;
  }) => {
    const response = await client.post('/communities', data);
    return response.data;
  },

  joinCommunity: async (id: string) => {
    const response = await client.post(`/communities/${id}/join`);
    return response.data;
  },

  approveMembership: async (id: string, candidateId: string, approve: boolean) => {
    const response = await client.put(`/communities/${id}/memberships`, { candidateId, approve });
    return response.data;
  },

  assignRole: async (id: string, targetUserId: string, roleName: string) => {
    const response = await client.put(`/communities/${id}/roles`, { targetUserId, roleName });
    return response.data;
  },

  createPost: async (id: string, content: string) => {
    const response = await client.post(`/communities/${id}/posts`, { content });
    return response.data;
  },

  listPosts: async (id: string) => {
    const response = await client.get(`/communities/${id}/posts`);
    return response.data;
  },

  deletePost: async (id: string, postId: string) => {
    const response = await client.delete(`/communities/${id}/posts/${postId}`);
    return response.data;
  },

  reportPost: async (postId: string, reason: string) => {
    const response = await client.post('/communities/reports', { postId, reason });
    return response.data;
  },
};

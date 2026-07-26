import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies (like refresh_token) are sent and received on cross-origin requests
  withCredentials: true,
});

export const authApi = {
  register: async (email: string, password: string) => {
    const response = await client.post('/auth/register', { email, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await client.post('/auth/login', { email, password });
    return response.data; // Returns { accessToken, user }
  },

  refresh: async () => {
    const response = await client.post('/auth/refresh');
    return response.data; // Returns { accessToken }
  },

  logout: async () => {
    const response = await client.post('/auth/logout');
    return response.data;
  },
};

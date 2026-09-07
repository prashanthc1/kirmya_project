// Shared authenticated client rather than a module-local axios instance on a
// hardcoded localhost base, which a production build could never reach.
import { authApiClient as client } from '../../../services/authService';



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

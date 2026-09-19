import axios from 'axios';
import { Platform } from 'react_native_shim';

const API_BASE_URL = 'http://localhost:8080/api/v1/mobile';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Device-ID': 'b3e9014f-82a1-43e9-a412-1100aa883311',
    'X-Platform': 'android',
    'X-App-Version': '2.1.0',
    'X-Tenant-ID': '00000000-0000-0000-0000-000000000000',
  },
});

export default apiClient;

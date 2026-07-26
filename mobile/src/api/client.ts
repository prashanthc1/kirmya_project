import axios from 'axios';
import { Platform } from 'react_native_shim';

const API_BASE_URL = 'http://localhost:8080/api/v1/mobile';
const MOCK_USER_ID = '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Device-ID': 'b3e9014f-82a1-43e9-a412-1100aa883311',
    'X-Platform': 'android',
    'X-App-Version': '2.1.0',
    'X-Tenant-ID': '00000000-0000-0000-0000-000000000000',
    Authorization: `Bearer ${MOCK_USER_ID}`,
  },
});

export default apiClient;

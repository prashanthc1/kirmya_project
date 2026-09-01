import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { authApiClient } from './authService';

export const apiClient = authApiClient;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    apiClient.delete<T>(url, config),
};

export { extractApiError, type ParsedApiError } from './authService';

export default apiClient;

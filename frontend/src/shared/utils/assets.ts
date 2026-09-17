import { API_BASE_URL } from '../../services/authService';

/**
 * Resolves a relative path from the API (e.g. /uploads/...) into a fully qualified URL.
 * If the path is already absolute (starts with http/https), it returns it as is.
 */
export const resolveAssetUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove /api/v1 from API_BASE_URL to get the server root
  const serverRoot = API_BASE_URL.replace(/\/api\/v\d+$/, '');
  return `${serverRoot}${path.startsWith('/') ? '' : '/'}${path}`;
};

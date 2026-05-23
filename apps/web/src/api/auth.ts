import { User } from '@/models';
import { api } from './client';

export const authApi = {
  getMe: () => api.get<User>('/auth/me'),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  refresh: () => api.post<{ message: string }>('/auth/refresh'),

  getLoginUrl: () => import.meta.env.VITE_GOOGLE_LOGIN_URL,
};

import { api } from './api';
import { AuthUser, saveSession, getSession } from './auth.api';
import { getToken } from './auth.api';

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  category?: string;
  province?: string;
}

export const userApi = {
  getMe: () => api.get<AuthUser>('/users/me'),
  updateMe: (data: UpdateProfilePayload) => api.patch<AuthUser>('/users/me', data),
};

export function getCurrentUser(): AuthUser | null {
  return getSession();
}

export function refreshUserInStorage(user: AuthUser): void {
  const token = getToken();
  if (token) {
    saveSession({ access_token: token, user });
  }
}
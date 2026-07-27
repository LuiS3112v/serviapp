import { api } from './api';

export interface SessionInfo {
  id: string;
  device: string | null;
  browser: string | null;
  ip: string | null;
  location: string | null;
  lastSeen: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface SecurityLogEntry {
  id: string;
  action: string;
  ip: string | null;
  device: string | null;
  browser: string | null;
  createdAt: string;
}

export interface TwoFactorSetup {
  qrCodeDataUrl: string;
  secret: string;
}

export const securityApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ success: boolean }>('/users/me/password', { currentPassword, newPassword }),

  getSessions: () => api.get<SessionInfo[]>('/users/me/sessions'),

  revokeSession: (sessionId: string) =>
    api.delete<{ success: boolean }>(`/users/me/sessions/${sessionId}`),

  revokeAllOtherSessions: () =>
    api.delete<{ success: boolean }>('/users/me/sessions'),

  setupTwoFactor: () => api.get<TwoFactorSetup>('/users/me/2fa/setup'),

  enableTwoFactor: (code: string) =>
    api.post<{ success: boolean }>('/users/me/2fa/enable', { code }),

  disableTwoFactor: (password: string) =>
    api.post<{ success: boolean }>('/users/me/2fa/disable', { password }),

  getTwoFactorStatus: () => api.get<{ enabled: boolean }>('/users/me/2fa/status'),

  getSecurityHistory: () => api.get<SecurityLogEntry[]>('/users/me/security-history'),

  deleteAccount: (password: string, confirmation: string) =>
    api.delete<{ success: boolean }>('/users/me', { data: { password, confirmation } } as any),
};
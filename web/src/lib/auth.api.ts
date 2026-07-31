/**
 * Place this file at: src/lib/auth.api.ts
 *
 * Key changes vs the old version:
 *
 * 1. saveSession() now writes a cookie (serviapp_token) in addition to localStorage.
 *    This is what Next.js proxy (formerly middleware) reads — without it, the
 *    proxy was redirecting everyone (including you) away from /admin.
 *
 * 2. clearSession() and clearAllSessions() now clear that cookie too.
 *
 * 3. refreshStoredSession() — NEW. Called by useAuth after /auth/me returns
 *    fresh data. Handles role promotions (e.g. client → admin) by migrating
 *    storage to the correct role-keyed slot.
 *
 * 4. fetchMe() — NEW. Calls GET /auth/me to get the current user from DB.
 *    This is the fix for the stale-localStorage problem.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "client" | "provider" | "company" | "admin";
  isVerified: boolean;
  profileVisible: boolean;
  phone?: string;
  category?: string;
  isSuperAdmin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  // admin intentionally excluded — backend enforces this too
  role: "client" | "provider" | "company";
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erro na autenticação.");
  return data;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<AuthResponse>("/auth/login", payload),
  register: (payload: RegisterPayload) =>
    request<AuthResponse>("/auth/register", payload),
};

// ─── Storage key helpers ───────────────────────────────────────────────────────

const T_KEY = (r: string) => `serviapp_token_${r}`;
const U_KEY = (r: string) => `serviapp_user_${r}`;
const ACTIVE_KEY = "serviapp_active_role";

// ─── Cookie helpers ────────────────────────────────────────────────────────────
// The cookie is NOT httpOnly — client JS must be able to clear it on logout.
// It is NOT used for API auth (that still uses the Bearer token from localStorage).
// Its sole purpose is to let the Next.js proxy (Node runtime) see that a session
// exists and check the JWT payload for the role gate on private routes, and to
// let Server Component layouts (session.server.ts) re-verify that same session.

function setAuthCookie(token: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 7 * 24 * 60 * 60; // 7 days — mirrors JWT_EXPIRES_IN
  // Add Secure in production so the cookie is only sent over HTTPS
  const secure =
    process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `serviapp_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "serviapp_token=; path=/; max-age=0; SameSite=Lax";
}

// ─── Session management ────────────────────────────────────────────────────────

export function saveSession(data: AuthResponse): void {
  if (typeof window === "undefined") return;
  const role = data.user.role;
  localStorage.setItem(T_KEY(role), data.access_token);
  localStorage.setItem(U_KEY(role), JSON.stringify(data.user));
  localStorage.setItem(ACTIVE_KEY, role);
  // ← This is the critical fix: write the cookie so the proxy can read it
  setAuthCookie(data.access_token);
}

/**
 * Called by useAuth after /auth/me returns fresh data from DB.
 *
 * If the user's role changed (e.g. client → admin after a DB update), this
 * migrates their storage from the old role key to the new one, and updates
 * the cookie so subsequent proxy checks see the correct token.
 */
export function refreshStoredSession(freshUser: AuthUser): void {
  if (typeof window === "undefined") return;

  const oldRole = localStorage.getItem(ACTIVE_KEY);
  const token = oldRole ? localStorage.getItem(T_KEY(oldRole)) : null;
  if (!token) return; // No token to work with — nothing to refresh

  const newRole = freshUser.role;

  // If role changed, clean up the old keys to avoid stale data accumulation
  if (oldRole && oldRole !== newRole) {
    localStorage.removeItem(T_KEY(oldRole));
    localStorage.removeItem(U_KEY(oldRole));
  }

  // Write under the authoritative new role
  localStorage.setItem(T_KEY(newRole), token);
  localStorage.setItem(U_KEY(newRole), JSON.stringify(freshUser));
  localStorage.setItem(ACTIVE_KEY, newRole);

  // Keep the cookie in sync so the proxy always has the right token
  setAuthCookie(token);
}

export function getSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(ACTIVE_KEY);
  if (!role) return null;
  const raw = localStorage.getItem(U_KEY(role));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(ACTIVE_KEY);
  if (!role) return null;
  return localStorage.getItem(T_KEY(role));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  const role = localStorage.getItem(ACTIVE_KEY);
  if (role) {
    localStorage.removeItem(T_KEY(role));
    localStorage.removeItem(U_KEY(role));
  }
  localStorage.removeItem(ACTIVE_KEY);
  clearAuthCookie();
  // Backward compatibility with old single-key approach
  localStorage.removeItem("serviapp_token");
  localStorage.removeItem("serviapp_user");
}

export function clearAllSessions(): void {
  if (typeof window === "undefined") return;
  ["client", "provider", "company", "admin"].forEach((r) => {
    localStorage.removeItem(T_KEY(r));
    localStorage.removeItem(U_KEY(r));
  });
  localStorage.removeItem(ACTIVE_KEY);
  clearAuthCookie();
  // Backward compatibility
  localStorage.removeItem("serviapp_token");
  localStorage.removeItem("serviapp_user");
}

// ─── Backend verification ──────────────────────────────────────────────────────

/**
 * Fetches the current user with fresh data from DB via GET /auth/me.
 *
 * This is the authoritative source for role — localStorage may be stale
 * (e.g. if the role was changed in DB after the last login).
 *
 * Returns null if:
 *   - No token exists
 *   - The backend returns 401 (expired or revoked token) — also clears the session
 *   - Any other non-OK response
 *
 * Does NOT throw on network errors — returns null so the caller can fall back
 * to cached data without logging out an offline user.
 */
export async function fetchMe(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (res.status === 401) {
      // Token rejected by backend — clear everything
      clearSession();
      return null;
    }

    if (!res.ok) return null;

    return (await res.json()) as AuthUser;
  } catch {
    // Network failure — caller decides whether to fall back to cached data
    return null;
  }
}
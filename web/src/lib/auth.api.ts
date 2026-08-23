/**
 * Place this file at: src/lib/auth.api.ts
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "client" | "provider" | "company" | "admin" | "pending";
  isVerified: boolean;
  profileVisible: boolean;
  phone?: string;
  category?: string;
  isSuperAdmin?: boolean;
  bio?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

// Resposta de POST /auth/google (LOGIN — inalterado).
export interface GoogleAuthResponse extends AuthResponse {
  googlePicture: string | null;
  kycStatus: string | null;
}

// NOVO — resposta de POST /auth/google/verify (REGISTER). Deliberadamente
// SEM access_token e SEM user: não há sessão nem conta criada, é só a
// identidade Google verificada, usada para pré-preencher o formulário.
export interface GoogleIdentityPreview {
  email: string;
  fullName: string;
  picture: string | null;
  googleId: string;
  emailAlreadyRegistered: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: "client" | "provider" | "company";
  phone?: string;
  category?: string;
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

// Usado só por endpoints que exigem sessão (ex: choose-role).
// login/register/google/google-verify continuam públicos, via request() acima.
async function requestAuthed<T>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erro no pedido.");
  return data;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<AuthResponse>("/auth/login", payload),
  register: (payload: RegisterPayload) =>
    request<AuthResponse>("/auth/register", payload),
  // INTOCADO — usado exclusivamente pelo /login.
  google: (idToken: string) =>
    request<GoogleAuthResponse>("/auth/google", { idToken }),
  // NOVO — usado exclusivamente pelo /register/client e /register/provider.
  // Não cria conta, não cria sessão, não faz login. Só devolve a
  // identidade Google verificada para pré-preencher o formulário.
  googleVerify: (idToken: string) =>
    request<GoogleIdentityPreview>("/auth/google/verify", { idToken }),
  chooseRole: (role: "client" | "provider") =>
    requestAuthed<AuthResponse>("/auth/choose-role", { role }),
};

// INTOCADO — continua a ser usado exclusivamente pelo fluxo de LOGIN
// com Google (/login). O novo fluxo de Register não chama esta função:
// não há user nem kycStatus antes da conta existir.
export function resolvePostGoogleAuthRoute(
  user: AuthUser,
  kycStatus: string | null,
): string {
  if (user.role === "admin") return "/admin";
  if (user.role === "pending") return "/choose-role";
  if (user.role === "provider" || user.role === "company") {
    if (!user.avatarUrl) return "/register/provider?source=google&step=3";
    if (!kycStatus) return "/register/provider?source=google&step=4";
    return "/provider-home";
  }
  return "/home";
}

// ─── Storage key helpers ───────────────────────────────────────────────────────

const T_KEY = (r: string) => `serviapp_token_${r}`;
const U_KEY = (r: string) => `serviapp_user_${r}`;
const ACTIVE_KEY = "serviapp_active_role";

// ─── Cookie helpers ────────────────────────────────────────────────────────────

function setAuthCookie(token: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 7 * 24 * 60 * 60; // 7 days — mirrors JWT_EXPIRES_IN
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
  setAuthCookie(data.access_token);
}

export function refreshStoredSession(freshUser: AuthUser): void {
  if (typeof window === "undefined") return;

  const oldRole = localStorage.getItem(ACTIVE_KEY);
  const token = oldRole ? localStorage.getItem(T_KEY(oldRole)) : null;
  if (!token) return;

  const newRole = freshUser.role;

  if (oldRole && oldRole !== newRole) {
    localStorage.removeItem(T_KEY(oldRole));
    localStorage.removeItem(U_KEY(oldRole));
  }

  localStorage.setItem(T_KEY(newRole), token);
  localStorage.setItem(U_KEY(newRole), JSON.stringify(freshUser));
  localStorage.setItem(ACTIVE_KEY, newRole);

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
  localStorage.removeItem("serviapp_token");
  localStorage.removeItem("serviapp_user");
}

export function clearAllSessions(): void {
  if (typeof window === "undefined") return;
  ["client", "provider", "company", "admin", "pending"].forEach((r) => {
    localStorage.removeItem(T_KEY(r));
    localStorage.removeItem(U_KEY(r));
  });
  localStorage.removeItem(ACTIVE_KEY);
  clearAuthCookie();
  localStorage.removeItem("serviapp_token");
  localStorage.removeItem("serviapp_user");
}

// ─── Backend verification ──────────────────────────────────────────────────────

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
      clearSession();
      return null;
    }

    if (!res.ok) return null;

    return (await res.json()) as AuthUser;
  } catch {
    return null;
  }
}
"use client";

/**
 * Place this file at: src/hooks/useAuth.ts
 *
 * Key changes vs the old version:
 *
 * 1. On every mount, calls fetchMe() to get fresh role from DB BEFORE
 *    setting loading=false. This means the admin page (and any other protected
 *    page) never renders with stale role data.
 *
 * 2. If fetchMe() returns a different role than the cached session
 *    (e.g. you updated your role in DB), refreshStoredSession() migrates
 *    the localStorage keys and updates the cookie automatically.
 *
 * 3. If fetchMe() returns null (401 = expired/revoked token), the session
 *    is cleared. The user is not logged out on network errors — they see
 *    their cached session instead, so offline usage still works.
 *
 * 4. Exposes `refresh` so child components can force a re-fetch
 *    (useful after admin actions that change your own account).
 */

import { useEffect, useState, useCallback } from "react";
import {
  getSession,
  fetchMe,
  refreshStoredSession,
  clearSession,
  type AuthUser,
} from "@/lib/auth.api";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Manually re-fetches from DB and updates state.
   * Call this after any operation that might change the current user's role.
   */
  const refresh = useCallback(async () => {
    const fresh = await fetchMe();
    if (fresh) {
      refreshStoredSession(fresh);
      setUser(fresh);
    } else {
      clearSession();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const cached = getSession();

      // No cached session at all → not logged in, done immediately
      if (!cached) {
        if (!cancelled) setLoading(false);
        return;
      }

      // Verify with the backend and get fresh role BEFORE setting loading=false.
      // This prevents any flash of incorrect content on protected pages.
      try {
        const fresh = await fetchMe();
        if (cancelled) return;

        if (fresh) {
          // Role may have changed since last login — migrate storage + update state
          refreshStoredSession(fresh);
          setUser(fresh);
        } else {
          // Backend rejected the token (401) → force logout
          clearSession();
          setUser(null);
        }
      } catch {
        // Network error: don't log the user out — fall back to cached session.
        // The backend guards will reject any API calls with an invalid token.
        if (!cancelled) setUser(cached);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = user?.role === "admin";
  const isProvider = user?.role === "provider" || user?.role === "company";
  const isClient = user?.role === "client";

  return { user, loading, isAdmin, isProvider, isClient, refresh };
}
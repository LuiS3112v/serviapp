import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth.api";

/**
 * Reads the authenticated user's UUID from the JWT stored in localStorage.
 *
 * SYNCHRONOUS on client: uses lazy useState initializer so userId is
 * correct from the VERY FIRST render — no useEffect delay, no null flash,
 * no race window where messages render on the wrong side.
 *
 * SSR-safe: returns null during server rendering (window is undefined),
 * then corrects itself immediately after hydration via the useEffect below.
 * No hydration mismatch because both server and client start with null.
 *
 * Single source of truth:
 *   const isMe = userId !== null && message.senderId === userId;
 */

function readUserIdFromJwt(): string | null {
  if (typeof window === "undefined") return null;  // SSR guard
  try {
    const role  = localStorage.getItem("serviapp_active_role") ?? "";
    const token = localStorage.getItem(`serviapp_token_${role}`);
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (typeof payload?.sub === "string" && payload.sub.length > 0) {
        return payload.sub;
      }
    }
  } catch { /* silencioso — malformed token */ }

  // Fallback to session object (graceful degradation)
  return getSession()?.id ?? null;
}

export function useChatUserId(): string | null {
  // Lazy initializer: synchronous on client — userId is NEVER null on first render
  // (unless genuinely logged out). On SSR it returns null and is corrected below.
  const [userId, setUserId] = useState<string | null>(readUserIdFromJwt);

  // Correction for SSR hydration: runs once after mount on the client.
  // If userId is still null after hydration (SSR path), read it now.
  useEffect(() => {
    if (!userId) {
      const id = readUserIdFromJwt();
      if (id) setUserId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return userId;
}
"use client";
/**
 * usePlatformRealtime — canal central de eventos Socket.IO da plataforma.
 *
 * PROBLEMA RAIZ DO PROVIDER:
 *   bindSocket() verificava `if (!token) return` — se o token não estava
 *   disponível no momento exacto do render (possível em SSR/hydration),
 *   o socket nunca ligava e os eventos nunca chegavam.
 *
 * SOLUÇÃO:
 *   bindSocket() é chamado no corpo do hook (síncrono) E num useEffect
 *   (garante que corre no browser com o token disponível). O useEffect
 *   corre após hydration, quando `getToken()` já tem acesso ao
 *   localStorage/cookie e devolve o token real.
 */

import { useEffect, useCallback } from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { getToken } from "@/lib/auth.api";

export type PlatformEventType =
  | "service_updated"
  | "new_service_request"
  | "payment_updated"
  | "dispute_updated"
  | "notification_created"
  | "chat_unread_changed";

type EventCallback = (payload: Record<string, any>) => void;
type Unsubscribe = () => void;

// ─── Singleton de módulo ──────────────────────────────────────────────────────

const globalListeners = new Map<PlatformEventType, Set<EventCallback>>();
let socketBound = false;

function bindSocket() {
  if (socketBound) return;

  // Em SSR ou antes de hydration, getToken() pode devolver null.
  // Nesse caso não faz nada — o useEffect abaixo tenta de novo
  // após hydration quando o token está disponível.
  const token = getToken();
  if (!token) return;

  const socket = connectSocket();
  socketBound = true;

  // Remove listener anterior se existir (seguro chamar mesmo que não exista)
  socket.off("platform_event");

  socket.on("platform_event", (event: { type: PlatformEventType; payload: Record<string, any> }) => {
    if (!event?.type) return;

    if (process.env.NODE_ENV === "development") {
      console.log("[REALTIME]", event.type, event.payload);
    }

    const cbs = globalListeners.get(event.type);
    if (!cbs) return;
    cbs.forEach(cb => { try { cb(event.payload ?? {}); } catch { /**/ } });
  });

  socket.on("disconnect", () => {
    socketBound = false;
  });

  if (process.env.NODE_ENV === "development") {
    socket.on("connect", () => console.log("[REALTIME] socket connected:", socket.id));
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlatformRealtime() {
  // Tenta ligar sincronamente (funciona se o token já está disponível).
  // Em SSR, getToken() devolve null e bindSocket() não faz nada.
  bindSocket();

  // useEffect garante que corre no browser após hydration, quando o
  // token está sempre disponível. Idempotente: se socketBound=true,
  // bindSocket() retorna imediatamente.
  useEffect(() => {
    bindSocket();
  }, []);

  const on = useCallback(
    (type: PlatformEventType, cb: EventCallback): Unsubscribe => {
      if (!globalListeners.has(type)) {
        globalListeners.set(type, new Set());
      }
      globalListeners.get(type)!.add(cb);
      return () => { globalListeners.get(type)?.delete(cb); };
    },
    []
  );

  return { on };
}

export { disconnectSocket };
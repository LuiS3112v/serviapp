"use client";
/**
 * usePlatformRealtime — canal central de eventos Socket.IO da plataforma.
 *
 * PROBLEMA ANTERIOR:
 *   Cada chamada ao hook criava um listenersRef isolado. O ClientChrome
 *   montava o socket e escutava platform_event, mas as páginas chamavam
 *   o hook numa instância separada — os seus callbacks nunca eram invocados
 *   porque estavam num Map diferente.
 *
 * SOLUÇÃO:
 *   O mapa de listeners e o handler do socket vivem em variáveis de módulo
 *   (fora de qualquer componente). São partilhados por todas as instâncias
 *   do hook na mesma sessão de browser. O socket é iniciado uma vez e
 *   reutilizado em todas as páginas.
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

export interface PlatformEvent {
  type: PlatformEventType;
  payload: Record<string, any>;
}

type EventCallback = (payload: Record<string, any>) => void;
type Unsubscribe = () => void;

// ─── Singleton de módulo — partilhado por todas as instâncias do hook ────────

// Map global de callbacks — persiste entre renders e entre páginas.
const globalListeners = new Map<PlatformEventType, Set<EventCallback>>();

// Flag para garantir que o socket.on("platform_event") só é registado uma vez.
let socketInitialised = false;

function initSocket() {
  if (socketInitialised) return;
  const token = getToken();
  if (!token) return;

  const socket = connectSocket();
  socketInitialised = true;

  socket.on("platform_event", (event: PlatformEvent) => {
    if (!event?.type) return;

    if (process.env.NODE_ENV === "development") {
      console.log("[REALTIME]", event.type, event.payload);
    }

    const callbacks = globalListeners.get(event.type);
    if (!callbacks) return;
    callbacks.forEach((cb) => {
      try { cb(event.payload ?? {}); } catch { /* nunca bloqueia os outros */ }
    });
  });

  socket.on("connect", () => {
    if (process.env.NODE_ENV === "development") {
      console.log("[REALTIME] socket connected/reconnected");
    }
  });

  // Quando desliga (logout), repõe a flag para que a próxima sessão
  // possa registar o handler de novo.
  socket.on("disconnect", () => {
    socketInitialised = false;
  });
}

// ─── Hook — apenas regista/remove callbacks no mapa global ───────────────────

export function usePlatformRealtime() {
  // Inicia o socket na primeira vez que qualquer componente monta o hook.
  useEffect(() => {
    initSocket();
  }, []);

  const on = useCallback(
    (type: PlatformEventType, cb: EventCallback): Unsubscribe => {
      if (!globalListeners.has(type)) {
        globalListeners.set(type, new Set());
      }
      globalListeners.get(type)!.add(cb);

      return () => {
        globalListeners.get(type)?.delete(cb);
      };
    },
    []
  );

  return { on };
}

export { disconnectSocket };
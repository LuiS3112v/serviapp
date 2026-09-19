"use client";
/**
 * usePlatformRealtime — canal central de eventos Socket.IO da plataforma.
 *
 * ARQUITECTURA SINGLETON DE MÓDULO:
 *
 * globalListeners  — Map partilhado por todas as instâncias do hook.
 *                    Callbacks registados por qualquer página são todos
 *                    invocados quando o evento chega.
 *
 * initSocket()     — chamada UMA VEZ quando o módulo é importado pelo
 *                    browser (não dentro de useEffect). Garante que o
 *                    socket.on("platform_event") está registado ANTES
 *                    de qualquer página registar callbacks — elimina
 *                    a race condition anterior onde os eventos chegavam
 *                    antes dos callbacks estarem prontos.
 *
 * RECONNECT:
 *   socket.ts já configura reconnection automático. Ao reconectar,
 *   o handler "platform_event" continua activo — não é necessário
 *   re-registar porque o socket.on persiste no objecto Socket mesmo
 *   após disconnect/reconnect (o socket.io-client mantém os handlers).
 *
 * LOGOUT:
 *   disconnectSocket() limpa o socket singleton em socket.ts.
 *   socketBound fica false para que a próxima sessão (novo login)
 *   re-inicialize o handler no novo socket.
 */

import { useCallback } from "react";
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
  const token = getToken();
  if (!token) return;

  const socket = connectSocket();
  socketBound = true;

  socket.on("platform_event", (event: { type: PlatformEventType; payload: Record<string, any> }) => {
    if (!event?.type) return;

    if (process.env.NODE_ENV === "development") {
      console.log("[REALTIME]", event.type, event.payload);
    }

    const cbs = globalListeners.get(event.type);
    if (!cbs) return;
    cbs.forEach(cb => { try { cb(event.payload ?? {}); } catch { /**/ } });
  });

  // Ao desligar, permite que o próximo login crie um socket novo
  // e re-registe o handler (o token pode ter mudado).
  socket.on("disconnect", () => {
    socketBound = false;
  });

  if (process.env.NODE_ENV === "development") {
    socket.on("connect", () => console.log("[REALTIME] connected", socket.id));
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlatformRealtime() {
  // Inicializa o socket sempre que o hook é chamado — bindSocket() é
  // idempotente (verifica socketBound), por isso chamar múltiplas vezes
  // é seguro. Isto garante que o socket está ligado quando o token
  // existe, mesmo que o módulo tenha sido importado antes do login.
  bindSocket();

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
"use client";
/**
 * usePlatformRealtime — canal central de eventos Socket.IO da plataforma.
 *
 * ARQUITECTURA:
 *   Backend emite `platform_event` com { type, payload } no namespace /chat
 *   (via ChatGateway.emitToUser) sempre que algo relevante acontece.
 *   Este hook escuta esse evento e chama os callbacks registados pelas páginas.
 *
 * PORQUÊ NO NAMESPACE /chat:
 *   O namespace /chat já tem autenticação JWT por socket, rooms user:{userId},
 *   reconnect configurado e singleton de socket. Reutilizamos essa infra em
 *   vez de criar um terceiro gateway/socket — menos conexões, mesmo nível
 *   de segurança.
 *
 * COMO USAR NUMA PÁGINA:
 *   const { on } = usePlatformRealtime();
 *   useEffect(() => {
 *     return on('service_updated', (payload) => {
 *       // refetch ou setState
 *     });
 *   }, [on]);
 *
 * CLEANUP:
 *   on() devolve uma função de cleanup — usar no return do useEffect.
 *   O socket em si só é desligado em logout (disconnectSocket).
 */

import { useEffect, useRef, useCallback } from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { getToken } from "@/lib/auth.api";

// Tipos dos eventos que o backend pode emitir
export type PlatformEventType =
  | "service_updated"       // qualquer mudança de estado num serviço
  | "new_service_request"   // provider recebe novo pedido do cliente
  | "payment_updated"       // prova submetida, confirmada, rejeitada
  | "dispute_updated"       // disputa aberta, resolvida
  | "notification_created"  // nova notificação (actualiza badge)
  | "chat_unread_changed";  // nova mensagem (actualiza badge de chat)

export interface PlatformEvent {
  type: PlatformEventType;
  payload: Record<string, any>;
}

type EventCallback = (payload: Record<string, any>) => void;
type Unsubscribe = () => void;

export function usePlatformRealtime() {
  // Map de callbacks por tipo de evento — múltiplas páginas podem
  // registar callbacks para o mesmo tipo ao mesmo tempo.
  const listenersRef = useRef<Map<PlatformEventType, Set<EventCallback>>>(
    new Map()
  );
  const handlerRef = useRef<((event: PlatformEvent) => void) | null>(null);
  const connectedRef = useRef(false);

  // Registar listener para um tipo de evento.
  // Devolve função de cleanup para usar no return do useEffect da página.
  const on = useCallback(
    (type: PlatformEventType, cb: EventCallback): Unsubscribe => {
      if (!listenersRef.current.has(type)) {
        listenersRef.current.set(type, new Set());
      }
      listenersRef.current.get(type)!.add(cb);
      return () => {
        listenersRef.current.get(type)?.delete(cb);
      };
    },
    []
  );

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = connectSocket();
    connectedRef.current = true;

    // Handler único para todos os eventos da plataforma.
    // Um único socket.on em vez de N listeners — sem risco de duplicação.
    const handler = (event: PlatformEvent) => {
      if (!event?.type) return;

      // Despacha para todos os callbacks registados para este tipo
      const callbacks = listenersRef.current.get(event.type);
      if (callbacks) {
        callbacks.forEach((cb) => {
          try {
            cb(event.payload ?? {});
          } catch (err) {
            // Não deixa um callback com erro interromper os outros
            if (process.env.NODE_ENV === "development") {
              console.error("[REALTIME] callback error:", err);
            }
          }
        });
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[REALTIME]", event.type, event.payload);
      }
    };

    handlerRef.current = handler;
    socket.on("platform_event", handler);

    // Reconexão: o socket.ts já configura reconnection automático.
    // Quando o socket reconecta, o gateway re-join do user:{userId}
    // acontece automaticamente em handleConnection.
    socket.on("connect", () => {
      if (process.env.NODE_ENV === "development") {
        console.log("[REALTIME] socket connected/reconnected");
      }
    });

    return () => {
      if (handlerRef.current) {
        socket.off("platform_event", handlerRef.current);
        handlerRef.current = null;
      }
      connectedRef.current = false;
    };
  }, []);

  return { on };
}

// Exporta disconnect para ser chamado em logout
export { disconnectSocket };
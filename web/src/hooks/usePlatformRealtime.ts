"use client";
/**
 * usePlatformRealtime — canal central de eventos Socket.IO da plataforma.
 *
 * BUG RAIZ CORRIGIDO:
 *   Após uma desconexão, socket.io cria internamente um novo socket ao
 *   reconectar. O listener de "platform_event" estava registado no socket
 *   ANTERIOR via socket.on(), mas quando o socket reconectava, o handler
 *   "disconnect" punha socketBound=false e a próxima chamada a bindSocket()
 *   criava um NOVO socket sem re-registar o listener de "platform_event".
 *   Resultado: eventos chegavam ao servidor mas o frontend não os processava.
 *
 * SOLUÇÃO:
 *   Separar "criar socket" de "registar listeners". O listener de
 *   "platform_event" é registado via connectSocket() que devolve sempre o
 *   mesmo singleton (ou um novo se o token mudou). Ao reconectar, o Socket.IO
 *   reutiliza o mesmo objeto Socket — o listener "on connect" re-envia o
 *   join de room automaticamente pelo servidor. Registamos o listener uma vez
 *   no objeto socket, não por chamada a bindSocket().
 *
 *   O socketBound controla se JÁ adicionámos os listeners ao objeto socket
 *   actual. Se o socket for recriado (token mudou — ver socket.ts), o
 *   connectSocket() devolve um novo objeto e socketBound volta a false,
 *   forçando re-registo.
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

// Guardamos a referência ao socket onde os listeners foram registados.
// Se connectSocket() devolver um socket diferente (token mudou → socket recriado),
// re-registamos os listeners no novo socket.
let boundSocket: ReturnType<typeof connectSocket> | null = null;

function bindSocket() {
  const token = getToken();
  // Sem token: não há utilizador autenticado — não ligar socket.
  if (!token) return;

  const socket = connectSocket();

  // Se já registámos os listeners neste mesmo objeto socket, não fazer nada.
  // Se o socket foi recriado (token mudou), boundSocket !== socket → re-registar.
  if (boundSocket === socket) return;

  // Remove listeners anteriores do socket anterior, se existir.
  if (boundSocket) {
    boundSocket.off("platform_event");
  }

  boundSocket = socket;

  // Remove qualquer listener duplicado que possa existir no novo socket.
  socket.off("platform_event");

  socket.on("platform_event", (event: { type: PlatformEventType; payload: Record<string, any> }) => {
    if (!event?.type) return;

    console.log("[REALTIME] evento recebido:", event.type, event.payload);

    const cbs = globalListeners.get(event.type);
    console.log("[REALTIME] callbacks registados para", event.type, ":", cbs?.size ?? 0);
    if (!cbs) return;
    cbs.forEach(cb => {
      try { cb(event.payload ?? {}); }
      catch (err) { console.error("[REALTIME] erro no callback:", err); }
    });
  });

  // Quando o socket desconecta e reconecta, o Socket.IO reutiliza o mesmo
  // objeto Socket — os listeners "on" permanecem válidos. Não precisamos de
  // re-registar o listener de platform_event aqui. Mas registamos logs para
  // diagnóstico.
  socket.on("disconnect", (reason) => {
    console.log("[REALTIME] socket desconectou:", reason);
    // NÃO apagamos boundSocket aqui — o objeto socket é o mesmo após
    // reconexão automática do Socket.IO. O listener de platform_event
    // continua válido no mesmo objeto.
  });

  socket.on("connect", () => {
    console.log("[REALTIME] socket ligado ao /chat — id:", socket.id);
    // Após reconexão, sincroniza os contadores de chat e notificações
    // para não ficarem desactualizados (eventos que chegaram enquanto
    // estava offline não são reenviados pelo Socket.IO).
    // Importação dinâmica para evitar dependência circular de módulo.
    import("@/lib/chat.api").then(({ chatApi }) => {
      chatApi.getUnread().then(d => {
        const cbs = globalListeners.get("chat_unread_changed");
        if (cbs) cbs.forEach(cb => { try { cb({ total: d.count }); } catch {} });
      }).catch(() => {});
    });
    import("@/lib/notifications.api").then(({ notificationsApi }) => {
      notificationsApi.getUnreadCount().then(d => {
        // Dispara notification_created sintético com payload especial
        // { _sync: true, total } para os Navbars poderem substituir
        // o contador em vez de incrementar.
        const cbs = globalListeners.get("notification_created");
        if (cbs) cbs.forEach(cb => { try { cb({ _sync: true, total: d.count }); } catch {} });
      }).catch(() => {});
    });
  });

  socket.on("connect_error", (err) => {
    console.error("[REALTIME] erro de ligação:", err.message);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlatformRealtime() {
  // Tenta ligar sincronamente (funciona se o token já está disponível).
  // Em SSR, getToken() devolve null e bindSocket() não faz nada.
  bindSocket();

  // useEffect garante que corre no browser após hydration, quando o
  // token está sempre disponível. Idempotente: se boundSocket === socket atual,
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

// Limpa o estado do módulo — chamar no logout para garantir que a
// próxima sessão começa com um socket limpo e sem listeners herdados.
export function resetRealtime(): void {
  if (boundSocket) {
    boundSocket.off("platform_event");
    boundSocket.off("connect");
    boundSocket.off("disconnect");
    boundSocket.off("connect_event");
    boundSocket = null;
  }
  globalListeners.clear();
  disconnectSocket();
}

export { disconnectSocket };
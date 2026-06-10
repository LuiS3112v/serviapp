import { io, Socket } from "socket.io-client";
import { getToken } from "./auth.api";

const WS_URL = (
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/api\/?$/, "")
);

let _socket: Socket | null = null;
let _tokenAtConnect: string | null = null;

/**
 * Returns a Socket.IO connection for the /chat namespace.
 *
 * ROOT CAUSE FIX:
 * The gateway's handleConnection() sets client.data.userId = payload.sub.
 * This only fires when a NEW socket connection is established.
 * If the auth token changes (user logs out / switches account) but the socket
 * stays alive, the server keeps client.data.userId from the OLD token.
 * Every message sent via that socket gets the OLD user's senderId — causing
 * the ownership bug that survives all frontend fixes.
 *
 * Fix: compare the current token to the one used at connect time.
 * If they differ, disconnect the old socket so handleConnection() fires again
 * with the new user's JWT.
 */
export function connectSocket(): Socket {
  const currentToken = getToken();

  // Token changed → old socket has wrong user identity on the server.
  // Disconnect it so the server's handleConnection() fires for the new user.
  if (_socket !== null && _tokenAtConnect !== currentToken) {
    try { _socket.disconnect(); } catch { /* silencioso */ }
    _socket = null;
    _tokenAtConnect = null;
  }

  if (_socket === null) {
    _socket = io(`${WS_URL}/chat`, {
      auth:                { token: currentToken ?? "" },
      transports:          ["websocket", "polling"],
      autoConnect:         true,
      reconnection:        true,
      reconnectionAttempts: 10,
      reconnectionDelay:   500,
      reconnectionDelayMax: 4000,
    });
    _tokenAtConnect = currentToken;
  }

  return _socket;
}

/**
 * Force-disconnect and clear the singleton.
 * Call this on logout to ensure the next login gets a fresh connection
 * with the new user's JWT.
 */
export function disconnectSocket(): void {
  if (_socket) {
    try { _socket.disconnect(); } catch { /* silencioso */ }
    _socket = null;
    _tokenAtConnect = null;
  }
}
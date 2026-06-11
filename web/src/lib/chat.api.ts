import { api } from "./api";

export interface ChatParticipant {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface ChatRoom {
  id: string;
  clientId?: string;
  providerId?: string;
  client?: ChatParticipant;
  provider?: ChatParticipant;
  participants: ChatParticipant[];
  lastMessage?: string | { content: string; createdAt: string; senderId?: string };
  lastMessageAt?: string;
  // ─── Unread counters — vêm do backend ───────────────────────────────────
  clientUnread?: number;
  providerUnread?: number;
  unreadCount?: number;
  serviceId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
  isBlocked?: boolean;
}

export interface CreateRoomPayload {
  participantId: string;
  serviceId?: string;
}

// Normaliza qualquer formato de resposta do backend para { room: ChatRoom }
function normalizeRoomResponse(data: any): { room: ChatRoom } {
  let raw: any;

  // Backend retorna { room: {...} } ou directamente {...}
  if (data && typeof data === "object" && "room" in data) {
    raw = data.room;
  } else {
    raw = data;
  }

  // Constrói participants a partir de client/provider se não existir array
  const participants: ChatParticipant[] = raw.participants ?? [];
  if (participants.length === 0) {
    if (raw.client?.id) participants.push({ id: raw.client.id, fullName: raw.client.fullName, avatarUrl: raw.client.avatarUrl });
    if (raw.provider?.id) participants.push({ id: raw.provider.id, fullName: raw.provider.fullName, avatarUrl: raw.provider.avatarUrl });
  }

  const room: ChatRoom = { ...raw, participants };
  return { room };
}

// Normaliza formato de mensagens — backend retorna [] ou { messages: [] }
function normalizeMessages(data: any): ChatMessage[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.messages)) return data.messages;
  return [];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
import { getToken } from "./auth.api";

export const chatApi = {
  createOrGetRoom: async (payload: CreateRoomPayload): Promise<{ room: ChatRoom }> => {
    const data = await api.post<any>("/chat/rooms", payload);
    return normalizeRoomResponse(data);
  },

  getOrCreateRoom: async (payload: CreateRoomPayload): Promise<{ room: ChatRoom }> => {
    const data = await api.post<any>("/chat/rooms", payload);
    return normalizeRoomResponse(data);
  },

  getRooms: async (): Promise<ChatRoom[]> => {
    const data = await api.get<any>("/chat/rooms");
    const rooms: any[] = Array.isArray(data) ? data : (data?.rooms ?? []);
    return rooms.map(raw => {
      const participants: ChatParticipant[] = raw.participants ?? [];
      if (participants.length === 0) {
        if (raw.client?.id) participants.push({ id: raw.client.id, fullName: raw.client.fullName, avatarUrl: raw.client.avatarUrl });
        if (raw.provider?.id) participants.push({ id: raw.provider.id, fullName: raw.provider.fullName, avatarUrl: raw.provider.avatarUrl });
      }
      return { ...raw, participants };
    });
  },

  getMessages: async (roomId: string, page = 1, limit = 50): Promise<ChatMessage[]> => {
    const data = await api.get<any>(`/chat/rooms/${roomId}/messages?page=${page}&limit=${limit}`);
    return normalizeMessages(data);
  },

  sendMessage: (roomId: string, content: string) =>
    api.post<ChatMessage>("/chat/messages", { roomId, content }),

  getUnread: () =>
    api.get<{ count: number }>("/chat/unread"),
};
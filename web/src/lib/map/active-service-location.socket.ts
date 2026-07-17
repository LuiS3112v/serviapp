import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/auth.api';
import { MapCoordinates } from './map-provider.types';

export interface ServiceLocationSnapshot {
  serviceId: string;
  providerId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

type SnapshotListener = (snapshot: ServiceLocationSnapshot) => void;
type ErrorListener = (message: string) => void;

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/api$/, '') +
  '/service-location';

// Wrapper fino sobre o socket do namespace /service-location, seguindo
// o mesmo padrão de autenticação por token no handshake já usado no
// socket do chat. Mantém uma única ligação persistente reutilizada
// entre montagens do componente de mapa, para evitar reconexões
// desnecessárias quando o utilizador navega dentro da mesma página.
class ActiveServiceLocationSocket {
  private socket: Socket | null = null;
  private currentServiceId: string | null = null;

  private ensureConnected(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = getToken();

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    return this.socket;
  }

  joinService(
    serviceId: string,
    onSnapshot: SnapshotListener,
    onError?: ErrorListener,
  ): void {
    const socket = this.ensureConnected();

    if (this.currentServiceId && this.currentServiceId !== serviceId) {
      socket.emit('leave_service', { serviceId: this.currentServiceId });
    }

    this.currentServiceId = serviceId;

    socket.off('provider_location');
    socket.off('service_location_error');

    socket.on('provider_location', onSnapshot);

    if (onError) {
      socket.on('service_location_error', (payload: { error: string }) => {
        onError(payload.error);
      });
    }

    socket.emit('join_service', { serviceId });
  }

  updateProviderLocation(serviceId: string, coordinates: MapCoordinates): void {
    const socket = this.ensureConnected();
    socket.emit('update_provider_location', {
      serviceId,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });
  }

  leaveService(serviceId: string): void {
    if (this.socket && this.currentServiceId === serviceId) {
      this.socket.emit('leave_service', { serviceId });
      this.currentServiceId = null;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentServiceId = null;
    }
  }
}

export const activeServiceLocationSocket = new ActiveServiceLocationSocket();
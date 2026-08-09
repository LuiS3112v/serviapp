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

// Estado da ligação ao gateway de localização, exposto ao ServiceMap
// para que a UI possa distinguir "nunca chegou nada ainda" de "ligação
// perdida, a tentar recuperar" — em vez de um único booleano que
// esconde essa diferença.
export type SocketConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

type SnapshotListener = (snapshot: ServiceLocationSnapshot) => void;
type ErrorListener = (message: string) => void;
type ConnectionListener = (state: SocketConnectionState) => void;

// Assinatura real do handler registado no socket para o evento de
// erro — distinta de ErrorListener porque o payload bruto que chega
// do backend é { error: string }, não a string já extraída que o
// consumidor de joinService recebe. Guardar isto num campo com o tipo
// ErrorListener era o erro de tipagem original: as duas funções têm
// assinaturas diferentes e não são intercambiáveis.
type RawErrorHandler = (payload: { error: string }) => void;

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/api$/, '') +
  '/service-location';

// Wrapper fino sobre o socket do namespace /service-location, seguindo
// o mesmo padrão de autenticação por token no handshake já usado no
// socket do chat. Mantém uma única ligação persistente reutilizada
// entre montagens do componente de mapa, para evitar reconexões
// desnecessárias quando o utilizador navega dentro da mesma página.
//
// Acrescento face à versão anterior: rejoin automático da sala atual
// sempre que o socket reconecta (queda de rede, mobile, etc.) — sem
// isto, uma reconexão do Socket.IO client (que acontece sozinha, por
// omissão) nunca volta a colocar o cliente na room do serviço, porque
// rooms não sobrevivem a uma troca de conexão TCP subjacente. O
// cliente ficava então preso sem nunca mais receber 'provider_location'
// até um refresh manual da página.
class ActiveServiceLocationSocket {
  private socket: Socket | null = null;
  private currentServiceId: string | null = null;

  private snapshotListener: SnapshotListener | null = null;
  private rawErrorHandler: RawErrorHandler | null = null;
  private connectionListeners = new Set<ConnectionListener>();

  private connectionState: SocketConnectionState = 'disconnected';

  private setConnectionState(state: SocketConnectionState): void {
    this.connectionState = state;
    this.connectionListeners.forEach((listener) => listener(state));
  }

  getConnectionState(): SocketConnectionState {
    return this.connectionState;
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    // Entrega o estado atual de imediato, para que um subscritor tardio
    // (ex: ServiceMap montado depois da ligação já existir) não fique
    // sem saber o estado até ao próximo evento.
    listener(this.connectionState);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  private ensureConnected(): Socket {
    if (this.socket) {
      return this.socket;
    }

    const token = getToken();

    this.setConnectionState('connecting');

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });

    socket.on('connect', () => {
      this.setConnectionState('connected');

      // Se já estávamos numa sala antes desta (re)conexão, o servidor
      // não sabe disso — a room anterior morreu com a conexão TCP
      // anterior. Reemitir join_service é obrigatório para voltar a
      // receber updates, e o gateway responde de imediato com o
      // snapshot mais recente que tiver em memória (se existir),
      // dando ao cliente uma posição atual sem esperar pelo próximo
      // movimento do prestador.
      if (this.currentServiceId) {
        socket.emit('join_service', { serviceId: this.currentServiceId });
      }
    });

    socket.on('disconnect', () => {
      // 'connecting' seria enganoso aqui — a ligação existiu e caiu,
      // não é o primeiro contacto. 'reconnecting' comunica que o
      // socket.io-client vai tentar sozinho, sem ação do utilizador.
      this.setConnectionState('reconnecting');
    });

    socket.on('connect_error', () => {
      // Cobre falha na primeira tentativa (ex: token inválido rejeitado
      // no handshake) e falhas durante tentativas de reconexão. Em
      // ambos os casos o utilizador deve ver "sem ligação", nunca ficar
      // preso num estado "a conectar" silencioso.
      this.setConnectionState(
        this.connectionState === 'connected' ? 'reconnecting' : 'disconnected',
      );
    });

    this.socket = socket;
    return socket;
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

    if (this.snapshotListener) {
      socket.off('provider_location', this.snapshotListener);
    }
    if (this.rawErrorHandler) {
      socket.off('service_location_error', this.rawErrorHandler);
    }

    this.snapshotListener = onSnapshot;
    socket.on('provider_location', onSnapshot);

    if (onError) {
      const rawHandler: RawErrorHandler = (payload) => onError(payload.error);
      this.rawErrorHandler = rawHandler;
      socket.on('service_location_error', rawHandler);
    } else {
      this.rawErrorHandler = null;
    }

    // Se o socket já estiver ligado neste preciso instante, emite já;
    // caso contrário o handler de 'connect' acima trata do primeiro
    // join assim que a ligação abrir (o socket.io-client não garante
    // buffering de emits antes do primeiro connect em todas as
    // versões/transportes, por isso não confiamos nisso).
    if (socket.connected) {
      socket.emit('join_service', { serviceId });
    }
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
    if (this.socket) {
      if (this.snapshotListener) {
        this.socket.off('provider_location', this.snapshotListener);
        this.snapshotListener = null;
      }
      if (this.rawErrorHandler) {
        this.socket.off('service_location_error', this.rawErrorHandler);
        this.rawErrorHandler = null;
      }
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentServiceId = null;
      this.snapshotListener = null;
      this.rawErrorHandler = null;
    }
    this.setConnectionState('disconnected');
  }
}

export const activeServiceLocationSocket = new ActiveServiceLocationSocket();
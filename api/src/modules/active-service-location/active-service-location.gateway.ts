import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ActiveServiceLocationService } from './active-service-location.service';

interface LocationUpdatePayload {
  serviceId: string;
  latitude: number;
  longitude: number;
}

interface JoinServicePayload {
  serviceId: string;
}

@WebSocketGateway({
  cors: {
    origin: (process.env.ALLOWED_ORIGINS ?? '*').split(',').map(o => o.trim()),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  namespace: '/service-location',
})
export class ActiveServiceLocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private locationService: ActiveServiceLocationService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.role = payload.role;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Nada a limpar aqui: as salas por serviço são efémeras e o socket
    // sai delas automaticamente na desconexão.
  }

  @SubscribeMessage('join_service')
  async handleJoinService(
    @MessageBody() data: JoinServicePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    const role = client.data.role;

    if (!userId) {
      client.emit('service_location_error', { error: 'Sessão inválida.' });
      return;
    }

    try {
      const service = await this.locationService.assertParticipant(
        data.serviceId, userId, role,
      );

      if (!this.locationService.isServiceStateAllowed(service)) {
        client.emit('service_location_error', {
          error: 'Este serviço não tem localização partilhada disponível.',
        });
        return;
      }

      client.join(`service:${data.serviceId}`);

      const snapshot = this.locationService.getSnapshot(data.serviceId);
      if (snapshot) {
        client.emit('provider_location', snapshot);
      }
    } catch (error) {
      client.emit('service_location_error', {
        error: (error as Error).message,
      });
    }
  }

  @SubscribeMessage('leave_service')
  handleLeaveService(
    @MessageBody() data: JoinServicePayload,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`service:${data.serviceId}`);
  }

  @SubscribeMessage('update_provider_location')
  async handleUpdateLocation(
    @MessageBody() data: LocationUpdatePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const providerId = client.data.userId;

    if (!providerId) {
      client.emit('service_location_error', { error: 'Sessão inválida.' });
      return;
    }

    try {
      const snapshot = await this.locationService.recordPosition(
        data.serviceId, providerId, data.latitude, data.longitude,
      );

      this.server.to(`service:${data.serviceId}`).emit('provider_location', snapshot);
    } catch (error) {
      client.emit('service_location_error', {
        error: (error as Error).message,
      });
    }
  }
}
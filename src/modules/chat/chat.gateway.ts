import {
  WebSocketGateway, SubscribeMessage, MessageBody,
  ConnectedSocket, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      this.userSockets.set(payload.sub, client.id);
      client.join(`user:${payload.sub}`);

      // Marca provider/user como online
      await this.userRepo.update(payload.sub, {
        isOnline: true,
        lastSeenAt: new Date(),
      });
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.userSockets.delete(client.data.userId);

      // ─── FIX: marca utilizador como offline ──────────────────────────────
      await this.userRepo.update(client.data.userId, {
        isOnline: false,
        lastSeenAt: new Date(),
      }).catch(() => {}); // silencioso — não bloqueia o disconnect
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`room:${roomId}`);
    return { event: 'joined', data: roomId };
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`room:${roomId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() data: { roomId: string; content: string; type?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const message = await this.chatService.saveMessage(userId, {
        roomId: data.roomId,
        content: data.content,
        type: data.type as any,
      });

      // Emite para TODOS na sala (incluindo o remetente para confirmar)
      this.server.to(`room:${data.roomId}`).emit('new_message', message);
      return message;
    } catch (e) {
      client.emit('message_error', { error: (e as any).message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`room:${data.roomId}`).emit('typing', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
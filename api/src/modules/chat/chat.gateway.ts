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

// SECURITY FIX: throttle manual por socket para o evento send_message.
// O ThrottlerGuard global (APP_GUARD em app.module.ts) só se aplica a
// rotas HTTP — não intercepta mensagens de WebSocket. Sem isto, um
// cliente ligado por WebSocket podia emitir send_message em loop
// apertado, sem qualquer limite, ao contrário do POST /chat/messages
// equivalente por REST (que já herda o throttle HTTP global). Limite
// simples em memória por socket: 20 mensagens em 10 segundos.
const MESSAGE_RATE_LIMIT = 20;
const MESSAGE_RATE_WINDOW_MS = 10_000;

// Render doesn't support sticky sessions on free tier.
// Setting transports to ['websocket', 'polling'] and allowEIO3: true
// prevents connection drops.
@WebSocketGateway({
  cors: {
    origin: (process.env.ALLOWED_ORIGINS ?? '*').split(',').map(o => o.trim()),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();
  private messageTimestamps = new Map<string, number[]>();

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
      this.messageTimestamps.delete(client.data.userId);
      this.userSockets.delete(client.data.userId);

      // ─── FIX: marca utilizador como offline ──────────────────────────────
      await this.userRepo.update(client.data.userId, {
        isOnline: false,
        lastSeenAt: new Date(),
      }).catch(() => {}); // silencioso — não bloqueia o disconnect
    }
  }

  // SECURITY FIX (IDOR): antes, qualquer socket autenticado conseguia
  // entrar em QUALQUER room:${roomId} só por conhecer o UUID — sem
  // nenhuma verificação de que o utilizador é realmente clientId ou
  // providerId dessa ChatRoom. A partir desse join, o socket passava a
  // receber em tempo real todos os eventos 'new_message' emitidos
  // pelo handleMessage para essa sala (this.server.to(`room:${roomId}`)
  // .emit('new_message', ...)), ou seja, conseguia ler conversas
  // alheias em tempo real mesmo sem conseguir aceder ao histórico via
  // REST (que já validava ownership em chatService.getMessages).
  //
  // Corrigido replicando o mesmo padrão já usado e correto em
  // active-service-location.gateway.ts (handleJoinService): valida
  // participante ANTES de client.join(), usando um método dedicado no
  // ChatService (assertParticipant), que segue a mesma verificação já
  // existente em chatService.getMessages()/saveMessage()
  // (room.clientId !== userId && room.providerId !== userId).
  //
  // Passou a ser assíncrono porque assertParticipant faz uma query.
  // Em caso de falha (sala inexistente ou utilizador não participante),
  // o socket recebe 'join_error' e NÃO é adicionado à room — nunca
  // chega a receber nenhum evento dela.
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() roomId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.emit('join_error', { error: 'Sessão inválida.' });
      return;
    }

    try {
      await this.chatService.assertParticipant(roomId, userId);
    } catch (e) {
      client.emit('join_error', { error: (e as any).message ?? 'Sem acesso a esta conversa.' });
      return;
    }

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

    // SECURITY FIX: rate limit por utilizador para este evento
    // específico — ver comentário no topo do ficheiro.
    const now = Date.now();
    const timestamps = (this.messageTimestamps.get(userId) ?? [])
      .filter(t => now - t < MESSAGE_RATE_WINDOW_MS);

    if (timestamps.length >= MESSAGE_RATE_LIMIT) {
      client.emit('message_error', {
        error: 'Estás a enviar mensagens demasiado rápido. Espera um pouco.',
      });
      return;
    }

    timestamps.push(now);
    this.messageTimestamps.set(userId, timestamps);

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
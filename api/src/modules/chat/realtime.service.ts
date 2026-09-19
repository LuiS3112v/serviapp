import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

/**
 * RealtimeService — camada de indireção entre o ChatGateway e os
 * restantes serviços (NotificationsService, etc.).
 *
 * PROBLEMA ANTERIOR:
 *   NotificationsService injectava ChatGateway directamente.
 *   Como ChatGateway é um WebSocketGateway, o seu `server` (Socket.IO Server)
 *   só fica disponível DEPOIS do NestJS inicializar o WebSocket adapter —
 *   o que acontece após todos os módulos serem instanciados. Quando
 *   NotificationsService tentava usar chatGateway.emitToUser() no arranque,
 *   this.server era undefined e os eventos eram descartados silenciosamente.
 *
 * SOLUÇÃO:
 *   O ChatGateway regista o seu `server` aqui via setServer() logo que
 *   o WebSocket adapter o disponibiliza (afterInit). Os outros serviços
 *   chamam emitToUser() daqui — que verifica se o server está pronto
 *   antes de emitir. Sem dependência circular, sem forwardRef, sem timing.
 */
@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  // Chamado pelo ChatGateway.afterInit() quando o WebSocket server está pronto.
  setServer(server: Server): void {
    this.server = server;
    this.logger.log('[REALTIME] WebSocket server registado — pronto para emitir eventos');
  }

  // Emite platform_event para o utilizador identificado por userId.
  // Seguro chamar antes do server estar pronto — o evento é descartado
  // com um warning em vez de lançar excepção.
  emitToUser(
    userId: string,
    type: string,
    payload: Record<string, any> = {},
  ): void {
    if (!this.server) {
      this.logger.warn(`[REALTIME] server ainda não pronto — evento ${type} para ${userId} descartado`);
      return;
    }
    try {
      this.server.to(`user:${userId}`).emit('platform_event', { type, payload });
      this.logger.debug(`[REALTIME] emitido ${type} → user:${userId}`);
    } catch (err) {
      this.logger.warn(`[REALTIME] falhou emitir ${type} para ${userId}: ${err}`);
    }
  }
}
import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from '../../database/entities/chat-room.entity';
import { ChatMessage, MessageType } from '../../database/entities/chat-message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';

const BLOCKED_PATTERNS = [
  /(\+244|\+351|\+1|\+44)\s?\d{7,}/,
  /\b9\d{8}\b/,
  /\b\d{9}\b/,
  /(whatsapp|zap|wpp|telegram|instagram|facebook|tiktok)/i,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i,
];

function containsBlockedContent(text: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(text));
}

// SECURITY FIX: limite de tamanho para o conteúdo de uma mensagem.
// Antes não havia nenhum — content: string vinha do DTO com apenas
// class-validator a garantir que é string, sem MaxLength. Um cliente
// podia enviar uma mensagem de megabytes, sobrecarregando a BD, o
// broadcast via WebSocket para toda a sala, e o payload de
// getMessages() para todos os outros participantes.
const MAX_MESSAGE_LENGTH = 4000;

// Select explícito reutilizado em todos os pontos deste service que
// precisam de expor dados do outro participante da conversa (nome,
// avatar, categoria) sem nunca carregar a entidade User completa —
// nunca password, twoFactorSecret, twoFactorTempSecret, email
// completo ou telefone.
const SAFE_USER_SELECT = {
  id: true,
  fullName: true,
  avatarUrl: true,
  category: true,
  isOnline: true,
} as const;

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private roomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private messageRepo: Repository<ChatMessage>,
  ) {}

  async getOrCreateRoom(
    currentUserId: string,
    dto: CreateRoomDto,
  ): Promise<{ room: ChatRoom; isNew: boolean }> {
    // Aceita participantId (novo) ou providerId (retrocompatível)
    const participantId = dto.participantId ?? dto.providerId;
    if (!participantId) throw new NotFoundException('participantId é obrigatório.');

    // ─── FIX CRÍTICO: pesquisa AMBAS as direcções ─────────────────────────
    // Qualquer utilizador pode iniciar a conversa — não importa quem é
    // "client" ou "provider" na sala. Evita salas duplicadas.
    //
    // SECURITY FIX: relations:{client:true,provider:true} substituído
    // por select explícito (SAFE_USER_SELECT) — antes carregava o User
    // completo de ambos os participantes, incluindo password hash e
    // segredos de 2FA, em toda resposta de criação/obtenção de sala.
    // Esta era exactamente a rota que o teu teste manual (observar as
    // requests da API) apanhou.
    let room = await this.roomRepo.findOne({
      where: [
        { clientId: currentUserId, providerId: participantId },
        { clientId: participantId, providerId: currentUserId },
      ],
      relations: { client: true, provider: true },
      select: {
        id: true,
        clientId: true,
        providerId: true,
        serviceId: true,
        lastMessage: true,
        lastMessageAt: true,
        clientUnread: true,
        providerUnread: true,
        createdAt: true,
        updatedAt: true,
        client: SAFE_USER_SELECT,
        provider: SAFE_USER_SELECT,
      },
    });

    let isNew = false;

    if (!room) {
      const created = this.roomRepo.create({
        clientId: currentUserId,
        providerId: participantId,
        serviceId: dto.serviceId ?? null,
      });
      const savedRoom = await this.roomRepo.save(created);
      room = await this.roomRepo.findOne({
        where: { id: savedRoom.id },
        relations: { client: true, provider: true },
        select: {
          id: true,
          clientId: true,
          providerId: true,
          serviceId: true,
          lastMessage: true,
          lastMessageAt: true,
          clientUnread: true,
          providerUnread: true,
          createdAt: true,
          updatedAt: true,
          client: SAFE_USER_SELECT,
          provider: SAFE_USER_SELECT,
        },
      }) as ChatRoom;
      isNew = true;
    }

    if (dto.initialMessage && isNew) {
      await this.saveMessage(currentUserId, {
        roomId: room.id,
        content: dto.initialMessage,
        type: MessageType.TEXT,
      });
    }

    return { room, isNew };
  }

  async getRooms(userId: string): Promise<ChatRoom[]> {
    // ─── FIX CRÍTICO: remove o filtro lastMessageAt IS NOT NULL ───────────
    // Salas novas (sem mensagens ainda) devem aparecer imediatamente.
    //
    // SECURITY FIX: leftJoinAndSelect('room.client', 'client') e
    // leftJoinAndSelect('room.provider', 'provider') carregavam as
    // colunas TODAS de User (incluindo password) para cada sala
    // devolvida na lista de conversas do utilizador — a superfície mais
    // exposta do leak, porque é chamada sempre que a lista de chats
    // abre. Substituído por .addSelect com as colunas específicas via
    // query builder, que é o equivalente correcto de "select" restrito
    // quando se usa createQueryBuilder em vez de find()/findOne().
    return this.roomRepo
      .createQueryBuilder('room')
      .leftJoin('room.client', 'client')
      .addSelect([
        'client.id', 'client.fullName', 'client.avatarUrl',
        'client.category', 'client.isOnline',
      ])
      .leftJoin('room.provider', 'provider')
      .addSelect([
        'provider.id', 'provider.fullName', 'provider.avatarUrl',
        'provider.category', 'provider.isOnline',
      ])
      .where('room.clientId = :userId OR room.providerId = :userId', { userId })
      .orderBy('COALESCE(room."lastMessageAt", room."createdAt")', 'DESC')
      .getMany();
  }

  async getMessages(
    roomId: string,
    userId: string,
    page = 1,
    limit = 50,
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Conversa não encontrada.');
    if (room.clientId !== userId && room.providerId !== userId) {
      throw new ForbiddenException('Sem acesso a esta conversa.');
    }

    // SECURITY FIX: relations:{sender:true} carregava o User completo
    // do remetente de CADA mensagem na página — o payload mais grande
    // e mais frequente de todo o chat (getMessages é chamado sempre
    // que uma conversa abre, e de novo a cada página de scroll).
    // Substituído por select explícito restrito.
    const [messages, total] = await this.messageRepo.findAndCount({
      where: { roomId },
      relations: { sender: true },
      select: {
        id: true,
        roomId: true,
        senderId: true,
        content: true,
        type: true,
        isRead: true,
        isBlocked: true,
        blockedReason: true,
        createdAt: true,
        sender: SAFE_USER_SELECT,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    await this.markAsRead(roomId, userId);

    return { messages: messages.reverse(), total };
  }

  async saveMessage(
    senderId: string,
    dto: SendMessageDto,
  ): Promise<ChatMessage> {
    const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException('Conversa não encontrada.');
    if (room.clientId !== senderId && room.providerId !== senderId) {
      throw new ForbiddenException('Sem acesso a esta conversa.');
    }

    // SECURITY FIX: limite de tamanho da mensagem. dto.content já
    // devia ter validação no DTO (MaxLength) — mas como defesa em
    // profundidade, este service nunca confia apenas na camada de
    // validação de entrada; corta explicitamente aqui também.
    if (dto.content.length > MAX_MESSAGE_LENGTH) {
      throw new ForbiddenException(
        `Mensagem excede o limite de ${MAX_MESSAGE_LENGTH} caracteres.`,
      );
    }

    const isBlocked = containsBlockedContent(dto.content);

    const message = this.messageRepo.create({
      roomId: dto.roomId,
      senderId,
      content: isBlocked ? '🚫 [Mensagem bloqueada — contacto externo]' : dto.content,
      type: dto.type ?? MessageType.TEXT,
      isBlocked,
      blockedReason: isBlocked ? 'Partilha de contacto externo não permitida.' : undefined,
    });

    const saved = await this.messageRepo.save(message);

    // Incrementa unread do destinatário
    if (room.providerId === senderId) {
      await this.roomRepo.update(dto.roomId, {
        lastMessage: isBlocked ? '🚫 Mensagem bloqueada' : dto.content.slice(0, 100),
        lastMessageAt: new Date(),
        clientUnread: () => '"clientUnread" + 1',
      });
    } else {
      await this.roomRepo.update(dto.roomId, {
        lastMessage: isBlocked ? '🚫 Mensagem bloqueada' : dto.content.slice(0, 100),
        lastMessageAt: new Date(),
        providerUnread: () => '"providerUnread" + 1',
      });
    }

    // SECURITY FIX: mesma correcção — select explícito em vez de
    // relations:{sender:true} cru. Este é o objecto devolvido tanto
    // pelo POST /chat/messages como pelo evento WebSocket send_message
    // (ChatGateway.handleMessage emite exactamente o que este método
    // devolve para toda a sala) — por isso era também o vector do leak
    // em tempo real via WebSocket, não só via REST.
    return this.messageRepo.findOne({
      where: { id: saved.id },
      relations: { sender: true },
      select: {
        id: true,
        roomId: true,
        senderId: true,
        content: true,
        type: true,
        isRead: true,
        isBlocked: true,
        blockedReason: true,
        createdAt: true,
        sender: SAFE_USER_SELECT,
      },
    }) as Promise<ChatMessage>;
  }

  async markAsRead(roomId: string, userId: string): Promise<void> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) return;

    // SECURITY FIX (M-1): antes, o update marcava TODAS as mensagens da
    // sala como lidas (independentemente do senderId), o que significa
    // que quando o cliente chamava markAsRead tambem marcava as mensagens
    // do prestador como lidas e vice-versa — um utilizador manipulava o
    // estado de leitura do outro participante.
    //
    // Correccao: marca como lidas apenas as mensagens enviadas pelo OUTRO
    // participante (senderId do outro lado). As proprias mensagens do
    // utilizador nao precisam de ser marcadas como lidas — ele enviou-as.
    if (room.clientId === userId) {
      await this.roomRepo.update(roomId, { clientUnread: 0 });
      await this.messageRepo.update(
        { roomId, isRead: false, senderId: room.providerId },
        { isRead: true },
      );
    } else if (room.providerId === userId) {
      await this.roomRepo.update(roomId, { providerUnread: 0 });
      await this.messageRepo.update(
        { roomId, isRead: false, senderId: room.clientId },
        { isRead: true },
      );
    }
  }

  async getTotalUnread(userId: string): Promise<number> {
    const asClient = await this.roomRepo
      .createQueryBuilder('room')
      .where('room.clientId = :userId', { userId })
      .select('COALESCE(SUM(room.clientUnread), 0)', 'total')
      .getRawOne();

    const asProvider = await this.roomRepo
      .createQueryBuilder('room')
      .where('room.providerId = :userId', { userId })
      .select('COALESCE(SUM(room.providerUnread), 0)', 'total')
      .getRawOne();

    return Number(asClient?.total ?? 0) + Number(asProvider?.total ?? 0);
  }

  // NOVO — usado exclusivamente pelo ChatGateway.handleJoinRoom, ANTES
  // de client.join(`room:${roomId}`). Reutiliza a mesma verificação de
  // ownership já aplicada em getMessages()/saveMessage()
  // (room.clientId !== userId && room.providerId !== userId), para que
  // um socket só possa subscrever eventos em tempo real (new_message,
  // typing) de salas onde é realmente participante — o mesmo padrão já
  // usado em ActiveServiceLocationService.assertParticipant() para as
  // salas de localização de serviço.
  async assertParticipant(roomId: string, userId: string): Promise<ChatRoom> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Conversa não encontrada.');
    if (room.clientId !== userId && room.providerId !== userId) {
      throw new ForbiddenException('Sem acesso a esta conversa.');
    }
    return room;
  }
}
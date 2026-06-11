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
    let room = await this.roomRepo.findOne({
      where: [
        { clientId: currentUserId, providerId: participantId },
        { clientId: participantId, providerId: currentUserId },
      ],
      relations: { client: true, provider: true },
    });

    let isNew = false;

    if (!room) {
      room = this.roomRepo.create({
        clientId: currentUserId,
        providerId: participantId,
        serviceId: dto.serviceId ?? null,
      });
      room = await this.roomRepo.save(room);
      room = await this.roomRepo.findOne({
        where: { id: room.id },
        relations: { client: true, provider: true },
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
    return this.roomRepo
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.client', 'client')
      .leftJoinAndSelect('room.provider', 'provider')
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

    const [messages, total] = await this.messageRepo.findAndCount({
      where: { roomId },
      relations: { sender: true },
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

    return this.messageRepo.findOne({
      where: { id: saved.id },
      relations: { sender: true },
    }) as Promise<ChatMessage>;
  }

  async markAsRead(roomId: string, userId: string): Promise<void> {
    const room = await this.roomRepo.findOne({ where: { id: roomId } });
    if (!room) return;
    if (room.clientId === userId) {
      await this.roomRepo.update(roomId, { clientUnread: 0 });
    } else if (room.providerId === userId) {
      await this.roomRepo.update(roomId, { providerUnread: 0 });
    }
    await this.messageRepo.update({ roomId, isRead: false }, { isRead: true });
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
}
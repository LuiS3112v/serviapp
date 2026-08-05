import { IsString, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';
import { MessageType } from '../../../database/entities/chat-message.entity';

export class SendMessageDto {
  @IsString()
  roomId: string;

  // SECURITY FIX: sem limites, `content` aceitava qualquer string —
  // desde vazia até dezenas de milhares de caracteres — só validada
  // como "é uma string". O ChatService já corta em MAX_MESSAGE_LENGTH
  // (4000) como defesa em profundidade, mas isso só acontece depois de
  // o request já ter passado a validação de entrada, ter sido
  // desserializado e ter chegado ao service. Com @MaxLength aqui, o
  // ValidationPipe global (whitelist:true, transform:true, já
  // configurado em main.ts) rejeita o pedido com 400 antes de tocar em
  // qualquer lógica de negócio ou fazer qualquer query — mais barato e
  // mais cedo. @MinLength(1) impede o caso separado de mensagens vazias
  // (content: "") que passavam a validação anterior e criavam ruído
  // sem sentido na conversa.
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;
}
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { MessageType } from '../../../database/entities/chat-message.entity';

export class SendMessageDto {
  @IsString()
  roomId: string;

  @IsString()
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;
}
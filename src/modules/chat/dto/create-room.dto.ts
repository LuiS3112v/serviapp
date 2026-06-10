import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoomDto {
  // Aceita participantId (novo) ou providerId (retrocompatível)
  @IsUUID()
  @IsOptional()
  participantId?: string;

  @IsUUID()
  @IsOptional()
  providerId?: string;

  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  initialMessage?: string;
}
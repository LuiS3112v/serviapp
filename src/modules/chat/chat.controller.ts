import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  createOrGetRoom(
    @CurrentUser() user: any,
    @Body() dto: CreateRoomDto,
  ) {
    return this.chatService.getOrCreateRoom(user.id, dto);
  }

  @Get('rooms')
  getRooms(@CurrentUser() user: any) {
    return this.chatService.getRooms(user.id);
  }

  @Get('rooms/:roomId/messages')
  getMessages(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.chatService.getMessages(roomId, user.id, Number(page), Number(limit));
  }

  @Post('messages')
  sendMessage(
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.saveMessage(user.id, dto);
  }

  @Get('unread')
  getUnread(@CurrentUser() user: any) {
    return this.chatService.getTotalUnread(user.id).then(count => ({ count }));
  }
}
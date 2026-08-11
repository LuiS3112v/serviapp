import {
  Controller, Get, Patch, Post, Body, Query, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  getMe(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @UseGuards(JwtGuard)
  updateMe(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateById(user.id, dto);
  }

  // Causa do "Cannot POST /api/users/me/avatar": esta rota não existia.
  // Endpoint multipart próprio, separado do PATCH /users/me (JSON),
  // seguindo o mesmo padrão de POST /company/:companyId/logo. O campo
  // do FormData tem de se chamar "avatar" — é o nome passado a
  // FileInterceptor.
  //
  // SECURITY FIX: adicionado limits.fileSize, mesmo padrão já usado em
  // KycController e PaymentProofController. Antes, a única validação de
  // tamanho acontecia dentro de CloudinaryService.uploadBuffer
  // (max_bytes) — o que significa que o ficheiro inteiro já tinha sido
  // recebido e mantido em memória (buffer) pelo processo Node antes de
  // qualquer rejeição. Um upload de várias centenas de MB já consumia
  // memória do servidor antes do Cloudinary sequer ser chamado. Com o
  // limite no próprio FileInterceptor, o multer rejeita a stream assim
  // que o limite é excedido, sem materializar o ficheiro completo em
  // memória.
  @Post('me/avatar')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadAvatar(user.id, file);
  }

  @Get('category-counts')
  getCategoryCounts() {
    return this.usersService.getCategoryCounts();
  }

  @Get('providers')
  getProviders(@Query('category') category?: string) {
    return this.usersService.findProviders(category);
  }

  @Get('search')
  @UseGuards(JwtGuard)
  searchUsers(@Query('q') q: string) {
    return this.usersService.searchUsers(q ?? '');
  }
}
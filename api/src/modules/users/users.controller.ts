import {
  Controller, Get, Patch, Post, Body, Query, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
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
  // SECURITY FIX (H-1): adicionado fileFilter ao FileInterceptor.
  // Sem este filtro, qualquer tipo de ficheiro era aceite em memória
  // antes de o Cloudinary o rejeitar com allowed_formats. Um SVG com
  // <script> ou um HTML malicioso chegava ao buffer do processo Node
  // antes de qualquer rejeição. O fileFilter rejeita a stream no início.
  @Post('me/avatar')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Tipo de ficheiro não permitido. Usa JPEG, PNG ou WebP.'), false);
      }
    },
  }))
  uploadAvatar(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.uploadAvatar(user.id, file);
  }

  @Get('category-counts')
  @UseGuards(JwtGuard)
  getCategoryCounts() {
    return this.usersService.getCategoryCounts();
  }

  @Get('providers')
  @UseGuards(JwtGuard)
  getProviders(@Query('category') category?: string) {
    return this.usersService.findProviders(category);
  }

  @Get('search')
  @UseGuards(JwtGuard)
  searchUsers(@Query('q') q: string) {
    return this.usersService.searchUsers(q ?? '');
  }
}
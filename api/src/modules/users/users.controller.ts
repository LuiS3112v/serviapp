import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
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

  @Get('category-counts')
  getCategoryCounts() {
    return this.usersService.getCategoryCounts();
  }

  @Get('providers')
  getProviders(@Query('category') category?: string) {
    return this.usersService.findProviders(category);
  }

  // ── Pesquisa de utilizadores para o modal de convite de empresa ──────────
  // GET /users/search?q=nome_ou_email_ou_telefone
  // Requer autenticação — só providers/company owners devem convidar
  @Get('search')
  @UseGuards(JwtGuard)
  searchUsers(@Query('q') q: string) {
    return this.usersService.searchUsers(q ?? '');
  }
}
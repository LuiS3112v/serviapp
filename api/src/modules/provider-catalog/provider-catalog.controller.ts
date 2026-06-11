import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProviderCatalogService } from './provider-catalog.service';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('catalog')
@UseGuards(JwtGuard, RolesGuard)
export class ProviderCatalogController {
  constructor(private readonly catalogService: ProviderCatalogService) {}

  @Post()
  @Roles(Role.PROVIDER, Role.COMPANY)
  create(@CurrentUser() user: any, @Body() dto: CreateCatalogDto) {
    return this.catalogService.create(user.id, dto);
  }

  @Get('my')
  @Roles(Role.PROVIDER, Role.COMPANY)
  findMine(@CurrentUser() user: any) {
    return this.catalogService.findByProvider(user.id);
  }

  @Get()
  @Roles(Role.CLIENT, Role.PROVIDER, Role.COMPANY, Role.ADMIN)
  findAll(@Query('category') category?: string) {
    return this.catalogService.findAll(category);
  }

  @Get(':id')
  @Roles(Role.CLIENT, Role.PROVIDER, Role.COMPANY, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.PROVIDER, Role.COMPANY)
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: UpdateCatalogDto) {
    return this.catalogService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Roles(Role.PROVIDER, Role.COMPANY)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.catalogService.remove(id, user.id);
  }
}
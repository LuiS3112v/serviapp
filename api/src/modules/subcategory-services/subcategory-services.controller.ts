import {
  Controller, Get, Post, Patch, Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { SubcategoryServicesService } from './subcategory-services.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSubcategoryServiceDto } from './dto/create-subcategory-service.dto';
import { ProposePriceDto } from './dto/propose-price.dto';

@Controller('subcategory-services')
@UseGuards(JwtGuard)
export class SubcategoryServicesController {
  constructor(
    private readonly subService: SubcategoryServicesService,
  ) {}

  // Cliente cria pedido rápido
  @Post()
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateSubcategoryServiceDto,
  ) {
    return this.subService.create(user.id, dto);
  }


  // Rotas estáticas primeiro
  @Get('my')
  myServices(
    @CurrentUser() user: any,
  ) {
    return this.subService.findByClient(user.id);
  }


  // Mercado do prestador
  // FIX:
  // Antes dependia de user.category que não vinha no JWT.
  // Agora o service procura as categorias no ProviderCatalog.
  @Get('available')
  availableForProvider(
    @CurrentUser() user: any,
  ) {
    return this.subService.findAvailableForProvider(
      user.id,
    );
  }


  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.subService.findById(id);
  }


  // Prestador envia proposta
  @Post(':id/propose')
  proposePrice(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: ProposePriceDto,
  ) {
    return this.subService.proposePrice(
      id,
      user.id,
      dto.proposedPrice,
    );
  }


  // Prestador dispensa pedido
  @Patch(':id/dismiss')
  dismiss(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.subService.dismissForProvider(
      id,
      user.id,
    );
  }


  // Cliente aceita proposta
  @Patch(':id/proposals/:proposalId/accept')
  acceptProposal(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @CurrentUser() user: any,
  ) {
    return this.subService.acceptProposal(
      id,
      user.id,
      proposalId,
    );
  }


  // Cliente cancela
  @Patch(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.subService.rejectAndCancel(
      id,
      user.id,
    );
  }
}
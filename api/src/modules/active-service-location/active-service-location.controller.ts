import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ActiveServiceLocationService } from './active-service-location.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ServiceLocationSnapshot } from './dto/service-location.dto';

@Controller('active-service-location')
@UseGuards(JwtGuard)
export class ActiveServiceLocationController {
  constructor(private readonly locationService: ActiveServiceLocationService) {}

  // Chamado pelo map/page.tsx do cliente ao carregar a página, para
  // descobrir automaticamente se deve abrir em Modo Serviço Ativo em
  // vez de Modo Descoberta. Devolve null se não houver nenhum serviço
  // em curso, o que mantém o mapa em Modo Descoberta normalmente.
  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  async getMyActiveService(@CurrentUser() user: { id: string }) {
    const service = await this.locationService.findActiveServiceForClient(user.id);

    if (!service) {
      return null;
    }

    return {
      serviceId: service.id,
      status: service.status,
      title: service.title,
      providerId: service.providerId,
      providerName: service.provider?.fullName ?? null,
      providerAvatarUrl: service.provider?.avatarUrl ?? null,
    };
  }

  @Get(':serviceId/snapshot')
  async getSnapshot(
    @Param('serviceId') serviceId: string,
    @CurrentUser() user: { id: string; role: string },
  ): Promise<ServiceLocationSnapshot | null> {
    await this.locationService.assertParticipant(serviceId, user.id, user.role);
    return this.locationService.getSnapshot(serviceId);
  }
}
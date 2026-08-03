import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
  UseInterceptors, UploadedFile, ParseUUIDPipe, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProviderProfileService } from './provider-profile.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePricedServiceDto } from './dto/create-priced-service.dto';
import { UpdatePricedServiceDto } from './dto/update-priced-service.dto';
import { UpdateBioDto } from './dto/update-bio.dto';

@Controller('provider-profile')
export class ProviderProfileController {
  constructor(private readonly providerProfileService: ProviderProfileService) {}

  // ── Público — sem JwtGuard, mesma disciplina de exposição que
  //    Company.findByIdPublic já usa. Não devolve email/phone/localização.
  @Get(':providerId/public')
  getPublicProfile(@Param('providerId', ParseUUIDPipe) providerId: string) {
    return this.providerProfileService.getPublicProfile(providerId);
  }

  @Get(':providerId/gallery/more')
  getMoreGallery(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Query('offset', ParseIntPipe) offset: number,
  ) {
    return this.providerProfileService.getMoreGallery(providerId, offset);
  }

  // ── Privado — só o próprio prestador ────────────────────────────────
  @Patch('me/bio')
  @UseGuards(JwtGuard)
  updateBio(@CurrentUser() user: any, @Body() dto: UpdateBioDto) {
    return this.providerProfileService.updateBio(user.id, dto);
  }

  @Get('me/gallery')
  @UseGuards(JwtGuard)
  getMyGallery(@CurrentUser() user: any) {
    return this.providerProfileService.getMyGallery(user.id);
  }

  @Post('me/gallery')
  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('image'))
  addGalleryImage(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption?: string,
  ) {
    return this.providerProfileService.addGalleryImage(user.id, file, caption);
  }

  @Delete('me/gallery/:imageId')
  @UseGuards(JwtGuard)
  removeGalleryImage(@CurrentUser() user: any, @Param('imageId', ParseUUIDPipe) imageId: string) {
    return this.providerProfileService.removeGalleryImage(user.id, imageId);
  }

  @Get('me/services')
  @UseGuards(JwtGuard)
  getMyPricedServices(@CurrentUser() user: any) {
    return this.providerProfileService.getMyPricedServices(user.id);
  }

  @Post('me/services')
  @UseGuards(JwtGuard)
  addPricedService(@CurrentUser() user: any, @Body() dto: CreatePricedServiceDto) {
    return this.providerProfileService.addPricedService(user.id, dto);
  }

  @Patch('me/services/:serviceId')
  @UseGuards(JwtGuard)
  updatePricedService(
    @CurrentUser() user: any,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: UpdatePricedServiceDto,
  ) {
    return this.providerProfileService.updatePricedService(user.id, serviceId, dto);
  }

  @Delete('me/services/:serviceId')
  @UseGuards(JwtGuard)
  removePricedService(@CurrentUser() user: any, @Param('serviceId', ParseUUIDPipe) serviceId: string) {
    return this.providerProfileService.removePricedService(user.id, serviceId);
  }
}
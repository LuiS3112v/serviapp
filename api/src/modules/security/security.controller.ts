import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { SecurityService } from './security.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { parseUserAgent, extractClientIp } from '../../common/utils/parse-user-agent';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Enable2faDto } from './dto/enable-2fa.dto';
import { Disable2faDto } from './dto/disable-2fa.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Controller('users/me')
@UseGuards(JwtGuard)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Patch('password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    const context = this.buildContext(req);
    await this.securityService.changePassword(
      user.id, dto.currentPassword, dto.newPassword, user.sessionId, context,
    );
    return { success: true };
  }

  @Get('sessions')
  async getSessions(@CurrentUser() user: any) {
    return this.securityService.getSessions(user.id, user.sessionId);
  }

  @Delete('sessions/:id')
  async revokeSession(@CurrentUser() user: any, @Param('id') sessionId: string, @Req() req: Request) {
    const context = this.buildContext(req);
    await this.securityService.revokeSession(user.id, sessionId, context);
    return { success: true };
  }

  @Delete('sessions')
  async revokeAllOtherSessions(@CurrentUser() user: any, @Req() req: Request) {
    const context = this.buildContext(req);
    await this.securityService.revokeAllOtherSessions(user.id, user.sessionId, context);
    return { success: true };
  }

  @Get('2fa/setup')
  async setupTwoFactor(@CurrentUser() user: any) {
    return this.securityService.setupTwoFactor(user.id, user.email);
  }

  @Post('2fa/enable')
  async enableTwoFactor(@CurrentUser() user: any, @Body() dto: Enable2faDto, @Req() req: Request) {
    const context = this.buildContext(req);
    await this.securityService.enableTwoFactor(user.id, dto.code, context);
    return { success: true };
  }

  @Post('2fa/disable')
  async disableTwoFactor(@CurrentUser() user: any, @Body() dto: Disable2faDto, @Req() req: Request) {
    const context = this.buildContext(req);
    await this.securityService.disableTwoFactor(user.id, dto.password, context);
    return { success: true };
  }

  @Get('2fa/status')
  async getTwoFactorStatus(@CurrentUser() user: any) {
    return this.securityService.getTwoFactorStatus(user.id);
  }

  @Get('security-history')
  async getSecurityHistory(@CurrentUser() user: any) {
    return this.securityService.getSecurityHistory(user.id);
  }

  @Delete()
  async deleteAccount(@CurrentUser() user: any, @Body() dto: DeleteAccountDto, @Req() req: Request) {
    const context = this.buildContext(req);
    await this.securityService.deleteAccount(user.id, dto.password, context);
    return { success: true };
  }

  private buildContext(req: Request) {
    const { device, browser } = parseUserAgent(req.headers['user-agent']);
    return { device, browser, ip: extractClientIp(req) };
  }
}
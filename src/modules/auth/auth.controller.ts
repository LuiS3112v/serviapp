import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';

/**
 * Place this file at: src/modules/auth/auth.controller.ts
 *
 * Key addition: GET /auth/me
 *
 * This endpoint is the solution to the "stale localStorage" problem.
 * The frontend calls it on every app load to get the current, DB-accurate role.
 *
 * Because JwtGuard runs JwtStrategy.validate() before this handler,
 * req.user is already populated with fresh DB data — including the super-admin
 * role override. No extra DB call is needed in this controller.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Returns the current authenticated user with data fresh from DB.
   *
   * The frontend must call this on every app load (in useAuth) to detect:
   *   - Role changes since the JWT was issued
   *   - Super-admin status (env-based, not in token)
   *   - Revoked/deleted accounts (returns 401 → forces logout)
   *
   * Response shape matches AuthUser on the frontend (no password field).
   * isSuperAdmin is included so the frontend can store accurate state.
   */
  @Get('me')
  @UseGuards(JwtGuard)
  me(@Request() req: { user: Record<string, unknown> }) {
    // req.user is set by JwtStrategy.validate() — it already queried the DB.
    // No additional DB call needed. Role here is always authoritative.
    return req.user;
  }
}
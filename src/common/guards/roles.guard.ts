import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — always runs AFTER JwtGuard.
 *
 * JwtGuard populates req.user via JwtStrategy.validate(), which:
 *   1. Re-fetches the user from DB on every request (role is always fresh)
 *   2. Sets isSuperAdmin based on SUPER_ADMIN_EMAILS env var
 *   3. Overrides role to Role.ADMIN if user is a super-admin
 *
 * So by the time this guard runs, req.user.role is the DB truth,
 * never the potentially stale JWT payload value.
 *
 * Place this file at: src/common/guards/roles.guard.ts
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → open to all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    // JwtGuard should have already rejected unauthenticated requests.
    // This is a safety net for misconfigured routes.
    if (!user) throw new ForbiddenException('Acesso negado.');

    // Super admin always bypasses role restrictions — the env var is the source of truth,
    // not the token. isSuperAdmin is set by JwtStrategy after DB lookup, not from the token.
    if (user.isSuperAdmin === true) return true;

    // Standard check: DB role must match one of the required roles
    return requiredRoles.includes(user.role as Role);
  }
}
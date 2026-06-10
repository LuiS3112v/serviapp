import { ConfigService } from '@nestjs/config';

/**
 * Super-admin configuration — env-driven, never hard-coded.
 *
 * Set in your .env:
 *   SUPER_ADMIN_EMAILS=owner@example.com,backup@example.com
 *
 * Super admins:
 *  - Always receive role: Role.ADMIN from JwtStrategy, regardless of DB value
 *  - Always bypass RolesGuard, regardless of which roles are required
 *  - Cannot be locked out by accidental DB role changes
 *
 * Place this file at: src/common/super-admin.config.ts
 */

export function getSuperAdminEmails(configService: ConfigService): string[] {
  const raw = configService.get<string>('SUPER_ADMIN_EMAILS', '');
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperAdminEmail(
  email: string,
  configService: ConfigService,
): boolean {
  if (!email) return false;
  const list = getSuperAdminEmails(configService);
  return list.includes(email.trim().toLowerCase());
}
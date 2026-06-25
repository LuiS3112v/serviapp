import { SetMetadata } from '@nestjs/common';
import { CompanyEmployeeRole } from '../../common/enums/company-employee-role.enum';

export const COMPANY_ROLES_KEY = 'companyRoles';

// Uso: @RequireCompanyRole(CompanyEmployeeRole.OWNER, CompanyEmployeeRole.ADMIN)
export const RequireCompanyRole = (...roles: CompanyEmployeeRole[]) =>
  SetMetadata(COMPANY_ROLES_KEY, roles);
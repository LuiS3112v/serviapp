import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEmployee } from '../../database/entities/company-employee.entity';
import { Company } from '../../database/entities/company.entity';
import { COMPANY_ROLES_KEY } from '../decorators/require-company-role.decorator';
import { CompanyEmployeeRole } from '../../common/enums/company-employee-role.enum';

// ════════════════════════════════════════════════════════════════════════
// CompanyRolesGuard
//
// Resolve a empresa a partir de:
//   1. req.params.companyId (rotas tipo /company/:companyId/...)
//   2. OU encontra a empresa onde req.user.id é owner (rotas tipo /company/me/...)
//
// Depois verifica se o user é:
//   - o OWNER da empresa (sempre passa, owner tem todas as permissões)
//   - OU um CompanyEmployee com um dos roles exigidos por @RequireCompanyRole(...)
//
// Se a rota não tiver @RequireCompanyRole(...), o guard só garante que o
// user pertence à empresa (owner ou employee), sem exigir role específico.
// ════════════════════════════════════════════════════════════════════════
@Injectable()
export class CompanyRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Company)
    private companyRepo: Repository<Company>,
    @InjectRepository(CompanyEmployee)
    private employeeRepo: Repository<CompanyEmployee>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<CompanyEmployeeRole[]>(
      COMPANY_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const userId: string = request.user?.id;
    if (!userId) throw new ForbiddenException('Não autenticado.');

    // Resolve a empresa: por param explícito ou pela empresa do próprio user
    const companyIdParam = request.params?.companyId;

    let company: Company | null;
    if (companyIdParam) {
      company = await this.companyRepo.findOne({ where: { id: companyIdParam } });
    } else {
      company = await this.companyRepo.findOne({ where: { ownerId: userId } });
    }

    if (!company) throw new NotFoundException('Empresa não encontrada.');

    // Anexa a empresa resolvida ao request para os controllers/services reutilizarem
    request.company = company;

    // Owner tem sempre acesso total
    if (company.ownerId === userId) return true;

    // Caso contrário, tem de ser um employee com role suficiente
    const employee = await this.employeeRepo.findOne({
      where: { companyId: company.id, userId },
    });

    if (!employee) {
      throw new ForbiddenException('Não pertences a esta empresa.');
    }

    // Sem roles específicos exigidos → basta pertencer à empresa
    if (!requiredRoles || requiredRoles.length === 0) return true;

    if (!requiredRoles.includes(employee.role)) {
      throw new ForbiddenException('Sem permissão suficiente nesta empresa.');
    }

    return true;
  }
}
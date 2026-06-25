import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import { CompanyEmployeeRole } from '../../../common/enums/company-employee-role.enum';

export class CreateInvitationDto {
  @IsUUID()
  inviteeUserId: string;

  @IsEnum(CompanyEmployeeRole)
  proposedRole: CompanyEmployeeRole;

  @IsString()
  @IsOptional()
  proposedDepartment?: string;
}
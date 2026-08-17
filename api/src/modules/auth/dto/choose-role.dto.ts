import { IsIn } from 'class-validator';

// Propositadamente restrito a 'client' | 'provider' — nunca aceita
// 'admin', 'company' ou 'pending' aqui. Escolher tornar-se admin não
// pode ser uma opção self-service, e 'company' segue o fluxo próprio
// já existente fora deste endpoint.
export class ChooseRoleDto {
  @IsIn(['client', 'provider'])
  role: 'client' | 'provider';
}
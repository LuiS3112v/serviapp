export enum Role {
  CLIENT = 'client',
  PROVIDER = 'provider',
  COMPANY = 'company',
  ADMIN = 'admin',
  // NOVO — conta criada via Google que ainda não escolheu entre
  // Cliente/Prestador. Nunca é atribuído por defeito a registos
  // tradicionais: REGISTERABLE_ROLES (auth.service.ts) não a inclui,
  // por isso um valor 'pending' vindo de fora do fluxo Google cai
  // sempre no fallback existente (Role.CLIENT), sem qualquer alteração
  // ao register() tradicional.
  PENDING = 'pending',
}
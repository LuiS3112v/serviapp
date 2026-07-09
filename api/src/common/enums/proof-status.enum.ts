export enum ProofStatus {
  ACTIVE    = 'active',    // comprovativo actual, ainda não confirmado
  REPLACED  = 'replaced',  // substituído pelo cliente antes da confirmação
  CONFIRMED = 'confirmed', // admin confirmou este — fica bloqueado, histórico final
}
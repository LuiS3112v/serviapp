export enum PaymentStatus {
  PENDING          = 'pending',           // aguarda transferência do cliente
  PROOF_SUBMITTED  = 'proof_submitted',   // comprovativo enviado, aguarda admin
  CONFIRMED        = 'confirmed',         // admin confirmou — pagamento protegido
  PENDING_PAYOUT   = 'pending_payout',    // serviço concluído, aguarda transferência ao prestador
  COMPLETED        = 'completed',         // admin marcou "transferência realizada"

  // Mantidos por compatibilidade — HELD/RELEASED deixam de ser usados no
  // fluxo automático de wallet, mas o enum não é reduzido para não
  // partir dados históricos já gravados com estes valores.
  HELD             = 'held',
  RELEASED         = 'released',
  REFUNDED         = 'refunded',
  FAILED           = 'failed',
}
export enum ServiceStatus {
  // ── Fase 1: Pedido ────────────────────────────────────────
  REQUESTED           = 'requested',          // cliente pediu, a aguardar resposta do prestador
  REJECTED            = 'rejected',           // prestador recusou o pedido

  // ── Fase 2: Aceitação ─────────────────────────────────────
  ACCEPTED             = 'accepted',           // prestador aceitou, a aguardar pagamento

  // ── Fase 3: Pagamento ─────────────────────────────────────
  PAYMENT_PENDING      = 'payment_pending',    // a aguardar o cliente pagar
  PAYMENT_HELD         = 'payment_held',       // pagamento retido em escrow

  // ── Fase 4: Execução ──────────────────────────────────────
  IN_PROGRESS          = 'in_progress',        // PIN validado, serviço a decorrer

  // ── Fase 5: Conclusão ─────────────────────────────────────
  PROVIDER_COMPLETED   = 'provider_completed', // prestador marcou como feito
  CLIENT_CONFIRMED     = 'client_confirmed',   // cliente confirmou conclusão

  // ── Fase 6: Finalizado ────────────────────────────────────
  COMPLETED            = 'completed',          // pagamento libertado ao prestador

  // ── Casos especiais ───────────────────────────────────────
  DISPUTED             = 'disputed',           // uma das partes abriu disputa
  CANCELLED            = 'cancelled',          // cancelado antes de concluir
  REFUNDED             = 'refunded',           // valor devolvido ao cliente
}
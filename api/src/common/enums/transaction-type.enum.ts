export enum TransactionType {
  DEPOSIT       = 'deposit',        // cliente carregou wallet
  WITHDRAWAL    = 'withdrawal',     // prestador levantou
  PAYMENT       = 'payment',        // cliente pagou serviço → escrow
  ESCROW_HOLD   = 'escrow_hold',    // dinheiro retido
  ESCROW_RELEASE= 'escrow_release', // dinheiro libertado ao prestador
  ESCROW_REFUND = 'escrow_refund',  // dinheiro devolvido ao cliente
  PLATFORM_FEE  = 'platform_fee',   // comissão da plataforma
}
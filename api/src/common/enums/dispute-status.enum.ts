export enum DisputeStatus {
  OPEN             = 'open',
  UNDER_REVIEW     = 'under_review',
  RESOLVED_CLIENT  = 'resolved_client',   // admin decidiu a favor do cliente
  RESOLVED_PROVIDER= 'resolved_provider', // admin decidiu a favor do prestador
  CANCELLED        = 'cancelled',
}
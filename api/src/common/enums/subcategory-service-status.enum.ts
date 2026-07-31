export enum SubcategoryServiceStatus {
  // Fase 1: broadcast, sem proposta ainda
  BROADCASTING     = 'broadcasting',

  // Fase 2: pelo menos um prestador propôs valor, cliente a decidir
  CLIENT_REVIEWING = 'client_reviewing',

  // Fase 3: cliente aceitou — este SubcategoryService converteu-se num
  // Service real (srv_), e não sofre mais transições de estado próprias.
  // A partir daqui o Service assume o controlo total.
  CONVERTED        = 'converted',

  // Casos especiais
  CANCELLED        = 'cancelled', // cliente recusou a proposta, ou nenhum prestador respondeu
}
import { MapCoordinates } from '../map/map-provider.types';

export interface RouteResult {
  coordinates: MapCoordinates[];
  distanceKm: number;
  durationMinutes: number;
  isEstimate: boolean;
}

// Contrato que qualquer motor de rotas tem de cumprir. A implementação
// atual usa o OSRM público de demonstração, com fallback automático
// para uma estimativa em linha reta caso o serviço externo falhe. Uma
// futura migração (OSRM próprio, Mapbox Directions ou outro
// fornecedor) implica apenas escrever um novo módulo que respeite esta
// mesma assinatura.
//
// O parâmetro `signal` é opcional para manter compatibilidade com
// qualquer chamador existente. Quando fornecido, o provider deve
// respeitá-lo: se o signal for abortado antes de a rota real ser
// obtida, o provider deve rejeitar a promise (não fazer fallback),
// para que o chamador possa distinguir "cancelado porque ficou
// obsoleto" de "falhou de verdade e precisa de fallback".
export interface RoutingProvider {
  getRoute(
    origin: MapCoordinates,
    destination: MapCoordinates,
    signal?: AbortSignal,
  ): Promise<RouteResult>;
}
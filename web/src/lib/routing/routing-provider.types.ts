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
export interface RoutingProvider {
  getRoute(origin: MapCoordinates, destination: MapCoordinates): Promise<RouteResult>;
}
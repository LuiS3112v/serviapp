// src/lib/routing/haversine-fallback.ts
import { MapCoordinates } from '../map/map-provider.types';
import { RouteResult } from './routing-provider.types';

// Velocidade média assumida para estimar duração quando não há rota
// real disponível (falha do OSRM, timeout, ou resposta inválida).
// 25 km/h reflete trânsito urbano em Luanda de forma mais realista do
// que uma velocidade rodoviária aberta.
const ASSUMED_AVERAGE_SPEED_KMH = 25;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineDistanceKm(origin: MapCoordinates, destination: MapCoordinates): number {
  const earthRadiusKm = 6371;

  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLon = toRadians(destination.longitude - origin.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
    Math.cos(toRadians(destination.latitude)) *
    Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Usado quando o OSRM falha, dá timeout, ou devolve uma resposta sem
// rotas válidas. Traça uma linha reta entre origem e destino (não
// segue ruas) e estima a duração com base numa velocidade média fixa.
// O campo isEstimate:true sinaliza ao ServiceMap para desenhar esta
// rota com estilo tracejado, distinguindo-a visualmente de uma rota
// real do OSRM.
export function buildHaversineEstimate(
  origin: MapCoordinates,
  destination: MapCoordinates,
): RouteResult {
  const distanceKm = haversineDistanceKm(origin, destination);
  const durationMinutes = Math.round((distanceKm / ASSUMED_AVERAGE_SPEED_KMH) * 60);

  return {
    coordinates: [origin, destination],
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMinutes: Math.max(durationMinutes, 1),
    isEstimate: true,
  };
}
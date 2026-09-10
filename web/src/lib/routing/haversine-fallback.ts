import { MapCoordinates } from '../map/map-provider.types';
import { RouteResult } from './routing-provider.types';

// Factor de tortuosidade urbana para Luanda.
// A distância real pelas ruas é sempre maior que a linha reta —
// em cidades com grelha regular (Manhattan) o factor é ~1.27;
// em Luanda, com traçado irregular, becos e sentidos únicos,
// o factor empírico fica entre 1.35 e 1.50. Usamos 1.40 como
// média conservadora: subestima menos do que 1.0 (linha reta pura)
// e não exagera como 1.5 faria em percursos mais directos.
const URBAN_TORTUOSITY_FACTOR = 1.4;

// Velocidade média (km/h) por período do dia, calibrada para Luanda.
// Luanda tem um dos piores índices de trânsito de África (TomTom
// Traffic Index). Os valores abaixo reflectem:
//   • Hora de ponta manhã  (06:30–09:30): 12 km/h — congestionamento severo
//   • Meio do dia          (09:30–16:00): 22 km/h — trânsito moderado
//   • Hora de ponta tarde  (16:00–20:00): 10 km/h — pior período do dia
//   • Noite / madrugada    (20:00–06:30): 30 km/h — ruas vazias
// Estes valores produzem estimativas mais realistas do que um valor
// fixo único, mesmo sem dados de trânsito em tempo real.
function estimatedSpeedKmh(): number {
  // Hora local de Luanda (UTC+1)
  const nowUtc = new Date();
  const luandaHour = (nowUtc.getUTCHours() + 1) % 24;

  if (luandaHour >= 6.5 && luandaHour < 9.5)  return 12; // ponta manhã
  if (luandaHour >= 9.5 && luandaHour < 16)   return 22; // meio dia
  if (luandaHour >= 16  && luandaHour < 20)   return 10; // ponta tarde
  return 30;                                               // noite
}

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

// Fallback usado quando o Stadia/Valhalla falha, dá timeout, ou
// devolve resposta inválida. Em vez de linha reta pura a 25km/h fixo,
// aplica um factor de tortuosidade urbana à distância e calibra a
// velocidade ao período do dia — produz estimativas muito mais
// próximas da realidade em Luanda sem precisar de chamada de rede.
// isEstimate:true sinaliza ao ServiceMap para desenhar tracejado e
// mostrar o badge "Estimativa" — deixa claro ao utilizador que não é
// uma rota real pelas ruas.
export function buildHaversineEstimate(
  origin: MapCoordinates,
  destination: MapCoordinates,
): RouteResult {
  const straightLineKm = haversineDistanceKm(origin, destination);

  // Distância estimada pelas ruas (aplica tortuosidade urbana)
  const estimatedRoadKm = straightLineKm * URBAN_TORTUOSITY_FACTOR;

  // Duração estimada com velocidade calibrada por hora do dia
  const speedKmh = estimatedSpeedKmh();
  const durationMinutes = Math.round((estimatedRoadKm / speedKmh) * 60);

  return {
    coordinates: [origin, destination],
    distanceKm: Math.round(estimatedRoadKm * 10) / 10,
    durationMinutes: Math.max(durationMinutes, 1),
    isEstimate: true,
  };
}
import { MapCoordinates } from '../map/map-provider.types';
import { RouteResult, RoutingProvider } from './routing-provider.types';
import { buildHaversineEstimate } from './haversine-fallback';

// Instância pública de demonstração do OSRM. Adequada para validar o
// produto e testar a experiência completa, mas sem garantia de
// disponibilidade nem limite de uso definido para produção real. Antes
// de um lançamento com utilizadores reais, substituir esta URL por uma
// instância própria do OSRM ou outro fornecedor de rotas, mantendo a
// mesma assinatura de RoutingProvider — nenhum componente de mapa
// precisa de ser alterado nessa troca.
const OSRM_PUBLIC_ENDPOINT = 'https://router.project-osrm.org/route/v1/driving';
const REQUEST_TIMEOUT_MS = 6000;

interface OsrmResponse {
  code: string;
  routes: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
}

export class OsrmRoutingProvider implements RoutingProvider {
  async getRoute(origin: MapCoordinates, destination: MapCoordinates): Promise<RouteResult> {
    try {
      const coordinatesParam = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
      const url = `${OSRM_PUBLIC_ENDPOINT}/${coordinatesParam}?overview=full&geometries=geojson`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return buildHaversineEstimate(origin, destination);
      }

      const data: OsrmResponse = await response.json();

      if (data.code !== 'Ok' || data.routes.length === 0) {
        return buildHaversineEstimate(origin, destination);
      }

      const route = data.routes[0];

      return {
        coordinates: route.geometry.coordinates.map(([longitude, latitude]) => ({
          latitude,
          longitude,
        })),
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMinutes: Math.round(route.duration / 60),
        isEstimate: false,
      };
    } catch {
      return buildHaversineEstimate(origin, destination);
    }
  }
}

export const routingProvider: RoutingProvider = new OsrmRoutingProvider();
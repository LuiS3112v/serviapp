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

// Segunda linha de defesa: o principal ponto de validação é o
// ServiceMap (antes de sequer chamar o provider), mas este provider
// pode em teoria ser chamado a partir de outros pontos no futuro, por
// isso não confia cegamente nas coordenadas recebidas.
function isValidCoordinate(coordinates: MapCoordinates): boolean {
  const { latitude, longitude } = coordinates;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

// Log de diagnóstico apenas em desenvolvimento — evita poluir a
// consola em produção, mas dá visibilidade suficiente durante o
// desenvolvimento para distinguir a causa real de uma falha do OSRM.
function devWarn(message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[OsrmRoutingProvider] ${message}`);
  }
}

export class OsrmRoutingProvider implements RoutingProvider {
  async getRoute(
    origin: MapCoordinates,
    destination: MapCoordinates,
    externalSignal?: AbortSignal,
  ): Promise<RouteResult> {
    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      devWarn('invalid coordinates, request not sent');
      return buildHaversineEstimate(origin, destination);
    }

    if (externalSignal?.aborted) {
      // Já estava obsoleto antes de sequer começar — não faz sentido
      // gastar um request nem produzir uma estimativa; o chamador
      // simplesmente ignora este resultado.
      throw new DOMException('Routing request superseded before start', 'AbortError');
    }

    const controller = new AbortController();
    let abortReason: 'timeout' | 'superseded' | null = null;

    const timeoutId = setTimeout(() => {
      abortReason = 'timeout';
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    const onExternalAbort = () => {
      abortReason = 'superseded';
      controller.abort();
    };

    externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const coordinatesParam = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
      const url = `${OSRM_PUBLIC_ENDPOINT}/${coordinatesParam}?overview=full&geometries=geojson`;

      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        devWarn(`HTTP error ${response.status}`);
        return buildHaversineEstimate(origin, destination);
      }

      const data: OsrmResponse = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        devWarn(`invalid response (code=${data.code ?? 'unknown'})`);
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
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') {
        if (abortReason === 'superseded') {
          // Cancelado deliberadamente pelo chamador porque surgiu uma
          // posição mais recente — não é uma falha do OSRM, por isso
          // não há fallback nem log. O chamador descarta este
          // resultado.
          throw error;
        }
        devWarn(`request timeout after ${REQUEST_TIMEOUT_MS}ms`);
        return buildHaversineEstimate(origin, destination);
      }

      devWarn(`request failed: ${(error as Error)?.message ?? 'unknown error'}`);
      return buildHaversineEstimate(origin, destination);
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }
}

export const routingProvider: RoutingProvider = new OsrmRoutingProvider();
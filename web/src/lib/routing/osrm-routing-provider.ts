import { MapCoordinates } from '../map/map-provider.types';
import { RouteResult, RoutingProvider } from './routing-provider.types';
import { buildHaversineEstimate } from './haversine-fallback';

// Rotas via Stadia Maps (motor Valhalla), com format=osrm para devolver
// a mesma estrutura (routes[0].geometry.coordinates) que já usávamos
// com o OSRM público — só o endpoint, autenticação e método (POST)
// mudam. Substitui o router.project-osrm.org: essa era a instância
// pública de demonstração do OSRM, sem SLA nem garantia de
// disponibilidade em produção, e as suas falhas frequentes caíam no
// fallback Haversine (linha reta), o que explicava rotas "quadradas"
// no mapa em vez de seguirem ruas reais. O Stadia usa a mesma conta e
// API key já configuradas para os tiles do mapa (ver
// map-provider.config.ts), com plano gratuito permanente sem cartão.
const STADIA_ROUTE_ENDPOINT = 'https://api.stadiamaps.com/route/v1';
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
// desenvolvimento para distinguir a causa real de uma falha do
// routing.
function devWarn(message: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[StadiaRoutingProvider] ${message}`);
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

    const apiKey = process.env.NEXT_PUBLIC_STADIA_API_KEY;

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
      const url = `${STADIA_ROUTE_ENDPOINT}?api_key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          locations: [
            { lat: origin.latitude, lon: origin.longitude, type: 'break' },
            { lat: destination.latitude, lon: destination.longitude, type: 'break' },
          ],
          costing: 'auto',
          format: 'osrm',
        }),
      });

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
          // posição mais recente — não é uma falha do routing, por isso
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
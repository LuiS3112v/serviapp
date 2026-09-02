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

// 10 segundos — aumentado de 6s para cobrir a latência típica de redes
// móveis em Luanda (300–800ms de round-trip) mais o tempo de
// processamento do Valhalla para rotas urbanas densas. 6s era
// demasiado curto e causava timeouts frequentes que caíam silenciosamente
// no fallback Haversine (linha reta). 10s é o equilíbrio entre
// confiabilidade e não bloquear a UI durante demasiado tempo se a
// Stadia estiver mesmo indisponível.
const REQUEST_TIMEOUT_MS = 10_000;

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
// desenvolvimento para distinguir a causa real de uma falha do routing.
function devLog(message: string, data?: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    if (data !== undefined) {
      console.log(`[Routing] ${message}`, data);
    } else {
      console.log(`[Routing] ${message}`);
    }
  }
}

function devWarn(message: string, data?: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    if (data !== undefined) {
      console.warn(`[Routing] ${message}`, data);
    } else {
      console.warn(`[Routing] ${message}`);
    }
  }
}

export class OsrmRoutingProvider implements RoutingProvider {
  async getRoute(
    origin: MapCoordinates,
    destination: MapCoordinates,
    externalSignal?: AbortSignal,
  ): Promise<RouteResult> {
    devLog('origin:', origin);
    devLog('destination:', destination);

    if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
      devWarn('invalid coordinates — request not sent, using Haversine estimate');
      const result = buildHaversineEstimate(origin, destination);
      devLog('isEstimate:', result.isEstimate);
      return result;
    }

    if (externalSignal?.aborted) {
      // Já estava obsoleto antes de sequer começar — não faz sentido
      // gastar um request nem produzir uma estimativa; o chamador
      // simplesmente ignora este resultado.
      throw new DOMException('Routing request superseded before start', 'AbortError');
    }

    const apiKey = process.env.NEXT_PUBLIC_STADIA_API_KEY;

    // DIAGNÓSTICO CRÍTICO: se a API key não estiver definida, TODOS os
    // pedidos ao Stadia retornam 401 e caem silenciosamente no fallback
    // Haversine (linha reta). Este aviso torna isso imediatamente visível
    // nos DevTools durante o desenvolvimento.
    if (!apiKey || apiKey === 'undefined') {
      devWarn('NEXT_PUBLIC_STADIA_API_KEY não está definida — todos os pedidos de routing irão falhar com 401 e usar estimativa Haversine (linha reta). Define a variável em web/.env.local');
      const result = buildHaversineEstimate(origin, destination);
      devLog('isEstimate:', result.isEstimate);
      return result;
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
      const url = `${STADIA_ROUTE_ENDPOINT}?api_key=${apiKey}`;

      const requestBody = {
        locations: [
          { lat: origin.latitude, lon: origin.longitude, type: 'break' },
          { lat: destination.latitude, lon: destination.longitude, type: 'break' },
        ],
        costing: 'auto',
        format: 'osrm',
      };

      devLog('provider: Stadia Valhalla (POST /route/v1)');
      devLog('request body:', requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        devWarn(`HTTP ${response.status} — usando estimativa Haversine (linha reta)`);
        const result = buildHaversineEstimate(origin, destination);
        devLog('isEstimate:', result.isEstimate);
        return result;
      }

      const data: OsrmResponse = await response.json();

      devLog('Stadia response code:', data.code);
      devLog('routes count:', data.routes?.length ?? 0);

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        devWarn(`resposta inválida da Stadia (code=${data.code ?? 'unknown'}) — usando estimativa Haversine (linha reta)`);
        const result = buildHaversineEstimate(origin, destination);
        devLog('isEstimate:', result.isEstimate);
        return result;
      }

      const route = data.routes[0];

      // A Stadia/Valhalla com format=osrm devolve coordenadas como
      // [longitude, latitude] (convenção GeoJSON) — convertemos aqui
      // para { latitude, longitude } (convenção interna do projeto).
      // Esta conversão é o único ponto onde a ordem das coordenadas
      // muda; em todo o resto do código usamos sempre { latitude, longitude }.
      const coordinates = route.geometry.coordinates.map(([longitude, latitude]) => ({
        latitude,
        longitude,
      }));

      const result: RouteResult = {
        coordinates,
        distanceKm: Math.round((route.distance / 1000) * 10) / 10,
        durationMinutes: Math.round(route.duration / 60),
        isEstimate: false,
      };

      devLog('isEstimate:', result.isEstimate);
      devLog('distanceKm:', result.distanceKm);
      devLog('durationMinutes:', result.durationMinutes);
      devLog('geometry points:', coordinates.length);

      return result;
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') {
        if (abortReason === 'superseded') {
          // Cancelado deliberadamente pelo chamador porque surgiu uma
          // posição mais recente — não é uma falha do routing, por isso
          // não há fallback nem log. O chamador descarta este resultado.
          throw error;
        }
        devWarn(`timeout após ${REQUEST_TIMEOUT_MS}ms — usando estimativa Haversine (linha reta)`);
        const result = buildHaversineEstimate(origin, destination);
        devLog('isEstimate:', result.isEstimate);
        return result;
      }

      devWarn(`pedido falhou: ${(error as Error)?.message ?? 'erro desconhecido'} — usando estimativa Haversine (linha reta)`);
      const result = buildHaversineEstimate(origin, destination);
      devLog('isEstimate:', result.isEstimate);
      return result;
    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }
}

export const routingProvider: RoutingProvider = new OsrmRoutingProvider();
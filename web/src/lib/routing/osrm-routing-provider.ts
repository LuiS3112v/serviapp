import { MapCoordinates } from '../map/map-provider.types';
import { RouteResult, RoutingProvider } from './routing-provider.types';
import { buildHaversineEstimate } from './haversine-fallback';

// Motor de rotas: Stadia Maps (Valhalla), com format=osrm para manter
// compatibilidade com a estrutura de resposta já usada no projeto.
// Plano gratuito permanente, sem cartão, configurado com a mesma
// API key dos tiles (NEXT_PUBLIC_STADIA_API_KEY).
const STADIA_ROUTE_ENDPOINT = 'https://api.stadiamaps.com/route/v1';

// 12 segundos — cobre latência típica de redes móveis em Luanda
// (300–900ms RTT) mais o tempo de processamento do Valhalla para
// rotas urbanas densas com costing_options detalhado.
const REQUEST_TIMEOUT_MS = 12_000;

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

// Constrói o corpo do pedido ao Valhalla com costing_options calibrados
// para Luanda. O Valhalla usa estes parâmetros para ajustar:
//   • top_speed: velocidade máxima assumida nas vias (km/h)
//   • use_highways: penaliza autoestradas (0 = evita, 1 = prefere)
//   • use_tolls: penaliza portagens
//   • use_living_streets: permite ruas residenciais
//   • service_penalty: penalidade extra para vias de serviço
// O resultado é uma rota que espelha o comportamento típico de um
// condutor local em Luanda — evita autoestradas/rampas quando há
// alternativas locais mais directas, prefere ruas principais urbanas.
// A duração calculada pelo Valhalla já inclui factores de congestionamento
// do OSM (maxspeed tags, road class, surface) — é significativamente
// mais precisa do que qualquer estimativa de velocidade fixa.
function buildRequestBody(origin: MapCoordinates, destination: MapCoordinates): object {
  return {
    locations: [
      { lat: origin.latitude, lon: origin.longitude, type: 'break' },
      { lat: destination.latitude, lon: destination.longitude, type: 'break' },
    ],
    costing: 'auto',
    costing_options: {
      auto: {
        // Velocidade máxima urbana em Luanda — a maior parte das vias
        // principais tem limite de 60km/h; o Valhalla usa este valor
        // como teto para o cálculo de duração.
        top_speed: 60,
        // Penaliza ligeiramente autoestradas — em Luanda os acessos são
        // frequentemente mais lentos do que as alternativas urbanas.
        use_highways: 0.3,
        // Sem portagens em Luanda (valor 0 = evita completamente).
        use_tolls: 0,
        // Permite ruas residenciais — essencial para o último km em
        // bairros como Miramar, Maianga, Rangel.
        use_living_streets: 0.8,
        // Penalidade base para vias de serviço (pátios, entradas de
        // garagem, vias de acesso privado) — o Valhalla só as usa se
        // não houver alternativa razoável.
        service_penalty: 15,
      },
    },
    // Devolve geometria GeoJSON em vez de polyline encoded — mais fácil
    // de converter para coordenadas { latitude, longitude } sem depender
    // de uma biblioteca de descodificação.
    format: 'osrm',
    // Geometria completa (full) em vez de simplified — necessário para
    // que a polyline desenhada no mapa siga as ruas com precisão,
    // especialmente em troços curvos e rotundas.
    overview: 'full',
  };
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
      devWarn('coordenadas inválidas — usando estimativa Haversine');
      return buildHaversineEstimate(origin, destination);
    }

    if (externalSignal?.aborted) {
      throw new DOMException('Routing request superseded before start', 'AbortError');
    }

    const apiKey = process.env.NEXT_PUBLIC_STADIA_API_KEY;

    if (!apiKey || apiKey === 'undefined') {
      devWarn('NEXT_PUBLIC_STADIA_API_KEY não definida — usando estimativa Haversine. Define a variável em web/.env.local e no Vercel.');
      return buildHaversineEstimate(origin, destination);
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
      const requestBody = buildRequestBody(origin, destination);

      devLog('provider: Stadia Valhalla (POST /route/v1)');
      devLog('request body:', requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        devWarn(`HTTP ${response.status} — usando estimativa Haversine`);
        return buildHaversineEstimate(origin, destination);
      }

      const data: OsrmResponse = await response.json();

      devLog('Stadia response code:', data.code);
      devLog('routes count:', data.routes?.length ?? 0);

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        devWarn(`resposta inválida da Stadia (code=${data.code ?? 'unknown'}) — usando estimativa Haversine`);
        return buildHaversineEstimate(origin, destination);
      }

      const route = data.routes[0];

      // O Valhalla com format=osrm devolve GeoJSON: coordenadas em
      // [longitude, latitude]. Convertemos para { latitude, longitude }.
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
          throw error;
        }
        devWarn(`timeout após ${REQUEST_TIMEOUT_MS}ms — usando estimativa Haversine`);
        return buildHaversineEstimate(origin, destination);
      }

      devWarn(`pedido falhou: ${(error as Error)?.message ?? 'erro desconhecido'} — usando estimativa Haversine`);
      return buildHaversineEstimate(origin, destination);

    } finally {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }
}

export const routingProvider: RoutingProvider = new OsrmRoutingProvider();
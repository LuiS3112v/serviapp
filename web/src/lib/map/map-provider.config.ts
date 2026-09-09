import { MapProviderConfig } from './map-provider.types';

// CARTO Positron — tiles gratuitos, sem API key, com CDN global estável.
// Estilo claro/minimalista que destaca bem os marcadores de prestadores
// e a Polyline de rota sobre o fundo.
// Suporta tiles retina via {r} (sufixo @2x quando o browser o suporta).
//
// NOTA IMPORTANTE: o NEXT_PUBLIC_STADIA_API_KEY continua a ser usado
// exclusivamente pelo motor de routing (osrm-routing-provider.ts →
// POST /route/v1). NÃO foi alterado. Apenas a camada visual mudou.
export const mapProviderConfig: MapProviderConfig = {
  tileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
  defaultZoom: 13,
  discoveryZoom: 13,
  activeServiceZoom: 15,
  minZoom: 5,
  maxZoom: 19,
};

export const defaultMapCenter = {
  latitude: -8.8368,
  longitude: 13.2343,
};
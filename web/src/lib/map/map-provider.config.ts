import { MapProviderConfig } from './map-provider.types';

// Stadia Maps (estilo Alidade Smooth) — substitui o OSM standard tile
// server, que não é pensado para produção (sem tiles retina, sem SLA)
// e estava a causar mapa desfocado/lento. Stadia tem plano gratuito
// permanente sem cartão, com suporte a tiles retina via {r}.
// A API key vem de NEXT_PUBLIC_STADIA_API_KEY (definida em
// web/.env.local e nas Environment Variables da Vercel) — nunca
// hardcoded aqui.
const stadiaApiKey = process.env.NEXT_PUBLIC_STADIA_API_KEY;

export const mapProviderConfig: MapProviderConfig = {
  tileUrl: `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${stadiaApiKey}`,
  attribution:
    '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
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
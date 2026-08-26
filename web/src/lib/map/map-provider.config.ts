import { MapProviderConfig } from './map-provider.types';

// OpenStreetMap padrão — tiles 100% gratuitos, sem API key, sem conta,
// sem rate limit para uso normal em produção.
// O CARTO Voyager que estava antes ({s}.basemaps.cartocdn.com/rastertiles/
// voyager/...) passou a exigir API key em produção — erro "API KEY REQUIRED"
// visível nos tiles em mestroo-two.vercel.app/map. O OSM standard tile
// server é a alternativa mais fiável: universalmente aceite, sem restrições
// de key em nenhum ambiente (local, Vercel, qualquer CDN).
export const mapProviderConfig: MapProviderConfig = {
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
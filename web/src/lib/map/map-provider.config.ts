import { MapProviderConfig } from './map-provider.types';

// CARTO Voyager — tiles gratuitas, sem token, com água azul, verde nas
// zonas verdes e ruas mais definidas que o Positron (light_all) usado
// anteriormente. Ainda não é idêntico ao Google Maps (essa paleta é
// proprietária), mas é o fornecedor gratuito mais próximo dessa
// direção visual sem exigir conta paga ou Mapbox Studio.
export const mapProviderConfig: MapProviderConfig = {
  tileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
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
export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapMarkerData {
  id: string;
  coordinates: MapCoordinates;
  label?: string;
}

export interface MapViewport {
  center: MapCoordinates;
  zoom: number;
}

// Contrato que qualquer fornecedor de mapa tem de cumprir. Hoje é
// implementado com Leaflet + OpenStreetMap. Uma futura migração para
// Mapbox implica apenas escrever um novo módulo que respeite esta
// mesma interface, sem tocar nos componentes de UI que a consomem.
export interface MapProviderConfig {
  tileUrl: string;
  attribution: string;
  defaultZoom: number;
  discoveryZoom: number;
  activeServiceZoom: number;
  minZoom: number;
  maxZoom: number;
}
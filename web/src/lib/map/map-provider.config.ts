import { MapProviderConfig } from './map-provider.types';

// A URL dos tiles é construída directamente no ServiceMap.tsx em runtime
// para garantir que NEXT_PUBLIC_STADIA_API_KEY é inlined correctamente
// pelo Next.js no bundle do cliente. Este config só mantém os valores
// estáticos que não dependem de variáveis de ambiente.
export const mapProviderConfig: MapProviderConfig = {
  tileUrl: '', // não usado — ver ServiceMap.tsx
  attribution:
    '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> ' +
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
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
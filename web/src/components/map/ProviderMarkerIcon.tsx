import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Wrench } from 'lucide-react';

interface ProviderMarkerIconOptions {
  isOnline: boolean;
  isSelected: boolean;
}

const ONLINE_COLOR = '#1D9E75';
const OFFLINE_COLOR = '#9ca3af';
const SELECTED_RING_COLOR = '#EF9F27';

// Pin em forma de gota (o formato clássico de localização), com o
// círculo colorido no topo e a ponta a apontar para a coordenada real
// no mapa. O ícone de chave inglesa identifica visualmente "prestador
// de serviços" sem depender de texto.
export function buildProviderMarkerIcon(options: ProviderMarkerIconOptions): L.DivIcon {
  const fillColor = options.isOnline ? ONLINE_COLOR : OFFLINE_COLOR;
  const outlineColor = options.isSelected ? SELECTED_RING_COLOR : '#ffffff';
  const outlineWidth = options.isSelected ? 3 : 2;

  const markup = renderToStaticMarkup(
    <svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 0C8.954 0 0 8.954 0 20c0 14 20 32 20 32s20-18 20-32C40 8.954 31.046 0 20 0z"
        fill={fillColor}
        stroke={outlineColor}
        strokeWidth={outlineWidth}
      />
      <circle cx="20" cy="19" r="12" fill="rgba(255,255,255,0.16)" />
      <g transform="translate(11, 10)">
        <foreignObject width="18" height="18">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18 }}>
            <Wrench size={16} color="#ffffff" strokeWidth={2.4} />
          </div>
        </foreignObject>
      </g>
    </svg>,
  );

  return L.divIcon({
    html: markup,
    className: 'provider-marker-icon',
    iconSize: [40, 52],
    iconAnchor: [20, 52],
  });
}

// Ponto sólido azul, sem forma de pin, para diferenciar claramente a
// localização do próprio cliente da localização de prestadores.
export function buildClientMarkerIcon(): L.DivIcon {
  const markup = renderToStaticMarkup(
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        backgroundColor: '#378ADD',
        border: '3px solid #ffffff',
        boxShadow: '0 0 0 5px rgba(55, 138, 221, 0.22)',
      }}
    />,
  );

  return L.divIcon({
    html: markup,
    className: 'client-marker-icon',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Pin vermelho maior para o Modo Serviço Ativo, distinto do verde de
// descoberta para deixar claro que este é o único prestador relevante
// naquele momento, não um entre vários a explorar.
export function buildActiveServiceProviderIcon(): L.DivIcon {
  const markup = renderToStaticMarkup(
    <svg width="44" height="58" viewBox="0 0 44 58" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 0C9.85 0 0 9.85 0 22c0 15.4 22 36 22 36s22-20.6 22-36C44 9.85 34.15 0 22 0z"
        fill="#E24B4A"
        stroke="#ffffff"
        strokeWidth="3"
      />
      <circle cx="22" cy="21" r="13" fill="rgba(255,255,255,0.18)" />
      <g transform="translate(12.5, 12)">
        <foreignObject width="19" height="19">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 19, height: 19 }}>
            <Wrench size={17} color="#ffffff" strokeWidth={2.4} />
          </div>
        </foreignObject>
      </g>
    </svg>,
  );

  return L.divIcon({
    html: markup,
    className: 'active-service-provider-icon',
    iconSize: [44, 58],
    iconAnchor: [22, 58],
  });
}
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';

const CLUSTER_COLOR = '#1D9E75';

// Círculo cheio com o número dentro — a mesma forma do cluster do
// mockup de referência, mas na paleta verde/teal da Mestroo em vez do
// azul original, para bater com a identidade visual dos pins.
export function buildClusterIcon(childCount: number): L.DivIcon {
  const size = childCount < 10 ? 40 : childCount < 50 ? 48 : 56;
  const fontSize = childCount < 10 ? 14 : 15;

  const markup = renderToStaticMarkup(
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: CLUSTER_COLOR,
        border: '3px solid #ffffff',
        boxShadow: '0 3px 10px rgba(29, 158, 117, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 700,
        fontSize,
        fontFamily: 'inherit',
      }}
    >
      {childCount}
    </div>,
  );

  return L.divIcon({
    html: markup,
    className: 'provider-cluster-icon',
    iconSize: [size, size],
  });
}
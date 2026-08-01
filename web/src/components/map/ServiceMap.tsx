"use client";

import { useEffect, useMemo, useRef, useState, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { LocateFixed, Loader2 } from 'lucide-react';
import { mapProviderConfig, defaultMapCenter } from '@/lib/map/map-provider.config';
import { MapCoordinates } from '@/lib/map/map-provider.types';
import {
  ProviderLocation,
  ProviderWithDistance,
} from '@/lib/geolocation.api';
import { routingProvider } from '@/lib/routing/osrm-routing-provider';
import { RouteResult } from '@/lib/routing/routing-provider.types';
import { activeServiceLocationSocket, ServiceLocationSnapshot } from '@/lib/map/active-service-location.socket';
import { ActiveServiceSummary } from '@/lib/map/active-service.api';
import { ProviderInfoCard } from './ProviderInfoCard';
import styles from './ServiceMap.module.css';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((m) => m.Polyline), { ssr: false });
const MarkerClusterGroup = dynamic(() => import('react-leaflet-cluster'), { ssr: false });

type MapMode = 'discovery' | 'active-service';

// Estados do Service (ver ServiceStatus enum no backend) em que o
// prestador ainda está em deslocação até ao cliente — o PIN ainda não
// foi validado. É nestes estados (e só nestes) que faz sentido mostrar
// rota, distância e ETA no Active Service Map. Isto é uma classificação
// puramente de apresentação: nenhum estado novo é gravado em base de
// dados, ACCEPTED e PAYMENT_HELD continuam a ser os estados reais do
// serviço — aqui só decidimos como desenhar o mapa consoante eles.
const ON_THE_WAY_STATUSES = ['accepted', 'payment_held'];

interface ServiceMapProps {
  mode: MapMode;
  discoveryProviders?: (ProviderLocation | ProviderWithDistance)[];
  clientCoordinates?: MapCoordinates | null;
  onProviderSelect?: (provider: ProviderLocation | ProviderWithDistance) => void;
  selectedProvider?: (ProviderLocation | ProviderWithDistance) | null;
  onConverse?: (providerId: string) => void;
  isConversing?: boolean;
  onMapMoved?: (center: MapCoordinates) => void;
  showSearchThisArea?: boolean;
  onSearchThisArea?: () => void;
  activeService?: ActiveServiceSummary | null;
  children?: ReactNode;
}

function buildMarkerCollection(
  providers: (ProviderLocation | ProviderWithDistance)[],
): { id: string; coordinates: MapCoordinates; provider: ProviderLocation | ProviderWithDistance }[] {
  return providers
    .filter((provider) => provider.latitude != null && provider.longitude != null)
    .map((provider) => ({
      id: provider.id,
      coordinates: { latitude: provider.latitude as number, longitude: provider.longitude as number },
      provider,
    }));
}

export function ServiceMap({
  mode,
  discoveryProviders = [],
  clientCoordinates = null,
  onProviderSelect,
  selectedProvider = null,
  onConverse,
  isConversing = false,
  onMapMoved,
  showSearchThisArea = false,
  onSearchThisArea,
  activeService = null,
  children,
}: ServiceMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [providerMarkerIcon, setProviderMarkerIcon] = useState<any>(null);
  const [selectedProviderMarkerIcon, setSelectedProviderMarkerIcon] = useState<any>(null);
  const [clientMarkerIcon, setClientMarkerIcon] = useState<any>(null);
  const [activeServiceProviderIcon, setActiveServiceProviderIcon] = useState<any>(null);
  const buildClusterIconRef = useRef<((count: number) => any) | null>(null);

  const [providerSnapshot, setProviderSnapshot] = useState<ServiceLocationSnapshot | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [providerStale, setProviderStale] = useState(false);

  const staleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRouteOriginRef = useRef<MapCoordinates | null>(null);

  const initialCenter = clientCoordinates ?? defaultMapCenter;

  // Fase derivada do status real do serviço — nunca persistida, só usada
  // para decidir o que desenhar. "A caminho": mostra rota/distância/ETA.
  // "Em execução": prestador já chegou, o PIN foi validado — a rota até
  // ao cliente deixou de fazer sentido, por isso deixa de ser calculada
  // e desenhada.
  const isProviderOnTheWay = activeService != null && ON_THE_WAY_STATUSES.includes(activeService.status);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      import('leaflet'),
      import('./ProviderMarkerIcon'),
      import('./ProviderClusterIcon'),
    ]).then(([, iconModule, clusterModule]) => {
      if (!isMounted) return;
      setProviderMarkerIcon(iconModule.buildProviderMarkerIcon({ isOnline: true, isSelected: false }));
      setSelectedProviderMarkerIcon(iconModule.buildProviderMarkerIcon({ isOnline: true, isSelected: true }));
      setClientMarkerIcon(iconModule.buildClientMarkerIcon());
      setActiveServiceProviderIcon(iconModule.buildActiveServiceProviderIcon());
      buildClusterIconRef.current = clusterModule.buildClusterIcon;
      setLeafletReady(true);
    });

    return () => { isMounted = false; };
  }, []);

  // O Leaflet mede o container no instante da montagem; se o layout
  // (sidebar/navbar/flex) ainda não tiver assentado no tamanho final
  // nesse momento, o mapa fica preso a um tamanho pequeno e os tiles
  // aparecem cortados. invalidateSize força uma remedição depois do
  // layout estabilizar, e o listener de resize cobre mudanças
  // posteriores de viewport (ex: rotação em mobile).
  useEffect(() => {
    if (!leafletReady) return;

    const invalidate = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };

    const timeoutId = setTimeout(invalidate, 100);
    window.addEventListener('resize', invalidate);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', invalidate);
    };
  }, [leafletReady]);

  useEffect(() => {
    if (mode !== 'active-service' || !activeService) {
      return;
    }

    activeServiceLocationSocket.joinService(
      activeService.serviceId,
      (snapshot) => {
        setProviderSnapshot(snapshot);
        setProviderStale(false);
      },
      () => {
        // Erros de permissão/estado são silenciosos aqui — o mapa
        // simplesmente permanece sem posição do prestador, sem quebrar
        // a experiência do cliente.
      },
    );

    return () => {
      activeServiceLocationSocket.leaveService(activeService.serviceId);
    };
  }, [mode, activeService]);

  useEffect(() => {
    if (mode !== 'active-service') {
      if (staleCheckRef.current) clearInterval(staleCheckRef.current);
      return;
    }

    staleCheckRef.current = setInterval(() => {
      if (!providerSnapshot) return;
      const secondsSinceUpdate = (Date.now() - new Date(providerSnapshot.updatedAt).getTime()) / 1000;
      setProviderStale(secondsSinceUpdate > 60);
    }, 5000);

    return () => {
      if (staleCheckRef.current) clearInterval(staleCheckRef.current);
    };
  }, [mode, providerSnapshot]);

  // Rota (e portanto distância/ETA) só é calculada durante a fase de
  // deslocação. Uma vez validado o PIN e o serviço passa a "em
  // execução", este efeito deixa de correr — o `route` que já existia
  // em memória fica congelado, mas isso é inofensivo porque a
  // renderização da Polyline e do painel de estatísticas, mais abaixo,
  // também está condicionada a `isProviderOnTheWay`.
  useEffect(() => {
    if (mode !== 'active-service' || !isProviderOnTheWay || !clientCoordinates || !providerSnapshot || providerStale) {
      return;
    }

    const providerCoordinates: MapCoordinates = {
      latitude: providerSnapshot.latitude,
      longitude: providerSnapshot.longitude,
    };

    const previousOrigin = lastRouteOriginRef.current;
    const movedSignificantly = !previousOrigin || haversinePreviewKm(previousOrigin, providerCoordinates) > 0.2;

    if (!movedSignificantly && route) {
      return;
    }

    lastRouteOriginRef.current = providerCoordinates;

    routingProvider.getRoute(providerCoordinates, clientCoordinates).then(setRoute);
  }, [mode, isProviderOnTheWay, clientCoordinates, providerSnapshot, providerStale, route]);

  const discoveryMarkers = useMemo(
    () => buildMarkerCollection(discoveryProviders),
    [discoveryProviders],
  );

  const handleRecenter = useCallback(() => {
    if (!mapRef.current) return;

    if (mode === 'active-service' && providerSnapshot) {
      mapRef.current.setView([providerSnapshot.latitude, providerSnapshot.longitude], mapProviderConfig.activeServiceZoom);
      return;
    }

    if (clientCoordinates) {
      mapRef.current.setView([clientCoordinates.latitude, clientCoordinates.longitude], mapProviderConfig.discoveryZoom);
    }
  }, [mode, providerSnapshot, clientCoordinates]);

  const handleMoveEnd = useCallback(() => {
    if (mode !== 'discovery' || !mapRef.current || !onMapMoved) return;
    const center = mapRef.current.getCenter();
    onMapMoved({ latitude: center.lat, longitude: center.lng });
  }, [mode, onMapMoved]);

  if (!leafletReady) {
    return (
      <div className={styles['map-container']} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} style={{ color: '#EF9F27', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  const routeLatLng = route?.coordinates.map((point) => [point.latitude, point.longitude] as [number, number]) ?? [];

  const discoveryMarkerElements = discoveryMarkers.map(({ id, coordinates, provider }) => (
    <Marker
      key={id}
      position={[coordinates.latitude, coordinates.longitude]}
      icon={selectedProvider?.id === id ? selectedProviderMarkerIcon : providerMarkerIcon}
      eventHandlers={{
        click: () => onProviderSelect?.(provider),
      }}
    />
  ));

  return (
    <div className={styles['map-container']} ref={containerRef}>
      <MapContainer
        center={[initialCenter.latitude, initialCenter.longitude]}
        zoom={mapProviderConfig.defaultZoom}
        minZoom={mapProviderConfig.minZoom}
        maxZoom={mapProviderConfig.maxZoom}
        zoomControl={false}
        className={styles.leafletRoot}
        ref={mapRef}
        whenReady={() => {
          if (mapRef.current) {
            mapRef.current.on('moveend', handleMoveEnd);
            setTimeout(() => mapRef.current?.invalidateSize(), 100);
          }
        }}
      >
        <TileLayer url={mapProviderConfig.tileUrl} attribution={mapProviderConfig.attribution} />

        {mode === 'discovery' && clientCoordinates && clientMarkerIcon && (
          <Marker position={[clientCoordinates.latitude, clientCoordinates.longitude]} icon={clientMarkerIcon} />
        )}

        {mode === 'discovery' && discoveryMarkers.length > 0 && (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={(cluster: any) =>
              buildClusterIconRef.current
                ? buildClusterIconRef.current(cluster.getChildCount())
                : undefined
            }
          >
            {discoveryMarkerElements}
          </MarkerClusterGroup>
        )}

        {mode === 'active-service' && clientCoordinates && clientMarkerIcon && (
          <Marker position={[clientCoordinates.latitude, clientCoordinates.longitude]} icon={clientMarkerIcon} />
        )}

        {mode === 'active-service' && providerSnapshot && !providerStale && activeServiceProviderIcon && (
          <Marker
            position={[providerSnapshot.latitude, providerSnapshot.longitude]}
            icon={activeServiceProviderIcon}
          />
        )}

        {mode === 'active-service' && isProviderOnTheWay && routeLatLng.length > 0 && (
          <Polyline
            positions={routeLatLng}
            pathOptions={{
              color: route?.isEstimate ? '#9ca3af' : '#1D9E75',
              weight: 4,
              opacity: 0.85,
              dashArray: route?.isEstimate ? '8 8' : undefined,
            }}
          />
        )}
      </MapContainer>

      {children}

      {mode === 'discovery' && showSearchThisArea && (
        <div className={styles.searchThisAreaWrapper}>
          <button className={styles.searchThisAreaButton} onClick={onSearchThisArea}>
            Pesquisar nesta área
          </button>
        </div>
      )}

      {mode === 'active-service' && activeService && (
        <div className={styles.activeServiceBanner}>
          <div className={styles.activeServiceInfo}>
            <div className={styles.activeServiceAvatar}>
              {activeService.providerAvatarUrl
                ? <img src={activeService.providerAvatarUrl} alt={activeService.providerName ?? ''} />
                : (activeService.providerName ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className={styles.activeServiceText}>
              <div className={styles.activeServiceProviderName}>
                {activeService.providerName ?? 'Prestador'}
              </div>
              <div className={
                !providerSnapshot || providerStale
                  ? `${styles.activeServiceStatusLabel} ${styles['activeServiceStatusLabel--awaiting']}`
                  : styles.activeServiceStatusLabel
              }>
                {!providerSnapshot
                  ? 'A aguardar a localização do prestador...'
                  : providerStale
                    ? 'A localizar...'
                    : formatServiceStatusLabel(activeService.status)}
              </div>
            </div>
          </div>

          {isProviderOnTheWay && route && providerSnapshot && !providerStale && (
            <div className={styles.activeServiceStats}>
              <div className={styles.activeServiceStatItem}>
                <div className={styles.activeServiceStatValue}>{route.distanceKm.toFixed(1)} km</div>
                <div className={styles.activeServiceStatLabel}>Distância</div>
              </div>
              <div className={styles.activeServiceStatItem}>
                <div className={styles.activeServiceStatValue}>~{route.durationMinutes} min</div>
                <div className={styles.activeServiceStatLabel}>Chegada</div>
              </div>
            </div>
          )}
        </div>
      )}

      <button className={styles.recenterButton} onClick={handleRecenter} aria-label="Centrar mapa">
        <LocateFixed size={20} />
      </button>

      {mode === 'discovery' && selectedProvider && onConverse && (
        <div className={styles.providerInfoCardWrapper}>
          <ProviderInfoCard
            provider={selectedProvider}
            onClose={() => onProviderSelect?.(selectedProvider)}
            onConverse={onConverse}
            isConversing={isConversing}
          />
        </div>
      )}
    </div>
  );
}

function haversinePreviewKm(origin: MapCoordinates, destination: MapCoordinates): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(destination.latitude - origin.latitude);
  const dLon = toRadians(destination.longitude - origin.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
    Math.cos(toRadians(destination.latitude)) *
    Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatServiceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    accepted: 'Prestador a caminho',
    payment_held: 'Prestador a caminho',
    in_progress: 'Serviço em execução',
    provider_completed: 'A aguardar a tua confirmação',
  };

  return labels[status] ?? 'A decorrer';
}
"use client";

import { useEffect, useMemo, useRef, useState, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { LocateFixed, Loader2, WifiOff } from 'lucide-react';
import { mapProviderConfig, defaultMapCenter } from '@/lib/map/map-provider.config';
import { MapCoordinates } from '@/lib/map/map-provider.types';
import {
  ProviderLocation,
  ProviderWithDistance,
} from '@/lib/geolocation.api';
import { routingProvider } from '@/lib/routing/osrm-routing-provider';
import { RouteResult } from '@/lib/routing/routing-provider.types';
import {
  activeServiceLocationSocket,
  ServiceLocationSnapshot,
  SocketConnectionState,
} from '@/lib/map/active-service-location.socket';
import { activeServiceApi, ActiveServiceSummary } from '@/lib/map/active-service.api';
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

// Distância mínima (em km) que o prestador precisa de se deslocar
// desde a última rota calculada para justificar um novo pedido ao
// routing provider. 200m absorve o ruído normal de GPS em ambiente
// urbano sem atrasar visivelmente a atualização da rota enquanto o
// prestador conduz.
const MOVEMENT_THRESHOLD_KM = 0.2;

// Depois deste número de segundos sem QUALQUER snapshot (nem inicial
// via REST, nem via WebSocket), a mensagem de espera passa de "a
// conectar" para "ainda não recebemos localização" — sinaliza ao
// cliente que algo pode estar mesmo errado do lado do prestador (GPS
// desligado, app fechada), em vez de deixar a mensagem genérica de
// espera indefinidamente.
const NO_LOCATION_TIMEOUT_MS = 15000;

// Uma posição é considerada desatualizada (stale) depois deste tempo
// sem nenhuma atualização nova. 60s dá margem para o intervalo de
// broadcast em repouso (30s) mais alguma folga de rede, sem soar falso
// alarme cedo demais.
const STALE_THRESHOLD_MS = 60000;

// Margem (em pixels) deixada entre os pontos extremos enquadrados por
// fitBounds e a borda do container do mapa, para que os marcadores nas
// pontas não fiquem colados/cortados na margem visível. Valor par em
// todos os lados — não precisa de tratamento especial por termos o
// FloatingSearchBar/filtros como children absolutos por cima do mapa,
// não dentro da área de bounds em si.
const FIT_BOUNDS_PADDING: [number, number] = [56, 56];

// Zoom máximo permitido quando fitBounds está a enquadrar poucos
// pontos muito próximos entre si (ex: cliente + 1 prestador a 200m).
// Sem este limite, o Leaflet aproximaria ao máximo possível, o que
// deixa de fazer sentido para descoberta de prestadores — perderíamos
// contexto de rua/bairro à volta. mapProviderConfig.discoveryZoom já é
// o zoom usado noutros pontos (ex: handleRecenter) como "zoom razoável
// de bairro", por isso reaproveitamos o mesmo valor aqui como teto.
function getFitBoundsMaxZoom(): number {
  return mapProviderConfig.discoveryZoom;
}

// Fases visíveis ao cliente durante o Active Service Mode. Substituem
// o antigo par de booleanos (providerSnapshot presente/ausente,
// providerStale true/false), que não conseguia distinguir "ainda não
// chegou nada" de "ligação caiu a meio" — dois problemas com causas e
// mensagens diferentes.
type LocationPhase = 'connecting' | 'no_location' | 'live' | 'stale' | 'reconnecting';

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

// Guarda de validação antes de qualquer coordenada seguir para o
// routing provider. Protege contra NaN, undefined convertido, ou
// valores fora do intervalo geográfico válido — nunca deixa uma
// posição inválida chegar ao OSRM.
function isValidCoordinate(coordinates: MapCoordinates | null | undefined): coordinates is MapCoordinates {
  if (!coordinates) return false;
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

// Aceita um ServiceLocationSnapshot vindo tanto do WebSocket como do
// endpoint REST de snapshot inicial, validando os campos antes de
// entrar no estado do componente. Nunca aceita NaN/null/undefined nem
// coordenadas fora do intervalo válido — nem um timestamp inválido.
function isValidSnapshot(snapshot: ServiceLocationSnapshot | null | undefined): snapshot is ServiceLocationSnapshot {
  if (!snapshot) return false;
  if (!isValidCoordinate({ latitude: snapshot.latitude, longitude: snapshot.longitude })) return false;
  const updatedAtMs = new Date(snapshot.updatedAt).getTime();
  return Number.isFinite(updatedAtMs);
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
  const [socketState, setSocketState] = useState<SocketConnectionState>('connecting');
  const [noLocationTimeoutElapsed, setNoLocationTimeoutElapsed] = useState(false);

  const staleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noLocationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRouteOriginRef = useRef<MapCoordinates | null>(null);

  // Evita repetir fitBounds para o mesmo conjunto de pontos — guarda
  // uma assinatura simples (ids + cliente) do último enquadramento
  // aplicado. Sem isto, qualquer re-render que produza um novo array
  // de discoveryMarkers com o mesmo conteúdo (ex: poll de 25s que
  // devolve os mesmos prestadores) faria o mapa "saltar" de volta ao
  // enquadramento automático mesmo que o utilizador tivesse acabado de
  // fazer zoom/pan manualmente — o que seria intrusivo.
  const lastFitBoundsSignatureRef = useRef<string | null>(null);

  // NOVO — guarda se o recentramento automático em modo active-service
  // já foi feito nesta montagem do componente (ver useEffect logo após
  // o de fitBounds do modo discovery, mais abaixo). Sem isto, o mapa
  // em Acompanhamento do Serviço nunca reagia à chegada tardia das
  // coordenadas reais do cliente: o center do MapContainer só é
  // aplicado pelo react-leaflet na montagem, e o único useEffect que já
  // existia para recentrar (fitBounds) tinha guarda explícita
  // `mode !== 'discovery' -> return`, deixando active-service de fora.
  const hasCenteredOnClientRef = useRef(false);

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

  // NOVO — ResizeObserver sobre o próprio container do mapa.
  // O listener de 'resize' da window acima cobre mudanças de tamanho
  // da JANELA, mas numa PWA em modo standalone o container pode mudar
  // de tamanho (ex: barra do browser a desaparecer, viewport a
  // assentar no tamanho final) sem que a janela em si dispare um
  // evento de resize. O ResizeObserver deteta diretamente mudanças no
  // elemento onde o Leaflet está montado, cobrindo esse cenário.
  // Um só observer por instância (guardado em ref, desligado no
  // cleanup) evita observers duplicados ou fugas de memória.
  useEffect(() => {
    if (!leafletReady || !containerRef.current) return;

    const el = containerRef.current;
    let frame: number | null = null;

    const observer = new ResizeObserver(() => {
      // requestAnimationFrame evita chamar invalidateSize() múltiplas
      // vezes em sequência quando o ResizeObserver dispara vários
      // callbacks muito próximos (ex: durante uma transição de
      // layout) — só a última medição de cada frame é aplicada.
      if (frame != null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
    });

    observer.observe(el);

    return () => {
      if (frame != null) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [leafletReady]);

  // Snapshot inicial via REST — corre em paralelo com a ligação
  // WebSocket, não em vez dela. Cobre exatamente o caso em que o
  // cliente entra na página antes do WebSocket ter tido oportunidade
  // de entregar nada (ligação ainda a estabelecer, ou o prestador
  // ainda não emitiu nenhuma posição desde que o serviço começou):
  // sem isto, o mapa ficava sempre preso a "a aguardar" até ao
  // primeiro evento do socket chegar, mesmo quando já existia um
  // snapshot válido guardado no backend. Se o WebSocket entregar
  // primeiro, o resultado deste fetch (mais antigo) é ignorado —
  // nunca sobrescreve um snapshot mais recente já recebido.
  useEffect(() => {
    if (mode !== 'active-service' || !activeService) {
      return;
    }

    let cancelled = false;

    activeServiceApi.getSnapshot(activeService.serviceId)
      .then((snapshot) => {
        if (cancelled) return;
        if (isValidSnapshot(snapshot)) {
          setProviderSnapshot((current) => {
            // Nunca substitui um snapshot já existente (pode ter
            // chegado, entretanto, um mais recente via WebSocket).
            if (current) return current;
            return snapshot;
          });
        }
      })
      .catch(() => {
        // Falha do fetch inicial não é crítica — o WebSocket continua
        // a ser a fonte principal; isto é só um atalho para reduzir o
        // tempo de espera percebido.
      });

    return () => {
      cancelled = true;
    };
  }, [mode, activeService?.serviceId]);

  // Liga o socket à sala do serviço e escuta o estado da própria
  // ligação (connecting/connected/reconnecting/disconnected), para que
  // a UI consiga distinguir "a estabelecer ligação pela primeira vez"
  // de "a ligação caiu e está a tentar recuperar" — cenários com
  // mensagens diferentes para o cliente.
  useEffect(() => {
    if (mode !== 'active-service' || !activeService) {
      return;
    }

    activeServiceLocationSocket.joinService(
      activeService.serviceId,
      (snapshot) => {
        if (!isValidSnapshot(snapshot)) return;
        setProviderSnapshot(snapshot);
      },
      () => {
        // Erros de permissão/estado são silenciosos aqui — o mapa
        // simplesmente permanece sem posição do prestador, sem quebrar
        // a experiência do cliente. O estado de conexão do socket
        // (socketState) continua a refletir a ligação em si.
      },
    );

    const unsubscribe = activeServiceLocationSocket.onConnectionChange(setSocketState);

    return () => {
      unsubscribe();
      activeServiceLocationSocket.leaveService(activeService.serviceId);
    };
  }, [mode, activeService?.serviceId]);

  // Temporizador de "ainda não recebemos localização nenhuma". Reinicia
  // sempre que muda o serviço ativo ou assim que um snapshot chega
  // (deixa de ser necessário). Distingue-se do stale-check abaixo:
  // este cobre a ausência total de dados, o outro cobre dados
  // existentes mas envelhecidos.
  useEffect(() => {
    if (mode !== 'active-service' || !activeService || providerSnapshot) {
      setNoLocationTimeoutElapsed(false);
      if (noLocationTimeoutRef.current) {
        clearTimeout(noLocationTimeoutRef.current);
        noLocationTimeoutRef.current = null;
      }
      return;
    }

    noLocationTimeoutRef.current = setTimeout(() => {
      setNoLocationTimeoutElapsed(true);
    }, NO_LOCATION_TIMEOUT_MS);

    return () => {
      if (noLocationTimeoutRef.current) {
        clearTimeout(noLocationTimeoutRef.current);
      }
    };
  }, [mode, activeService?.serviceId, providerSnapshot]);

  // Deteção de staleness sobre um snapshot já existente — corre em
  // intervalo próprio (independente do relógio de chegada de updates)
  // para que a UI reaja mesmo que nenhum evento novo chegue.
  const isProviderStale = useMemo(() => {
    if (!providerSnapshot) return false;
    const secondsSinceUpdate = Date.now() - new Date(providerSnapshot.updatedAt).getTime();
    return secondsSinceUpdate > STALE_THRESHOLD_MS;
  }, [providerSnapshot]);

  const [, forceStaleRecheck] = useState(0);
  useEffect(() => {
    if (mode !== 'active-service') {
      if (staleCheckRef.current) clearInterval(staleCheckRef.current);
      return;
    }

    staleCheckRef.current = setInterval(() => {
      // providerSnapshot em si não mudou, mas o "tempo desde a última
      // atualização" sim — força um recálculo de isProviderStale sem
      // precisar de guardar staleness como estado próprio duplicado.
      forceStaleRecheck((n) => n + 1);
    }, 5000);

    return () => {
      if (staleCheckRef.current) clearInterval(staleCheckRef.current);
    };
  }, [mode]);

  // Fase visível ao cliente, derivada de: estado da ligação socket +
  // presença de snapshot + staleness + timeout de "nunca chegou nada".
  // Prioridade: uma ligação a recuperar (reconnecting) é sempre mais
  // urgente de comunicar do que staleness de um snapshot antigo, já
  // que explica a causa provável da própria staleness.
  const locationPhase: LocationPhase = useMemo(() => {
    if (socketState === 'reconnecting') return 'reconnecting';
    if (!providerSnapshot) {
      return noLocationTimeoutElapsed ? 'no_location' : 'connecting';
    }
    return isProviderStale ? 'stale' : 'live';
  }, [socketState, providerSnapshot, isProviderStale, noLocationTimeoutElapsed]);

  // Rota (e portanto distância/ETA) só é calculada durante a fase de
  // deslocação. Uma vez validado o PIN e o serviço passa a "em
  // execução", este efeito deixa de correr — o `route` que já existia
  // em memória fica congelado, mas isso é inofensivo porque a
  // renderização da Polyline e do painel de estatísticas, mais abaixo,
  // também está condicionada a `isProviderOnTheWay`.
  //
  // Proteção contra race conditions: cada execução do efeito cria o
  // seu próprio AbortController e uma flag `cancelled` fechada sobre a
  // promise. A função de cleanup do useEffect corre automaticamente
  // sempre que o efeito é re-executado (nova posição relevante, mudança
  // de modo, etc.) ou quando o componente desmonta — nesse momento
  // aborta o request em curso e marca `cancelled = true`, garantindo
  // que uma resposta antiga nunca sobrescreve uma rota mais recente e
  // que nunca há um `setState` depois de desmontar.
  useEffect(() => {
    if (mode !== 'active-service' || !isProviderOnTheWay || !clientCoordinates || !providerSnapshot || locationPhase === 'stale') {
      return;
    }

    const providerCoordinates: MapCoordinates = {
      latitude: providerSnapshot.latitude,
      longitude: providerSnapshot.longitude,
    };

    if (!isValidCoordinate(providerCoordinates) || !isValidCoordinate(clientCoordinates)) {
      return;
    }

    const previousOrigin = lastRouteOriginRef.current;
    const movedSignificantly = !previousOrigin || haversinePreviewKm(previousOrigin, providerCoordinates) > MOVEMENT_THRESHOLD_KM;

    if (!movedSignificantly && route) {
      return;
    }

    lastRouteOriginRef.current = providerCoordinates;

    const controller = new AbortController();
    let cancelled = false;

    routingProvider
      .getRoute(providerCoordinates, clientCoordinates, controller.signal)
      .then((result) => {
        if (cancelled) return;
        setRoute(result);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.name !== 'AbortError' && process.env.NODE_ENV !== 'production') {
          console.warn('[ServiceMap] unexpected routing error', error);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [mode, isProviderOnTheWay, clientCoordinates, providerSnapshot, locationPhase, route]);

  const discoveryMarkers = useMemo(
    () => buildMarkerCollection(discoveryProviders),
    [discoveryProviders],
  );

  // Enquadra automaticamente o mapa (cliente + todos os prestadores
  // encontrados) sempre que a lista de discoveryMarkers muda, em vez
  // de manter sempre o mesmo defaultZoom fixo centrado no cliente. Só
  // corre em modo discovery — em active-service o enquadramento é
  // tratado pelo useEffect seguinte.
  //
  // Guardas aplicadas:
  // - Precisa de leafletReady e do mapRef já montado (whenReady).
  // - Se não há clientCoordinates nem markers, não há nada para
  //   enquadrar — mantém o comportamento anterior (defaultMapCenter).
  // - Assinatura (ids ordenados + posição do cliente arredondada)
  //   evita repetir fitBounds para o mesmo conjunto de pontos em
  //   re-renders que não mudam realmente os dados (ex: poll de 25s
  //   devolvendo os mesmos prestadores) — não força o mapa a "saltar"
  //   de volta ao enquadramento automático depois de o utilizador ter
  //   feito zoom/pan manual.
  // - maxZoom limitado via getFitBoundsMaxZoom(), para não aproximar
  //   demasiado quando há poucos pontos muito próximos.
  useEffect(() => {
    if (mode !== 'discovery' || !leafletReady || !mapRef.current) return;

    const points: [number, number][] = [];

    if (clientCoordinates && isValidCoordinate(clientCoordinates)) {
      points.push([clientCoordinates.latitude, clientCoordinates.longitude]);
    }

    discoveryMarkers.forEach(({ coordinates }) => {
      if (isValidCoordinate(coordinates)) {
        points.push([coordinates.latitude, coordinates.longitude]);
      }
    });

    if (points.length === 0) return;

    const signature =
      discoveryMarkers.map((m) => m.id).sort().join(',') +
      '|' +
      (clientCoordinates
        ? `${clientCoordinates.latitude.toFixed(3)},${clientCoordinates.longitude.toFixed(3)}`
        : 'none');

    if (lastFitBoundsSignatureRef.current === signature) return;
    lastFitBoundsSignatureRef.current = signature;

    if (points.length === 1) {
      // Um único ponto (ex: só o cliente, sem prestadores ainda
      // carregados): fitBounds não faz sentido para um ponto isolado,
      // usa-se setView com o zoom de descoberta habitual.
      mapRef.current.setView(points[0], mapProviderConfig.discoveryZoom);
      return;
    }

    mapRef.current.fitBounds(points, {
      padding: FIT_BOUNDS_PADDING,
      maxZoom: getFitBoundsMaxZoom(),
    });
  }, [mode, leafletReady, clientCoordinates, discoveryMarkers]);

  // NOVO (Problema 1 — mapa mostra zona errada no Acompanhamento do
  // Serviço/active-service):
  //
  // O useEffect de fitBounds logo acima só corre para
  // mode === 'discovery'. Em mode === 'active-service' o MapContainer
  // é montado uma única vez com center = initialCenter (que é
  // clientCoordinates ?? defaultMapCenter — Luanda central, ver
  // map-provider.config.ts), e o react-leaflet só aplica esse `center`
  // na montagem: não reage a mudanças posteriores na prop.
  //
  // Como a página /map obtém a localização do cliente de forma
  // assíncrona via navigator.geolocation.getCurrentPosition, existe
  // sempre uma janela em que este componente monta com
  // clientCoordinates ainda a null. Sem este efeito, o mapa arrancava
  // centrado no fallback fixo de Luanda e ficava preso ali mesmo depois
  // de a posição real do cliente chegar — exactamente o sintoma
  // relatado ("o mapa mostra a zona errada").
  //
  // Este efeito centra o mapa nas coordenadas reais do cliente na
  // PRIMEIRA vez que chegam nesta montagem (hasCenteredOnClientRef
  // garante que corre uma única vez), sem interferir com o fitBounds do
  // modo discovery nem com o recentramento manual via handleRecenter, e
  // sem forçar recentragens repetidas a cada refresh de 30s do GPS
  // durante o acompanhamento do serviço (ver ACTIVE_SERVICE_LOCATION_
  // REFRESH_MS em map/page.tsx).
  useEffect(() => {
    if (mode !== 'active-service' || !leafletReady || !mapRef.current) return;
    if (hasCenteredOnClientRef.current) return;
    if (!clientCoordinates || !isValidCoordinate(clientCoordinates)) return;

    mapRef.current.setView(
      [clientCoordinates.latitude, clientCoordinates.longitude],
      mapProviderConfig.discoveryZoom,
    );
    hasCenteredOnClientRef.current = true;
  }, [mode, leafletReady, clientCoordinates]);

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
  const showProviderMarker = mode === 'active-service' && providerSnapshot && locationPhase !== 'stale' && activeServiceProviderIcon;

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

        {showProviderMarker && (
          <Marker
            position={[providerSnapshot!.latitude, providerSnapshot!.longitude]}
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
                locationPhase !== 'live'
                  ? `${styles.activeServiceStatusLabel} ${styles['activeServiceStatusLabel--awaiting']}`
                  : styles.activeServiceStatusLabel
              }>
                {locationPhase === 'reconnecting' && (
                  <span className={styles.statusWithIcon}>
                    <WifiOff size={12} /> Ligação perdida. A tentar novamente...
                  </span>
                )}
                {locationPhase === 'connecting' && 'A ligar ao prestador...'}
                {locationPhase === 'no_location' && 'O prestador está com a localização temporariamente indisponível.'}
                {locationPhase === 'stale' && 'Localização desatualizada. A tentar recuperar...'}
                {locationPhase === 'live' && formatServiceStatusLabel(activeService.status)}
              </div>
              {isProviderOnTheWay && route?.isEstimate && locationPhase === 'live' && (
                <div className={styles.activeServiceEstimateBadge}>Estimativa</div>
              )}
            </div>
          </div>

          {isProviderOnTheWay && route && locationPhase === 'live' && (
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
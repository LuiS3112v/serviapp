"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { ServiceMap } from '@/components/map/ServiceMap';
import {
  fetchNearbyProviders,
  fetchProviders,
  ProviderLocation,
  ProviderWithDistance,
  StatusFilter,
} from '@/lib/geolocation.api';
import { activeServiceApi, ActiveServiceSummary } from '@/lib/map/active-service.api';
import { MapCoordinates } from '@/lib/map/map-provider.types';
import { chatApi } from '@/lib/chat.api';
import { CATEGORY_NAMES } from '@/lib/categories';
import styles from './map-page.module.css';

// CORRIGIDO — antes existia um array local ['Todos', 'Limpeza', ...,
// 'Eletricista', ...] duplicado e desalinhado da lista oficial em
// web/src/lib/categories.ts (que usa 'Eletricidade', não
// 'Eletricista'). Passa a importar CATEGORY_NAMES — a mesma fonte de
// verdade já usada no registo, no KYC e nos Serviços Rápidos — e
// antepõe 'Todos' apenas aqui, que é uma opção de filtro desta página
// e não uma categoria real de negócio.
const CATEGORIES = ['Todos', ...CATEGORY_NAMES];

const RADIUS_OPTIONS = [2, 5, 10, 20];

// Intervalo de refresh do GPS do cliente enquanto um serviço está
// ativo (prestador a caminho / em execução). Não usamos watchPosition
// contínuo aqui: um refresh pontual a cada 30s dá posição fresca o
// suficiente para a rota/ETA no ServiceMap sem manter o sensor de GPS
// ligado permanentemente — trade-off deliberado a favor da bateria do
// cliente. No modo discovery este timer não corre (ver useEffect mais
// abaixo, condicionado a activeService != null).
const ACTIVE_SERVICE_LOCATION_REFRESH_MS = 30000;

// Distância mínima (em km) que a posição do cliente precisa de se
// afastar da última posição usada numa pesquisa de descoberta, para
// justificar uma nova chamada a fetchNearbyProviders. 0.05km = 50m
// absorve o ruído normal do GPS (variações de poucos metros entre
// leituras) sem deixar de reagir a uma mudança real de local. Mesma
// ideia que o ServiceMap.tsx já aplica com MOVEMENT_THRESHOLD_KM para
// decidir quando recalcular a rota do prestador.
const DISCOVERY_MOVEMENT_THRESHOLD_KM = 0.05;

// FIX — "2 navbars" / "2 sidebars" / freeze ao entrar em /map:
//
// O layout do dashboard ((dashboard)/layout.tsx) já envolve TODAS as
// páginas do grupo com <ClientChrome>, que monta Sidebar+Navbar uma
// única vez, persistente entre navegações (o Next.js App Router
// preserva esse componente ao trocar de rota dentro do mesmo grupo).
// As outras páginas (home, services, etc.) já não montam Sidebar/
// Navbar próprios — só devolvem o seu conteúdo, que o ClientChrome
// envolve.
//
// Esta página tinha ficado por migrar: continuava a importar e a
// montar <Sidebar/> e <Navbar/> manualmente nos seus 3 pontos de
// retorno (loading / serviço activo / descoberta), duplicando
// exactamente o que o ClientChrome já monta por fora. Resultado:
// 2 Sidebars montados ao mesmo tempo (cada um com o seu próprio
// listener do evento "sidebar:toggle" — daí abrir/fechar "2 vezes"),
// 2 Navbars (cada um com o seu próprio polling de contadores de chat/
// notificações), e o trabalho a dobrar (2x Leaflet a preparar-se,
// 2x fetch de contadores a cada 30s) a pressionar a main thread —
// a causa real do freeze ao entrar no mapa.
//
// CORRIGIDO: Sidebar/Navbar e as classes .hw/.hm/.hi (que recriavam
// a estrutura que o ClientChrome já fornece via .cl-layout/.cl-main)
// foram removidos daqui. Esta página agora só devolve o seu próprio
// conteúdo — exactamente como home/services/etc já fazem.

type ViewMode = 'map' | 'list';
type LocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

// Legenda da fase do serviço ativo, mostrada no cabeçalho da página de
// acompanhamento. Deriva do mesmo `status` que o ServiceMap já usa
// internamente para decidir se mostra rota/distância/ETA — aqui é só
// texto, sem nenhuma lógica de mapa.
function getActiveServicePhaseLabel(status: string): string {
  if (status === 'in_progress') return 'Serviço em execução';
  if (status === 'provider_completed') return 'A aguardar a tua confirmação';
  return 'Prestador a caminho';
}

// Distância aproximada (Haversine) entre duas coordenadas, em km.
// Usada só para decidir se uma nova posição do cliente se afastou o
// suficiente da última pesquisa para justificar recarregar prestadores
// (ver DISCOVERY_MOVEMENT_THRESHOLD_KM). Não é usada para nada visível
// ao utilizador — o backend continua a ser a fonte da distância real
// mostrada nos cards de prestador.
function haversineKm(a: MapCoordinates, b: MapCoordinates): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2) ** 2;
  const sinDLon = Math.sin(dLon / 2) ** 2;

  const h =
    sinDLat +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * sinDLon;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function MapPage() {
  const router = useRouter();

  const [activeService, setActiveService] = useState<ActiveServiceSummary | null>(null);
  const [checkingActiveService, setCheckingActiveService] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [clientCoordinates, setClientCoordinates] = useState<MapCoordinates | null>(null);

  const [providers, setProviders] = useState<(ProviderLocation | ProviderWithDistance)[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<(ProviderLocation | ProviderWithDistance) | null>(null);

  // BUG 3 FIX — pendingMapCenter era um useState, o que o colocava nas
  // dependências do useCallback de loadDiscoveryProviders. Cada movimento
  // do mapa mudava pendingMapCenter → recriava loadDiscoveryProviders →
  // o useEffect do polling reiniciava o interval → atraso de ~10-15s nos
  // filtros. Como pendingMapCenter só é lido dentro de loadDiscoveryProviders
  // (não precisa de causar re-render por si só), passa a ser uma ref:
  // o seu valor está sempre disponível no closure sem causar recriações
  // desnecessárias do callback nem resets do polling.
  const pendingMapCenterRef = useRef<MapCoordinates | null>(null);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);

  const [conversingProviderId, setConversingProviderId] = useState<string | null>(null);

  const activePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const discoveryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeServiceLocationRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Evita setState em componente desmontado. Os callbacks assíncronos
  // de getCurrentPosition e das chamadas à API podem resolver depois
  // de o utilizador já ter saído da página (navegação rápida, GPS
  // lento). Todos os callbacks assíncronos verificam esta ref antes de
  // qualquer setState.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Guarda a última posição do cliente efetivamente usada numa
  // pesquisa de descoberta, para o useEffect de loadDiscoveryProviders
  // poder comparar e decidir se uma nova leitura de GPS representa
  // movimento real ou apenas ruído do sensor.
  const lastDiscoverySearchOriginRef = useRef<MapCoordinates | null>(null);

  // NOVO — guarda o AbortController do pedido de descoberta em curso.
  // Sempre que loadDiscoveryProviders é chamada de novo (troca rápida
  // de categoria/filtro), o pedido anterior é abortado antes do novo
  // começar. Sem isto, se a resposta de um filtro antigo chegasse
  // depois da resposta de um filtro mais recente, o resultado errado
  // (do filtro antigo) sobrescrevia o resultado correto no ecrã — uma
  // race condition real ao trocar filtros rapidamente.
  const discoveryRequestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;

    activeServiceApi.getMyActiveService()
      .then((summary) => {
        if (isMounted) setActiveService(summary);
      })
      .catch(() => {
        if (isMounted) setActiveService(null);
      })
      .finally(() => {
        if (isMounted) setCheckingActiveService(false);
      });

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!activeService) {
      if (activePollRef.current) clearInterval(activePollRef.current);
      return;
    }

    activePollRef.current = setInterval(() => {
      activeServiceApi.getMyActiveService()
        .then((summary) => setActiveService(summary))
        .catch(() => setActiveService(null));
    }, 20000);

    return () => {
      if (activePollRef.current) clearInterval(activePollRef.current);
    };
  }, [activeService?.serviceId]);

  const requestClientLocation = useCallback(() => {
    if (!navigator.geolocation) {
      if (isMountedRef.current) setLocationState('unsupported');
      return;
    }

    setLocationState('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) return;
        setClientCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationState('granted');
      },
      () => {
        if (!isMountedRef.current) return;
        setLocationState('denied');
      },
      // CORRIGIDO (Problema 1 — localização mostra zona errada):
      // maximumAge estava em 60000 (60s), o que permitia ao browser
      // devolver uma posição em cache de até um minuto — incluindo uma
      // posição de uma sessão/local anterior do mesmo dispositivo. Este
      // é o pedido inicial de localização, feito uma única vez ao
      // montar a página: exigir maximumAge:0 força o browser a obter
      // sempre uma leitura fresca do GPS neste momento, eliminando a
      // possibilidade de mostrar uma zona desatualizada logo na
      // primeira renderização do mapa.
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }, []);

  // Refresh silencioso de localização — usado pelo timer do modo
  // active-service abaixo. Distinto de requestClientLocation: não mexe
  // em locationState em caso de sucesso (não queremos "A obter
  // localização" a piscar no botão a cada 30s), e maximumAge mais baixo
  // garante uma leitura mais fresca do que a cache de 60s usada no
  // pedido inicial.
  //
  // Se o erro for especificamente PERMISSION_DENIED (código 1), já não
  // faz sentido continuar a tentar de 30 em 30s: a permissão foi
  // revogada a meio do serviço ativo. Nesse caso paramos o interval (via
  // callback fornecido pelo useEffect que chama esta função) e refletimos
  // isso em locationState, para a mensagem "Não foi possível obter a tua
  // localização" já existente na UI passar a aparecer também neste
  // cenário. Outros erros (timeout, posição indisponível) continuam
  // silenciosos — são normalmente temporários e não deve interromper o
  // refresh periódico.
  const refreshClientLocationSilently = useCallback((onPermissionDenied: () => void) => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) return;
        setClientCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (!isMountedRef.current) return;
        if (error.code === error.PERMISSION_DENIED) {
          setLocationState('denied');
          onPermissionDenied();
        }
        // Outros códigos de erro (TIMEOUT, POSITION_UNAVAILABLE):
        // silencioso de propósito, mantém a última posição conhecida.
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 },
    );
  }, []);

  // Pede a localização automaticamente assim que a página monta, em
  // vez de depender exclusivamente do clique manual no botão "Ativar
  // localização". O browser decide sozinho se mostra o prompt de
  // permissão (já concedida = sem prompt, ainda não pedida = mostra o
  // prompt, bloqueada = erro imediato no callback).
  useEffect(() => {
    requestClientLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh periódico da localização do cliente, só enquanto existe um
  // serviço ativo (prestador a caminho / em execução). Um refresh a
  // cada 30s é suficiente para manter a rota/ETA do ServiceMap
  // razoavelmente atualizados sem o custo de bateria de um
  // watchPosition contínuo.
  useEffect(() => {
    if (!activeService) {
      if (activeServiceLocationRefreshRef.current) {
        clearInterval(activeServiceLocationRefreshRef.current);
        activeServiceLocationRefreshRef.current = null;
      }
      return;
    }

    activeServiceLocationRefreshRef.current = setInterval(() => {
      refreshClientLocationSilently(() => {
        if (activeServiceLocationRefreshRef.current) {
          clearInterval(activeServiceLocationRefreshRef.current);
          activeServiceLocationRefreshRef.current = null;
        }
      });
    }, ACTIVE_SERVICE_LOCATION_REFRESH_MS);

    return () => {
      if (activeServiceLocationRefreshRef.current) {
        clearInterval(activeServiceLocationRefreshRef.current);
        activeServiceLocationRefreshRef.current = null;
      }
    };
  }, [activeService?.serviceId, refreshClientLocationSilently]);

  // NOVO — cada chamada aborta o pedido de descoberta anterior (se
  // ainda estiver em curso) antes de iniciar um novo. Isto garante que,
  // ao trocar rapidamente entre categorias/filtros, apenas a resposta
  // do pedido mais recente pode atualizar `providers` — uma resposta
  // antiga que chegue depois é sempre ignorada (AbortError), nunca
  // sobrescreve um resultado mais novo.
  // FIX PROBLEMA 2 — filtros lentos (10-15s)
  //
  // CAUSA RAIZ: loadDiscoveryProviders era um useCallback com
  // [activeService, category, status, availableOnly, radiusKm,
  // clientCoordinates] nas dependências. Quando o utilizador clicava
  // num filtro (ex: "Limpeza"), o ciclo era:
  //
  //   1. setCategory("Limpeza") → React agenda re-render
  //   2. useEffect([category,...]) dispara → chama loadDiscoveryProviders
  //      MAS esta ainda é a versão ANTIGA do callback (category="Todos")
  //      → a ref desatualizada dentro do callback faz o fetch errado
  //   3. Re-render completa → useCallback recria loadDiscoveryProviders
  //      com category="Limpeza"
  //   4. useEffect([activeService, loadDiscoveryProviders]) detecta que
  //      loadDiscoveryProviders mudou → DESTRÓI o interval de 25s e cria
  //      um NOVO → próximo tick só acontece daqui a 25s
  //
  // Resultado: fetch com filtro errado + 25s de espera antes do correto.
  //
  // CORREÇÃO: os valores de filtro passam a ser lidos de refs (sempre
  // frescos dentro do callback). O useCallback tem dependências mínimas
  // [activeService], eliminando a recriação ao trocar filtros. O polling
  // nunca é reiniciado por um clique de categoria/status/raio.
  // Um useEffect separado com as dependências de filtro chama
  // loadDiscoveryProviders diretamente para reagir imediatamente.

  // Refs sempre sincronizadas com o valor atual dos filtros — lidas
  // dentro do callback sem causar recriação nem reinício do polling.
  const categoryRef = useRef(category);
  const statusRef = useRef(status);
  const availableOnlyRef = useRef(availableOnly);
  const radiusKmRef = useRef(radiusKm);
  const clientCoordinatesRef = useRef(clientCoordinates);

  categoryRef.current = category;
  statusRef.current = status;
  availableOnlyRef.current = availableOnly;
  radiusKmRef.current = radiusKm;
  clientCoordinatesRef.current = clientCoordinates;

  const loadDiscoveryProviders = useCallback(async () => {
    if (activeService) return;

    // Lê os valores actuais das refs (sempre frescos)
    const currentCategory = categoryRef.current;
    const currentStatus = statusRef.current;
    const currentAvailableOnly = availableOnlyRef.current;
    const currentRadiusKm = radiusKmRef.current;
    const currentClientCoordinates = clientCoordinatesRef.current;

    if (discoveryRequestControllerRef.current) {
      discoveryRequestControllerRef.current.abort();
    }
    const controller = new AbortController();
    discoveryRequestControllerRef.current = controller;

    setLoadingProviders(true);
    setProvidersError(null);

    try {
      let data: (ProviderLocation | ProviderWithDistance)[];

      const searchOrigin = pendingMapCenterRef.current ?? currentClientCoordinates;

      if (searchOrigin) {
        data = await fetchNearbyProviders({
          latitude: searchOrigin.latitude,
          longitude: searchOrigin.longitude,
          radiusKm: currentRadiusKm,
          category: currentCategory !== 'Todos' ? currentCategory : undefined,
          status: currentStatus !== 'all' ? currentStatus : undefined,
          availableOnly: currentAvailableOnly,
        }, controller.signal);
        lastDiscoverySearchOriginRef.current = searchOrigin;
      } else {
        let raw = await fetchProviders(currentCategory !== 'Todos' ? currentCategory : undefined, controller.signal);
        if (currentStatus === 'online') raw = raw.filter((p) => p.isOnline);
        if (currentStatus === 'offline') raw = raw.filter((p) => !p.isOnline);
        if (currentAvailableOnly) raw = raw.filter((p) => p.isOnline);
        data = raw.filter((p) => p.latitude != null && p.longitude != null);
        lastDiscoverySearchOriginRef.current = null;
      }

      if (controller.signal.aborted) return;
      if (!isMountedRef.current) return;

      setProviders(data);
      setShowSearchThisArea(false);
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      if (!isMountedRef.current) return;
      setProvidersError(error.message ?? 'Erro ao carregar prestadores.');
    } finally {
      if (isMountedRef.current && discoveryRequestControllerRef.current === controller) {
        setLoadingProviders(false);
      }
    }
  // Dependências mínimas: só o que força nova instância do callback.
  // Os filtros são lidos via refs — não precisam de estar aqui.
  }, [activeService]);

  // Trigger IMEDIATO quando os filtros mudam — reage no mesmo render
  // cycle, sem esperar pelo próximo tick do polling (25s).
  // Não tem guarda de movimento: uma mudança de filtro é sempre
  // intencional e deve disparar fetch imediatamente.
  useEffect(() => {
    if (activeService) return;
    loadDiscoveryProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, availableOnly, radiusKm]);

  // Trigger separado para mudança de localização do cliente —
  // com guarda de movimento para evitar reloads por ruído GPS.
  useEffect(() => {
    if (activeService) return;
    if (!clientCoordinates) {
      loadDiscoveryProviders();
      return;
    }

    const lastOrigin = lastDiscoverySearchOriginRef.current;
    const movedSignificantly =
      !lastOrigin || haversineKm(lastOrigin, clientCoordinates) > DISCOVERY_MOVEMENT_THRESHOLD_KM;

    if (movedSignificantly) {
      loadDiscoveryProviders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientCoordinates]);

  // Polling de 25s — agora estável: loadDiscoveryProviders não muda
  // quando os filtros mudam, logo o interval nunca é reiniciado por
  // um clique de categoria/status/raio.
  useEffect(() => {
    if (activeService) {
      if (discoveryPollRef.current) clearInterval(discoveryPollRef.current);
      return;
    }

    discoveryPollRef.current = setInterval(() => {
      loadDiscoveryProviders();
    }, 25000);

    return () => {
      if (discoveryPollRef.current) clearInterval(discoveryPollRef.current);
    };
  }, [activeService, loadDiscoveryProviders]);

  // Limpa qualquer pedido de descoberta em curso ao desmontar a página,
  // para não deixar um fetch pendente a tentar atualizar state depois
  // do componente já ter saído.
  useEffect(() => {
    return () => {
      if (discoveryRequestControllerRef.current) {
        discoveryRequestControllerRef.current.abort();
      }
    };
  }, []);

  const handleMapMoved = useCallback((center: MapCoordinates) => {
    pendingMapCenterRef.current = center;
    setShowSearchThisArea(true);
  }, []);

  const handleSearchThisArea = useCallback(() => {
    // Após pesquisar esta área, a próxima pesquisa automática (por filtro
    // ou GPS) deve usar a posição do cliente, não o centro do mapa.
    // A ref já tem o valor correcto para este pedido; limpá-la agora
    // impede que pesquisas automáticas futuras fiquem "presas" nesta
    // área manualmente escolhida.
    loadDiscoveryProviders();
    pendingMapCenterRef.current = null;
  }, [loadDiscoveryProviders]);

  const handleConverse = useCallback(async (providerId: string) => {
    setConversingProviderId(providerId);
    try {
      const { room } = await chatApi.createOrGetRoom({ participantId: providerId });
      router.push(`/chat/${room.id}`);
    } catch {
      router.push('/chat');
    } finally {
      setConversingProviderId(null);
    }
  }, [router]);

  const visibleProviders = providers.filter((provider) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      provider.fullName.toLowerCase().includes(query) ||
      (provider.category?.toLowerCase().includes(query) ?? false) ||
      (provider.district?.toLowerCase().includes(query) ?? false)
    );
  });

  if (checkingActiveService) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 size={28} style={{ color: '#0E7A5F', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  if (activeService) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Acompanhamento do serviço</h1>
            <p className={styles.subtitle}>
              {getActiveServicePhaseLabel(activeService.status)} · {activeService.title}
            </p>
          </div>
        </div>
        <div className={styles.mapWrapper}>
          <ServiceMap
            mode="active-service"
            clientCoordinates={clientCoordinates}
            activeService={activeService}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.page}
      style={{ marginBottom: 'calc(-60px - env(safe-area-inset-bottom, 0px))' }}
    >
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Encontrar <span className={styles.titleAccent}>prestadores</span></h1>
          <p className={styles.subtitle}>Descobre profissionais disponíveis perto de ti</p>
        </div>
        <div className={styles.viewToggle}>
                <button
                  className={`${styles.viewToggleButton} ${viewMode === 'map' ? styles.viewToggleButtonActive : ''}`}
                  onClick={() => setViewMode('map')}
                >
                  Mapa
                </button>
                <button
                  className={`${styles.viewToggleButton} ${viewMode === 'list' ? styles.viewToggleButtonActive : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  Lista
                </button>
              </div>
            </div>

            {locationState === 'denied' && (
              <div className={styles.locationDeniedMessage}>
                Não foi possível obter a tua localização. Continua a ver todos os prestadores disponíveis, sem ordenação por proximidade.
              </div>
            )}

            {locationState === 'unsupported' && (
              <div className={styles.locationDeniedMessage}>
                O teu navegador não suporta geolocalização. Continua a ver todos os prestadores disponíveis.
              </div>
            )}

            {viewMode === 'map' ? (
              <div className={styles.mapWrapper}>
                <ServiceMap
                  mode="discovery"
                  discoveryProviders={visibleProviders}
                  clientCoordinates={clientCoordinates}
                  selectedProvider={selectedProvider}
                  onProviderSelect={(provider) =>
                    setSelectedProvider((current) => (current?.id === provider.id ? null : provider))
                  }
                  onConverse={handleConverse}
                  isConversing={conversingProviderId != null}
                  onMapMoved={handleMapMoved}
                  showSearchThisArea={showSearchThisArea}
                  onSearchThisArea={handleSearchThisArea}
                >
                  <div className={styles.floatingSearchBar}>
                    <div className={styles.searchInputWrapper}>
                      <Search size={15} className={styles.searchIcon} />
                      <input
                        className={styles.searchInput}
                        placeholder="Prestador, categoria ou profissão"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                      />
                    </div>

                    <button
                      className={`${styles.filterToggleButton} ${showFilters ? styles.filterToggleButtonActive : ''}`}
                      onClick={() => setShowFilters((value) => !value)}
                      aria-label="Filtros"
                    >
                      <Filter size={16} />
                    </button>
                  </div>

                  <div className={styles.floatingCategoryScroll}>
                    {CATEGORIES.map((item) => (
                      <button
                        key={item}
                        className={`${styles.categoryChip} ${category === item ? styles.categoryChipActive : ''}`}
                        onClick={() => setCategory(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  {showFilters && (
                    <div className={styles.floatingFilterPanel}>
                      <div className={styles.filterGroup}>
                        <span className={styles.filterGroupTitle}>Estado</span>
                        <div className={styles.filterOptionRow}>
                          {(['all', 'online', 'offline'] as StatusFilter[]).map((option) => (
                            <button
                              key={option}
                              className={`${styles.filterChip} ${status === option ? styles.filterChipActive : ''}`}
                              onClick={() => setStatus(option)}
                            >
                              {option === 'all' ? 'Todos' : option === 'online' ? 'Online' : 'Offline'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={styles.filterGroup}>
                        <span className={styles.filterGroupTitle}>Raio de pesquisa</span>
                        <div className={styles.filterOptionRow}>
                          {RADIUS_OPTIONS.map((option) => (
                            <button
                              key={option}
                              className={`${styles.filterChip} ${radiusKm === option ? styles.filterChipActive : ''}`}
                              onClick={() => setRadiusKm(option)}
                            >
                              {option} km
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={styles.filterGroup}>
                        <span className={styles.filterGroupTitle}>Disponibilidade</span>
                        <div className={styles.filterOptionRow}>
                          <label className={styles.availabilityToggleRow}>
                            <span>Só disponíveis</span>
                            <button
                              className={`${styles.toggleSwitch} ${availableOnly ? styles.toggleSwitchOn : ''}`}
                              onClick={() => setAvailableOnly((value) => !value)}
                              aria-pressed={availableOnly}
                            >
                              <span className={styles.toggleSwitchKnob} />
                            </button>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {locationState !== 'granted' && (
                    <div className={styles.floatingActivateLocation}>
                      <button
                        className={styles.activateLocationButton}
                        onClick={requestClientLocation}
                        disabled={locationState === 'requesting'}
                      >
                        {locationState === 'requesting'
                          ? <><Loader2 size={15} style={{ animation: 'spin 0.9s linear infinite' }} /> A obter localização</>
                          : <><MapPin size={15} /> Ativar localização</>}
                      </button>
                    </div>
                  )}
                </ServiceMap>
              </div>
            ) : (
              <div className={styles.listWrapper}>
                {loadingProviders ? (
                  <div className={styles.emptyState}>
                    <Loader2 size={28} style={{ animation: 'spin 0.9s linear infinite' }} />
                    <span className={styles.emptyStateTitle}>A carregar prestadores</span>
                  </div>
                ) : providersError ? (
                  <div className={styles.emptyState}>
                    <AlertCircle size={28} />
                    <span className={styles.emptyStateTitle}>{providersError}</span>
                  </div>
                ) : visibleProviders.length === 0 ? (
                  <div className={styles.emptyState}>
                    <MapPin size={28} />
                    <span className={styles.emptyStateTitle}>Nenhum prestador encontrado</span>
                  </div>
                ) : (
                  visibleProviders.map((provider) => {
                    const withDistance = provider as ProviderWithDistance;
                    return (
                      <div
                        key={provider.id}
                        className={styles.listCard}
                        onClick={() => {
                          setSelectedProvider(provider);
                          setViewMode('map');
                        }}
                      >
                        <div className={styles.listCardAvatar}>
                          {provider.avatarUrl
                            ? <img src={provider.avatarUrl} alt={provider.fullName} />
                            : getInitials(provider.fullName)}
                        </div>
                        <div className={styles.listCardInfo}>
                          <div className={styles.listCardName}>{provider.fullName}</div>
                          <div className={styles.listCardMeta}>
                            {provider.category ?? 'Sem categoria'}
                            {provider.district ? ` · ${provider.district}` : ''}
                          </div>
                        </div>
                        {withDistance.distanceKm != null && (
                          <div className={styles.listCardDistance}>
                            {formatDistance(withDistance.distanceKm)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
    </div>
  );
}
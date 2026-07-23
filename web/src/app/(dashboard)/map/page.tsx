"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, MapPin, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
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
import styles from './map-page.module.css';

const CATEGORIES = [
  'Todos', 'Limpeza', 'Climatização', 'Canalização',
  'Eletricista', 'TI & Redes', 'Jardinagem', 'Mudanças',
  'Beleza', 'Automóvel', 'Pintura', 'Construção', 'Segurança',
];

const RADIUS_OPTIONS = [2, 5, 10, 20];

// Esta página tem 3 pontos de retorno diferentes (loading / serviço
// activo / descoberta), por isso as classes .hw/.hm/.hi — que definem
// a estrutura sidebar+navbar+conteúdo — ficam aqui como uma string
// partilhada, em vez de repetidas 3 vezes. Sem isto, a página não tinha
// NENHUMA fonte destas regras (só a home/page.tsx as define), por isso
// o conteúdo (incluindo o mapa) renderizava a partir de x:0, por baixo
// do sidebar fixo, em vez de começar depois dele.
const pageLayoutStyles = `
  .hw{display:flex;min-height:100vh;background:#F8FAFC}
  .hm{flex:1;margin-left:240px;display:flex;flex-direction:column;min-width:0;overflow-x:hidden}
  .hi{flex:1;display:flex;flex-direction:column;min-height:0}

  @media(max-width:1024px){
    .hm{margin-left:0}
    .hi{padding-top:64px}
  }
`;

type ViewMode = 'map' | 'list';
type LocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase();
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

  const [pendingMapCenter, setPendingMapCenter] = useState<MapCoordinates | null>(null);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);

  const [conversingProviderId, setConversingProviderId] = useState<string | null>(null);

  const activePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const discoveryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setLocationState('unsupported');
      return;
    }

    setLocationState('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setClientCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationState('granted');
      },
      () => {
        setLocationState('denied');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  const loadDiscoveryProviders = useCallback(async () => {
    if (activeService) return;

    setLoadingProviders(true);
    setProvidersError(null);

    try {
      let data: (ProviderLocation | ProviderWithDistance)[];

      const searchOrigin = pendingMapCenter ?? clientCoordinates;

      if (searchOrigin) {
        data = await fetchNearbyProviders({
          latitude: searchOrigin.latitude,
          longitude: searchOrigin.longitude,
          radiusKm,
          category: category !== 'Todos' ? category : undefined,
          status: status !== 'all' ? status : undefined,
          availableOnly,
        });
      } else {
        let raw = await fetchProviders(category !== 'Todos' ? category : undefined);
        if (status === 'online') raw = raw.filter((p) => p.isOnline);
        if (status === 'offline') raw = raw.filter((p) => !p.isOnline);
        if (availableOnly) raw = raw.filter((p) => p.isOnline);
        data = raw.filter((p) => p.latitude != null && p.longitude != null);
      }

      setProviders(data);
      setShowSearchThisArea(false);
    } catch (error: any) {
      setProvidersError(error.message ?? 'Erro ao carregar prestadores.');
    } finally {
      setLoadingProviders(false);
    }
  }, [activeService, category, status, availableOnly, radiusKm, clientCoordinates, pendingMapCenter]);

  useEffect(() => {
    loadDiscoveryProviders();
  }, [category, status, availableOnly, radiusKm, clientCoordinates]);

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

  const handleMapMoved = useCallback((center: MapCoordinates) => {
    setPendingMapCenter(center);
    setShowSearchThisArea(true);
  }, []);

  const handleSearchThisArea = useCallback(() => {
    loadDiscoveryProviders();
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
      <div className="hw">
        <style>{pageLayoutStyles}</style>
        <Sidebar />
        <div className="hm">
          <Navbar />
          <main className="hi" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={28} style={{ color: '#0E7A5F', animation: 'spin 0.9s linear infinite' }} />
          </main>
        </div>
      </div>
    );
  }

  if (activeService) {
    return (
      <div className="hw">
        <style>{pageLayoutStyles}</style>
        <Sidebar />
        <div className="hm">
          <Navbar />
          <main className="hi">
            <div className={styles.page}>
              <div className={styles.header}>
                <div>
                  <h1 className={styles.title}>Acompanhamento do serviço</h1>
                  <p className={styles.subtitle}>{activeService.title}</p>
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
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="hw">
      <style>{pageLayoutStyles}</style>
      <Sidebar />
      <div className="hm">
        <Navbar />
        <main className="hi">
          <div className={styles.page}>
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
        </main>
      </div>
    </div>
  );
}
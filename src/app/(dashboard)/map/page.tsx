"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  MapPin, Search, Filter, Navigation, X,
  Loader2, CheckCircle, AlertCircle, Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import {
  fetchNearbyProviders,
  fetchProviders,
  type ProviderLocation,
  type ProviderWithDistance,
  type StatusFilter,
} from "@/lib/geolocation.api";
import { chatApi } from "@/lib/chat.api";

const CATEGORIES = [
  "Todos","Limpeza","Climatização","Canalização",
  "Eletricista","TI & Redes","Jardinagem","Mudanças",
  "Beleza","Automóvel","Pintura","Construção","Segurança",
];

type SortMode = "nearest" | "default";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function distanceLabel(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export default function MapPage() {
  const router = useRouter();

  // ── Filters ───────────────────────────────────────────────────────────
  const [status, setStatus]         = useState<StatusFilter>("all");
  const [category, setCategory]     = useState("Todos");
  const [sortBy, setSortBy]         = useState<SortMode>("default");
  const [search, setSearch]         = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Providers data ────────────────────────────────────────────────────
  const [providers, setProviders]   = useState<(ProviderLocation | ProviderWithDistance)[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [selected, setSelected]     = useState<ProviderLocation | ProviderWithDistance | null>(null);

  // ── Client location ───────────────────────────────────────────────────
  const [clientLat, setClientLat]   = useState<number | null>(null);
  const [clientLon, setClientLon]   = useState<number | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError]     = useState(false);
  const [locActive, setLocActive]   = useState(false);  // user clicked button

  // ── Chat ──────────────────────────────────────────────────────────────
  const [chatLoadingId, setChatLoadingId] = useState<string | null>(null);

  const fetchRef = useRef(0);

  // ── Location activation — triggered by button, not auto ───────────────
  const handleActivateLocation = useCallback(() => {
    if (locLoading || locActive) return;
    if (!navigator.geolocation) {
      setLocError(true);
      return;
    }
    setLocLoading(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setClientLat(pos.coords.latitude);
        setClientLon(pos.coords.longitude);
        setLocLoading(false);
        setLocActive(true);
      },
      () => {
        setLocError(true);
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }, [locLoading, locActive]);

  // ── Fetch providers ───────────────────────────────────────────────────
  const loadProviders = useCallback(async () => {
    const id = ++fetchRef.current;
    setLoading(true);
    setError(null);
    try {
      let data: (ProviderLocation | ProviderWithDistance)[];

      if (sortBy === "nearest" && clientLat != null && clientLon != null) {
        data = await fetchNearbyProviders({
          latitude:  clientLat,
          longitude: clientLon,
          radiusKm:  100,
          category:  category !== "Todos" ? category : undefined,
          status:    status !== "all" ? status : undefined,
        });
      } else {
        let raw = await fetchProviders(category !== "Todos" ? category : undefined);
        if (status === "online")  raw = raw.filter(p => p.isOnline);
        if (status === "offline") raw = raw.filter(p => !p.isOnline);
        data = raw.filter(p => p.latitude != null && p.longitude != null);
      }

      if (id !== fetchRef.current) return;
      setProviders(data);
    } catch (e: any) {
      if (id !== fetchRef.current) return;
      setError(e.message ?? "Erro ao carregar prestadores.");
    } finally {
      if (id === fetchRef.current) setLoading(false);
    }
  }, [status, category, sortBy, clientLat, clientLon]);

  useEffect(() => { loadProviders(); }, [loadProviders]);

  // ── Client-side search ────────────────────────────────────────────────
  const visible = providers.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      (p.category?.toLowerCase().includes(q) ?? false) ||
      (p.district?.toLowerCase().includes(q) ?? false)
    );
  });

  const onlineCount  = providers.filter(p => p.isOnline).length;
  const offlineCount = providers.filter(p => !p.isOnline).length;

  // ── Conversar: create or reuse chat room ──────────────────────────────
  const handleConversar = async (providerId: string) => {
    if (chatLoadingId) return;
    setChatLoadingId(providerId);
    try {
      const { room } = await chatApi.createOrGetRoom({ participantId: providerId });
      router.push(`/chat/${room.id}`);
    } catch {
      router.push("/chat");
    } finally {
      setChatLoadingId(null);
    }
  };

  return (
    <>
      <style>{`
        .map-page { display: flex; min-height: 100vh; background: #0d1117; }
        .map-main {
          flex: 1; margin-left: 240px; display: flex;
          flex-direction: column; min-height: 100vh; overflow-x: hidden;
        }
        @media (max-width: 1024px) { .map-main { margin-left: 0; } }
        .map-content {
          padding: 24px; flex: 1; display: flex;
          flex-direction: column; gap: 20px;
        }
        @media (max-width: 640px) { .map-content { padding: 16px; gap: 16px; } }

        /* Header */
        .map-header { display: flex; flex-direction: column; gap: 4px; }
        .map-header-title { font-size: 22px; font-weight: 700; color: #e8eaf0; }
        .map-header-sub { font-size: 13px; color: #6b7585; }

        /* Toolbar */
        .map-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .map-search { flex: 1; min-width: 180px; position: relative; }
        .map-search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); pointer-events: none;
        }
        .map-search input {
          width: 100%; padding: 10px 12px 10px 36px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px; color: #e8eaf0; font-size: 13px; outline: none;
          transition: border-color 0.2s;
        }
        .map-search input:focus { border-color: rgba(239,159,39,0.4); }
        .map-search input::placeholder { color: #4a5568; }
        .map-filter-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 10px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          color: #8a9ab0; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .map-filter-btn:hover, .map-filter-btn--active {
          background: rgba(239,159,39,0.1);
          border-color: rgba(239,159,39,0.35); color: #EF9F27;
        }

        /* Location activation button */
        .map-loc-activate {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 12px; cursor: pointer;
          background: rgba(239,159,39,0.08);
          border: 1px solid rgba(239,159,39,0.25);
          color: #EF9F27; font-size: 13px; font-weight: 600;
          transition: all 0.2s; width: fit-content;
        }
        .map-loc-activate:hover:not(:disabled) {
          background: rgba(239,159,39,0.15);
          border-color: rgba(239,159,39,0.45);
        }
        .map-loc-activate:disabled { opacity: 0.6; cursor: not-allowed; }
        .map-loc-activate--active {
          background: rgba(34,197,94,0.08);
          border-color: rgba(34,197,94,0.3); color: #22c55e;
          cursor: default;
        }
        .map-loc-activate--error {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.3); color: #ef4444;
        }

        /* Filter panel */
        .map-filters-panel {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 18px;
        }
        @media (max-width: 640px) { .map-filters-panel { grid-template-columns: 1fr; } }
        .map-filter-group { display: flex; flex-direction: column; gap: 8px; }
        .map-filter-group-title {
          font-size: 11px; font-weight: 600; color: #4a5568;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .map-filter-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .map-chip {
          padding: 5px 11px; border-radius: 20px; font-size: 12px; font-weight: 500;
          cursor: pointer; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); color: #8a9ab0;
          transition: all 0.18s;
        }
        .map-chip:hover { border-color: rgba(239,159,39,0.3); color: #c0c8d8; }
        .map-chip--active {
          background: rgba(239,159,39,0.15);
          border-color: rgba(239,159,39,0.5); color: #EF9F27;
        }
        .map-chip--online.map-chip--active {
          background: rgba(34,197,94,0.12);
          border-color: rgba(34,197,94,0.4); color: #22c55e;
        }
        .map-chip--offline.map-chip--active {
          background: rgba(107,114,128,0.18);
          border-color: rgba(107,114,128,0.4); color: #9ca3af;
        }

        /* Stats */
        .map-stats { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .map-stat-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7585; }
        .map-stat-dot { width: 7px; height: 7px; border-radius: 50%; }
        .map-stat-dot--online  { background: #22c55e; }
        .map-stat-dot--offline { background: #4a5568; }
        .map-stat-count { font-weight: 600; color: #a0aec0; }
        .map-refresh-btn {
          margin-left: auto; display: flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 8px; font-size: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: #6b7585; cursor: pointer; transition: all 0.2s;
        }
        .map-refresh-btn:hover { color: #EF9F27; border-color: rgba(239,159,39,0.3); }

        /* Category scroll */
        .map-cat-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .map-cat-scroll::-webkit-scrollbar { display: none; }

        /* Provider grid */
        .map-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
        }
        @media (max-width: 480px) { .map-grid { grid-template-columns: 1fr; } }

        /* Provider card */
        .map-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 16px; cursor: pointer;
          transition: all 0.22s; position: relative;
        }
        .map-card:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(239,159,39,0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .map-card--selected {
          border-color: rgba(239,159,39,0.5);
          background: rgba(239,159,39,0.06);
        }
        .map-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .map-card-avatar {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: #0d1117;
          background: linear-gradient(135deg, #EF9F27, #e07b10);
          position: relative;
        }
        .map-card-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .map-card-status-dot {
          position: absolute; bottom: 1px; right: 1px;
          width: 10px; height: 10px; border-radius: 50%;
          border: 2px solid #0d1117;
        }
        .map-card-status-dot--online  { background: #22c55e; }
        .map-card-status-dot--offline { background: #4a5568; }
        .map-card-info { flex: 1; min-width: 0; }
        .map-card-name {
          font-size: 14px; font-weight: 600; color: #e8eaf0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .map-card-category { font-size: 11px; color: #EF9F27; font-weight: 500; margin-top: 2px; }
        .map-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 6px;
        }
        .map-card-location { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #6b7585; }
        .map-card-distance {
          font-size: 11px; font-weight: 600; color: #EF9F27;
          background: rgba(239,159,39,0.1); padding: 3px 8px; border-radius: 20px;
        }
        .map-card-eta { font-size: 10px; color: #6b7585; }
        .map-card-badge { font-size: 10px; padding: 3px 8px; border-radius: 20px; font-weight: 500; }
        .map-card-badge--online  { background: rgba(34,197,94,0.12); color: #22c55e; }
        .map-card-badge--offline { background: rgba(107,114,128,0.12); color: #6b7280; }

        /* Detail sheet */
        .map-detail {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
          width: calc(100% - 48px); max-width: 420px;
          background: #161b24; border: 1px solid rgba(239,159,39,0.3);
          border-radius: 18px; padding: 20px; z-index: 100;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          animation: detail-in 0.28s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes detail-in {
          from { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        .map-detail-close {
          position: absolute; top: 14px; right: 14px;
          cursor: pointer; color: #6b7585; transition: color 0.2s;
          background: none; border: none;
        }
        .map-detail-close:hover { color: #e8eaf0; }
        .map-detail-name { font-size: 17px; font-weight: 700; color: #e8eaf0; margin-bottom: 4px; }
        .map-detail-cat { font-size: 12px; color: #EF9F27; font-weight: 500; margin-bottom: 12px; }
        .map-detail-bio { font-size: 13px; color: #8a9ab0; margin-bottom: 14px; line-height: 1.5; }
        .map-detail-stats { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
        .map-detail-stat {
          flex: 1; min-width: 80px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px; padding: 10px 12px; text-align: center;
        }
        .map-detail-stat-val { font-size: 15px; font-weight: 700; color: #EF9F27; }
        .map-detail-stat-lbl { font-size: 10px; color: #6b7585; margin-top: 2px; }

        /* Conversar button */
        .map-conversar-btn {
          width: 100%; padding: 13px; border-radius: 12px;
          background: linear-gradient(135deg, #1D9E75, #158f65);
          color: white; font-size: 14px; font-weight: 700;
          cursor: pointer; border: none; transition: opacity 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .map-conversar-btn:hover:not(:disabled) { opacity: 0.9; }
        .map-conversar-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Empty / error / loading */
        .map-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 12px; padding: 60px 24px; text-align: center;
        }
        .map-empty-icon { color: #3a4255; }
        .map-empty-title { font-size: 16px; font-weight: 600; color: #6b7585; }
        .map-empty-sub { font-size: 13px; color: #4a5568; max-width: 280px; }

        /* Keyframes */
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>

      <div className="map-page">
        <Sidebar/>
        <div className="map-main">
          <Navbar/>
          <div className="map-content">

            {/* Header */}
            <div className="map-header">
              <h1 className="map-header-title">Mapa de Prestadores</h1>
              <p className="map-header-sub">Encontra prestadores de serviço perto de ti</p>
            </div>

            {/* Location activation button */}
            {!locActive && !locLoading && !locError && (
              <button className="map-loc-activate" onClick={handleActivateLocation}>
                <MapPin size={16}/>
                Ativar Localização — ver prestadores perto de ti
              </button>
            )}
            {locLoading && (
              <button className="map-loc-activate" disabled>
                <Loader2 size={16} className="animate-spin"/>
                A obter localização…
              </button>
            )}
            {locError && (
              <button className="map-loc-activate map-loc-activate--error" onClick={handleActivateLocation}>
                <AlertCircle size={16}/>
                Localização negada — Clica para tentar novamente
              </button>
            )}
            {locActive && clientLat != null && (
              <button className="map-loc-activate map-loc-activate--active" disabled>
                <CheckCircle size={16}/>
                Localização activa — podes ordenar por distância
              </button>
            )}

            {/* Toolbar */}
            <div className="map-toolbar">
              <div className="map-search">
                <span className="map-search-icon"><Search size={15} color="#4a5568"/></span>
                <input
                  type="text"
                  placeholder="Pesquisar prestador, categoria…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button
                className={`map-filter-btn${showFilters ? " map-filter-btn--active" : ""}`}
                onClick={() => setShowFilters(v => !v)}
              >
                <Filter size={14}/> Filtros
              </button>
            </div>

            {/* Category pills */}
            <div className="map-cat-scroll">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`map-chip${category === cat ? " map-chip--active" : ""}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div className="map-filters-panel">
                <div className="map-filter-group">
                  <div className="map-filter-group-title">Estado</div>
                  <div className="map-filter-chips">
                    {(["all","online","offline"] as StatusFilter[]).map(s => (
                      <button
                        key={s}
                        className={`map-chip map-chip--${s}${status === s ? " map-chip--active" : ""}`}
                        onClick={() => setStatus(s)}
                      >
                        {s === "all" ? "Todos" : s === "online" ? "Online" : "Offline"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="map-filter-group">
                  <div className="map-filter-group-title">Ordenar</div>
                  <div className="map-filter-chips">
                    <button
                      className={`map-chip${sortBy === "default" ? " map-chip--active" : ""}`}
                      onClick={() => setSortBy("default")}
                    >
                      Padrão
                    </button>
                    <button
                      className={`map-chip${sortBy === "nearest" ? " map-chip--active" : ""}`}
                      onClick={() => setSortBy("nearest")}
                      disabled={clientLat == null}
                      title={clientLat == null ? "Activa a localização primeiro" : ""}
                    >
                      <Navigation size={11} style={{ marginRight:4 }}/>
                      Mais próximo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats bar */}
            <div className="map-stats">
              <div className="map-stat-item">
                <span className="map-stat-dot map-stat-dot--online"/>
                <span className="map-stat-count">{onlineCount}</span> online
              </div>
              <div className="map-stat-item">
                <span className="map-stat-dot map-stat-dot--offline"/>
                <span className="map-stat-count">{offlineCount}</span> offline
              </div>
              {visible.length !== providers.length && (
                <div className="map-stat-item">
                  · mostrando <span className="map-stat-count">{visible.length}</span>
                </div>
              )}
              <button className="map-refresh-btn" onClick={loadProviders} disabled={loading}>
                <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>
                Atualizar
              </button>
            </div>

            {/* Provider grid */}
            {loading ? (
              <div className="map-empty">
                <Loader2 size={36} className="map-empty-icon animate-spin"/>
                <p className="map-empty-title">A carregar prestadores…</p>
              </div>
            ) : error ? (
              <div className="map-empty">
                <AlertCircle size={36} className="map-empty-icon"/>
                <p className="map-empty-title">Erro ao carregar</p>
                <p className="map-empty-sub">{error}</p>
                <button className="map-filter-btn" onClick={loadProviders}>
                  <RefreshCw size={13}/> Tentar novamente
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="map-empty">
                <MapPin size={40} className="map-empty-icon"/>
                <p className="map-empty-title">Nenhum prestador encontrado</p>
                <p className="map-empty-sub">
                  {category !== "Todos"
                    ? `Não há prestadores de "${category}" com localização activa.`
                    : "Nenhum prestador corresponde aos filtros seleccionados."}
                </p>
              </div>
            ) : (
              <div className="map-grid">
                {visible.map(p => {
                  const withDist  = p as ProviderWithDistance;
                  const hasDist   = withDist.distanceKm != null;
                  const isSelected = selected?.id === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`map-card${isSelected ? " map-card--selected" : ""}`}
                      onClick={() => setSelected(isSelected ? null : p)}
                    >
                      <div className="map-card-top">
                        <div className="map-card-avatar">
                          {p.avatarUrl
                            ? <img src={p.avatarUrl} alt={p.fullName}/>
                            : getInitials(p.fullName)
                          }
                          <span className={`map-card-status-dot map-card-status-dot--${p.isOnline ? "online" : "offline"}`}/>
                        </div>
                        <div className="map-card-info">
                          <div className="map-card-name">{p.fullName}</div>
                          {p.category && <div className="map-card-category">{p.category}</div>}
                        </div>
                        <span className={`map-card-badge map-card-badge--${p.isOnline ? "online" : "offline"}`}>
                          {p.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                      <div className="map-card-footer">
                        <div className="map-card-location">
                          <MapPin size={11}/>
                          {p.district ?? "Localização activa"}
                        </div>
                        {hasDist && (
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:1 }}>
                            <span className="map-card-distance">{distanceLabel(withDist.distanceKm)}</span>
                            {withDist.etaMinutes > 0 && (
                              <span className="map-card-eta">~{withDist.etaMinutes} min</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="map-detail">
          <button className="map-detail-close" onClick={() => setSelected(null)}>
            <X size={18}/>
          </button>

          <div className="map-detail-name">{selected.fullName}</div>
          {selected.category && <div className="map-detail-cat">{selected.category}</div>}
          {selected.bio && <p className="map-detail-bio">{selected.bio}</p>}

          <div className="map-detail-stats">
            <div className="map-detail-stat">
              <div className="map-detail-stat-val" style={{ color: selected.isOnline ? "#22c55e" : "#6b7280" }}>
                {selected.isOnline ? "Online" : "Offline"}
              </div>
              <div className="map-detail-stat-lbl">Estado</div>
            </div>

            {(selected as ProviderWithDistance).distanceKm != null && (
              <div className="map-detail-stat">
                <div className="map-detail-stat-val">{distanceLabel((selected as ProviderWithDistance).distanceKm)}</div>
                <div className="map-detail-stat-lbl">Distância</div>
              </div>
            )}

            {(selected as ProviderWithDistance).etaMinutes > 0 && (
              <div className="map-detail-stat">
                <div className="map-detail-stat-val">~{(selected as ProviderWithDistance).etaMinutes} min</div>
                <div className="map-detail-stat-lbl">Chegada</div>
              </div>
            )}

            {selected.district && (
              <div className="map-detail-stat">
                <div className="map-detail-stat-val" style={{ fontSize:12 }}>{selected.district}</div>
                <div className="map-detail-stat-lbl">Distrito</div>
              </div>
            )}
          </div>

          {/* Conversar button — creates/reuses chat room */}
          <button
            className="map-conversar-btn"
            disabled={!!chatLoadingId}
            onClick={() => handleConversar(selected.id)}
          >
            {chatLoadingId === selected.id ? (
              <><Loader2 size={16} className="animate-spin"/> A conectar…</>
            ) : (
              <>💬 Conversar</>
            )}
          </button>
        </div>
      )}
    </>
  );
}
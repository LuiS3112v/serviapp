"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, MapPin, Loader2, Search, X, ChevronRight } from "lucide-react";
import { chatApi } from "@/lib/chat.api";
import { notificationsApi } from "@/lib/notifications.api";
import { activateLocation, updateLocationSharing, type ProviderLocation } from "@/lib/geolocation.api";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth.api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const CAT_EMOJI: Record<string, string> = {
  "Limpeza":"🧹","Climatização":"❄️","Canalização":"🔧","Eletricista":"⚡",
  "TI & Redes":"💻","Jardinagem":"🌿","Mudanças":"📦","Beleza":"💆",
  "Automóvel":"🚗","Pintura":"🎨","Construção":"🏗️","Segurança":"🔐",
};

// idle: partilha desligada
// loading: a pedir permissão de GPS / a confirmar com o backend
// active: partilha ligada e a emitir posição periodicamente
// denied: permissão de GPS negada pelo browser
type LocationState = "idle" | "loading" | "active" | "denied";

// Reaproveita a mesma lógica de distância e cadência do
// useProviderLocationBroadcast: 15m de movimento significativo,
// 6s de intervalo em movimento, 30s parado. Mantida aqui em vez de
// importada porque o navbar precisa de controlar o próprio watchId
// dentro do ciclo de vida do botão, e não deve depender de um hook
// externo montado noutra página.
const MOVEMENT_INTERVAL_MS = 6000;
const IDLE_INTERVAL_MS = 30000;
const SIGNIFICANT_MOVEMENT_METERS = 15;

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ProviderNavbar() {
  const router   = useRouter();
  const { user } = useAuth();

  const [unreadChat, setUnreadChat]   = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);

  const [query, setQuery]             = useState("");
  const [results, setResults]         = useState<any[]>([]);
  const [searching, setSearching]     = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [locState, setLocState] = useState<LocationState>("idle");
  const [mounted, setMounted]   = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    async function checkLocation() {
      try {
        const me = await api.get<ProviderLocation>("/users/me");
        if (me.locationSharingEnabled) {
          setLocState("active");
        }
      } catch { /* silencioso */ }
    }
    checkLocation();

    // Garante que o watch é encerrado se o componente desmontar com a
    // partilha ainda ativa (ex: navegação para fora do painel de
    // prestador), evitando um watchPosition órfão a correr em segundo
    // plano sem nenhum estado de UI a refletir isso.
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchCounts = () => {
      chatApi.getUnread().then(d => setUnreadChat(d.count)).catch(() => {});
      notificationsApi.getUnreadCount().then(d => setUnreadNotif(d.count)).catch(() => {});
    };
    fetchCounts();
    const id = setInterval(fetchCounts, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowResults(false); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/services/available`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const all: any[] = await res.json();
        const q = query.toLowerCase();
        const filtered = all.filter(s =>
          s.title?.toLowerCase().includes(q) ||
          s.category?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.address?.toLowerCase().includes(q)
        ).slice(0, 8);
        setResults(filtered);
        setShowResults(filtered.length > 0 || query.length > 1);
      } catch { /* silencioso */ }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Inicia o watchPosition, enviando a posição inicial de imediato e
  // depois só reenviando conforme a distância percorrida desde o
  // último envio — 6s em movimento, 30s parado. A escolha de
  // watchPosition em vez de um setInterval com getCurrentPosition é
  // deliberada: o browser já otimiza a captura de GPS nativamente,
  // e aqui só decidimos QUANDO reenviar, sem forçar leituras de GPS
  // extra que o setInterval exigiria a cada tick independentemente de
  // ter havido movimento real.
  const startWatchingPosition = useCallback(() => {
    if (watchIdRef.current != null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const last = lastSentRef.current;

        const hasMovedSignificantly =
          !last || distanceMeters(last.latitude, last.longitude, latitude, longitude) > SIGNIFICANT_MOVEMENT_METERS;

        const intervalSinceLastSend = last ? Date.now() - last.timestamp : Infinity;
        const requiredInterval = hasMovedSignificantly ? MOVEMENT_INTERVAL_MS : IDLE_INTERVAL_MS;

        if (intervalSinceLastSend < requiredInterval) {
          return;
        }

        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
        }

        throttleTimerRef.current = setTimeout(() => {
          activateLocation(latitude, longitude).catch(() => {
            // Falha pontual de rede não interrompe o watch — a próxima
            // atualização de posição tenta novamente.
          });
          lastSentRef.current = { latitude, longitude, timestamp: Date.now() };
        }, 300);
      },
      () => {
        // Erro pontual do GPS depois de já estar ativo não desliga o
        // toggle — só a rejeição inicial de permissão o faz.
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );
  }, []);

  const stopWatchingPosition = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    lastSentRef.current = null;
  }, []);

  const handleToggleLocation = useCallback(async () => {
    if (locState === "loading") return;

    if (locState === "active") {
      stopWatchingPosition();
      setLocState("idle");
      updateLocationSharing(false).catch(() => {
        // Falha ao desligar no backend não deve travar a UI — o
        // watch já parou localmente, que é o efeito que importa para
        // o utilizador imediatamente.
      });
      return;
    }

    if (!navigator.geolocation) {
      alert("O teu navegador não suporta geolocalização.");
      return;
    }

    setLocState("loading");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // A ordem importa: o backend rejeita atualizações de posição
          // enquanto locationSharingEnabled estiver false, por isso a
          // partilha tem de ser ligada antes do primeiro envio de
          // posição.
          await updateLocationSharing(true);
          await activateLocation(pos.coords.latitude, pos.coords.longitude);
          lastSentRef.current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: Date.now(),
          };
          setLocState("active");
          startWatchingPosition();
        } catch {
          setLocState("idle");
        }
      },
      () => {
        setLocState("denied");
        setTimeout(() => setLocState("idle"), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [locState, startWatchingPosition, stopWatchingPosition]);

  return (
    <>
      <style>{`
        /* ── Nav container ─────────────────────────────────────────────── */
        .pnav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 24px;
          height: 64px;
          background: #080e1a;
          border-bottom: 1px solid #1a2535;
          position: sticky;
          top: 0;
          z-index: 30;
          flex-wrap: nowrap;
        }

        /* ── Search wrapper ────────────────────────────────────────────── */
        .pnav-sw {
          position: relative;
          flex: 1;
          min-width: 0;
          max-width: 480px;
        }
        .pnav-s {
          display: flex; align-items: center; gap: 10px;
          background: #0d1520; border: 1px solid #1a2535;
          border-radius: 12px; padding: 10px 16px;
          width: 100%; transition: border-color 0.2s;
        }
        .pnav-s:focus-within { border-color: #EF9F27; }
        .pnav-s input {
          background: none; border: none; outline: none;
          font-size: 14px; color: #8a9ab0;
          width: 100%; min-width: 0; font-family: inherit;
        }
        .pnav-s input::placeholder { color: #4a5a6a; }

        /* ── Search dropdown ───────────────────────────────────────────── */
        .pnav-drop {
          position: absolute; top: calc(100% + 8px); left: 0; right: 0;
          background: #131b27; border: 1px solid #1a2535;
          border-radius: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          z-index: 50; overflow: hidden; max-height: 360px; overflow-y: auto;
        }
        .pnav-result {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; cursor: pointer;
          border-bottom: 1px solid #1a2535; transition: background 0.15s;
        }
        .pnav-result:last-child { border-bottom: none; }
        .pnav-result:hover { background: #1a2535; }
        .pnav-empty { padding: 20px; text-align: center; font-size: 13px; color: #4a6a6a; }

        /* ── Right section ─────────────────────────────────────────────── */
        .pnav-right {
          display: flex; align-items: center; gap: 8px;
          flex-shrink: 0;
        }

        /* ── Location button ───────────────────────────────────────────── */
        .pnav-loc-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 20px;
          border: 1px solid rgba(239,159,39,0.3);
          background: rgba(239,159,39,0.06);
          cursor: pointer; transition: all 0.25s ease;
          white-space: nowrap; position: relative; overflow: hidden;
          flex-shrink: 0;
        }
        .pnav-loc-btn:hover:not(.pnav-loc-btn--loading) {
          background: rgba(239,159,39,0.12);
          border-color: rgba(239,159,39,0.5);
        }
        .pnav-loc-btn--loading { opacity: 0.8; cursor: wait; }
        .pnav-loc-btn--active {
          border-color: rgba(34,197,94,0.4);
          background: rgba(34,197,94,0.08);
        }
        .pnav-loc-btn--active:hover {
          background: rgba(34,197,94,0.14);
          border-color: rgba(34,197,94,0.6);
        }
        .pnav-loc-btn--denied {
          border-color: rgba(239,68,68,0.4);
          background: rgba(239,68,68,0.08);
        }

        /* ── Location label ────────────────────────────────────────────── */
        .pnav-loc-label {
          font-size: 12px; font-weight: 500; color: #8a9ab0;
          transition: color 0.25s; line-height: 1;
        }
        .pnav-loc-btn--active  .pnav-loc-label { color: #22c55e; }
        .pnav-loc-btn--denied  .pnav-loc-label { color: #ef4444; }
        .pnav-loc-btn:hover:not(.pnav-loc-btn--active):not(.pnav-loc-btn--denied):not(.pnav-loc-btn--loading) .pnav-loc-label {
          color: #EF9F27;
        }

        @keyframes pnav-pin-pulse {
          0%   { filter: drop-shadow(0 0 0px #22c55e);   }
          50%  { filter: drop-shadow(0 0 5px #22c55e);   }
          100% { filter: drop-shadow(0 0 0px #22c55e);   }
        }
        .pnav-pin-active {
          animation: pnav-pin-pulse 2s ease-in-out infinite;
          color: #22c55e;
        }

        @keyframes pnav-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          70%  { transform: scale(1.8); opacity: 0;   }
          100% { transform: scale(1.8); opacity: 0;   }
        }
        .pnav-pulse-ring {
          position: absolute; width: 8px; height: 8px;
          border-radius: 50%; background: #22c55e; left: 12px;
          animation: pnav-pulse 1.8s ease-out infinite;
          pointer-events: none;
        }

        /* ── Chat icon ─────────────────────────────────────────────────── */
        .pnav-ib { position: relative; cursor: pointer; flex-shrink: 0; }
        .pnav-ii {
          width: 40px; height: 40px; border-radius: 12px;
          background: #0d1520; border: 1px solid #1a2535;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .pnav-ii:hover { border-color: #EF9F27; }
        .pnav-badge {
          position: absolute; top: -4px; right: -4px;
          min-width: 18px; height: 18px; border-radius: 99px;
          background: #EF9F27; border: 2px solid #080e1a;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700; color: #0d1117; padding: 0 4px;
        }

        /* ── Bell ──────────────────────────────────────────────────────── */
        .pnav-bell {
          position: relative; width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 12px; background: #0d1520; border: 1px solid #1a2535;
          cursor: pointer; transition: all 0.15s; flex-shrink: 0;
        }
        .pnav-bell:hover { border-color: #EF9F27; }
        .pnav-bell-badge {
          position: absolute; top: 6px; right: 6px;
          width: 7px; height: 7px; border-radius: 50%;
          background: #EF9F27; border: 1.5px solid #080e1a;
        }

        /* ── Avatar ────────────────────────────────────────────────────── */
        .pnav-avatar {
          width: 40px; height: 40px; border-radius: 12px;
          background: linear-gradient(135deg, #EF9F27, #e07b10);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: #0d1117;
          cursor: pointer; flex-shrink: 0;
          border: 1px solid rgba(239,159,39,0.4);
          transition: border-color 0.2s;
        }
        .pnav-avatar:hover { border-color: #EF9F27; }

        /* ── Spinner ───────────────────────────────────────────────────── */
        @keyframes pnav-spin { to { transform: rotate(360deg); } }
        .pnav-spin { animation: pnav-spin 0.7s linear infinite; }

        @media (max-width: 1024px) {
          .pnav { padding: 0 16px 0 64px; }
        }
        @media (max-width: 860px) {
          .pnav-sw { max-width: 340px; }
          .pnav-loc-label { font-size: 11px; }
          .pnav-loc-btn  { padding: 7px 10px; }
        }
        @media (max-width: 768px) {
          .pnav-sw { max-width: 260px; }
          .pnav-loc-label { font-size: 10px; }
          .pnav-loc-btn  { padding: 6px 8px; gap: 4px; }
          .pnav-right    { gap: 6px; }
        }
        @media (max-width: 640px) {
          .pnav { padding: 0 12px 0 60px; gap: 8px; }
          .pnav-sw { max-width: none; }
          .pnav-loc-label { display: none; }
          .pnav-loc-btn { padding: 8px; border-radius: 12px; gap: 0; }
          .pnav-right { gap: 6px; }
        }
        @media (max-width: 420px) {
          .pnav {
            height: auto; min-height: 64px; flex-wrap: wrap;
            align-content: center; padding: 8px 12px 8px 60px;
            gap: 6px; row-gap: 8px;
          }
          .pnav-sw { order: 1; flex: 0 0 100%; width: 100%; max-width: 100%; }
          .pnav-right { order: 2; width: 100%; justify-content: flex-end; }
          .pnav-ii, .pnav-bell, .pnav-avatar { width: 36px; height: 36px; }
        }
        @media (max-width: 320px) {
          .pnav { padding: 8px 8px 8px 52px; }
          .pnav-right { gap: 4px; }
          .pnav-ii, .pnav-bell, .pnav-avatar { width: 32px; height: 32px; border-radius: 10px; }
          .pnav-loc-btn { padding: 6px; }
        }
      `}</style>

      <nav className="pnav">

        {/* ── Search bar ─────────────────────────────────────────────────── */}
        <div className="pnav-sw" ref={searchRef}>
          <div className="pnav-s">
            {searching
              ? <Loader2 size={15} style={{ color:"#7a6040", flexShrink:0 }} className="pnav-spin"/>
              : <Search size={15} style={{ color:"#7a6040", flexShrink:0 }}/>
            }
            <input
              placeholder="Pesquise pedidos de clientes..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); setShowResults(false); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#4a5a6a", display:"flex", flexShrink:0 }}
              >
                <X size={14}/>
              </button>
            )}
          </div>
          {showResults && (
            <div className="pnav-drop">
              {results.length === 0 ? (
                <div className="pnav-empty">
                  {searching ? "A pesquisar..." : "Nenhum pedido encontrado"}
                </div>
              ) : results.map(s => (
                <div
                  key={s.id}
                  className="pnav-result"
                  onClick={() => { setShowResults(false); setQuery(""); router.push(`/provider/services/${s.id}`); }}
                >
                  <div style={{ width:36, height:36, borderRadius:10, background:"#2a1e08", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                    {CAT_EMOJI[s.category] ?? "🔧"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:"#e2e8f0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.title}</p>
                    <p style={{ fontSize:11, color:"#4a6a6a" }}>
                      {s.category} · {Number(s.budget).toLocaleString("pt-PT")} Kz
                      {s.province ? ` · ${s.province}` : ""}
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color:"#3a4a5a", flexShrink:0 }}/>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right controls ──────────────────────────────────────────────── */}
        <div className="pnav-right">

          {mounted && (
            <button
              className={[
                "pnav-loc-btn",
                locState === "loading" ? "pnav-loc-btn--loading" : "",
                locState === "active"  ? "pnav-loc-btn--active"  : "",
                locState === "denied"  ? "pnav-loc-btn--denied"  : "",
              ].filter(Boolean).join(" ")}
              onClick={handleToggleLocation}
              disabled={locState === "loading"}
              aria-label={
                locState === "idle"    ? "Ativar localização"      :
                locState === "loading" ? "A localizar…"            :
                locState === "active"  ? "Desativar localização"  :
                                         "Acesso negado"
              }
            >
              {locState === "active" && <span className="pnav-pulse-ring" aria-hidden="true"/>}

              {locState === "loading" ? (
                <Loader2
                  size={14}
                  className="pnav-spin"
                  style={{ color:"#EF9F27", flexShrink:0 }}
                />
              ) : (
                <MapPin
                  size={14}
                  className={locState === "active" ? "pnav-pin-active" : ""}
                  style={{
                    flexShrink: 0,
                    color: locState === "active" ? "#22c55e"
                         : locState === "denied"  ? "#ef4444"
                         : "#EF9F27",
                  }}
                />
              )}

              <span className="pnav-loc-label">
                {locState === "idle"    && "Ativar localização"}
                {locState === "loading" && "A localizar…"}
                {locState === "active"  && "Ativado"}
                {locState === "denied"  && "Acesso negado"}
              </span>
            </button>
          )}

          {/* Chat icon */}
          <div className="pnav-ib" onClick={() => router.push("/provider/chat")} role="button" aria-label="Chat">
            <div className="pnav-ii">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a9ab0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            {unreadChat > 0 && (
              <span className="pnav-badge">{unreadChat > 99 ? "99+" : unreadChat}</span>
            )}
          </div>

          {/* Notifications bell */}
          <button
            className="pnav-bell"
            onClick={() => router.push("/provider/notifications")}
            aria-label="Notificações"
          >
            <Bell size={18} style={{ color:"#8a9ab0" }}/>
            {unreadNotif > 0 && <span className="pnav-bell-badge" aria-hidden="true"/>}
          </button>

          {/* Avatar */}
          <div
            className="pnav-avatar"
            onClick={() => router.push("/provider/profile")}
            role="button"
            tabIndex={0}
            aria-label="Perfil"
          >
            {user?.fullName?.[0]?.toUpperCase() ?? "P"}
          </div>
        </div>
      </nav>
    </>
  );
}
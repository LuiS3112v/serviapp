"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCircle, MessageCircle, Wallet, AlertCircle,
  Trash2, Check, Loader2, RefreshCw, Building2, X,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { AppNotification } from "@/lib/notifications.api";
import { getToken } from "@/lib/auth.api";
import { api } from "@/lib/api";

type TabFilter = "all" | "unread" | "read";

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("pt-PT");
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  message:           { icon: MessageCircle, color: "#1D9E75", bg: "#1d9e7520" },
  service_accepted:  { icon: CheckCircle,   color: "#378ADD", bg: "#378ADD20" },
  service_started:   { icon: CheckCircle,   color: "#8B5CF6", bg: "#8B5CF620" },
  service_completed: { icon: CheckCircle,   color: "#1D9E75", bg: "#1d9e7520" },
  service_cancelled: { icon: AlertCircle,   color: "#E24B4A", bg: "#E24B4A20" },
  payment:           { icon: Wallet,        color: "#EF9F27", bg: "#EF9F2720" },
  wallet:            { icon: Wallet,        color: "#EF9F27", bg: "#EF9F2720" },
  kyc_approved:      { icon: CheckCircle,   color: "#1D9E75", bg: "#1d9e7520" },
  kyc_rejected:      { icon: AlertCircle,   color: "#E24B4A", bg: "#E24B4A20" },
  system:            { icon: Bell,          color: "#6a7a8a", bg: "#1a2535"   },
  admin:             { icon: AlertCircle,   color: "#D4537E", bg: "#D4537E20" },
};

// ─── Detecta se é notificação de convite de empresa ──────────────────────────
function isCompanyInvite(n: AppNotification): boolean {
  return (
    n.type === "system" &&
    (n.metadata?.isCompanyInvite === true ||
      n.title?.includes("Convite para equipa"))
  );
}

// ─── Botões de aceitar/rejeitar convite ──────────────────────────────────────
function InviteActions({
  notification,
  onResponded,
}: {
  notification: AppNotification;
  onResponded: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [done, setDone]       = useState<"accepted" | "rejected" | null>(null);

  // Extrai o invitationId do actionUrl ou metadata
  // O backend guarda o invitationId no metadata quando existe
  const invitationId = notification.metadata?.invitationId as string | undefined;

  const handleRespond = async (accept: boolean) => {
    if (!invitationId) {
      // Se não temos o invitationId na notificação, redireciona para o perfil
      // da empresa onde pode responder manualmente
      router.push("/provider/company");
      return;
    }

    setLoading(accept ? "accept" : "reject");
    try {
      await api.patch(`/company/invitations/${invitationId}/respond`, { accept });
      setDone(accept ? "accepted" : "rejected");
      setTimeout(onResponded, 1500);
    } catch (e: any) {
      alert(e.message || "Erro ao responder ao convite.");
    } finally {
      setLoading(null);
    }
  };

  if (done) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        marginTop: 10, padding: "8px 12px", borderRadius: 9,
        background: done === "accepted" ? "#1D9E7520" : "#E24B4A20",
        border: `1px solid ${done === "accepted" ? "#1D9E7540" : "#E24B4A40"}`,
        fontSize: 12, fontWeight: 600,
        color: done === "accepted" ? "#1D9E75" : "#E24B4A",
      }}>
        {done === "accepted"
          ? <><CheckCircle size={13}/> Convite aceite — bem-vindo à equipa!</>
          : <><X size={13}/> Convite rejeitado</>
        }
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <button
        disabled={!!loading}
        onClick={e => { e.stopPropagation(); handleRespond(true); }}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 9, border: "none",
          background: "linear-gradient(135deg,#1D9E75,#16876a)",
          color: "white", fontSize: 12, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: loading === "reject" ? 0.5 : 1,
          transition: "all 0.15s",
        }}
      >
        {loading === "accept"
          ? <Loader2 size={12} style={{ animation: "pnspin 1s linear infinite" }}/>
          : <CheckCircle size={12}/>
        }
        {loading === "accept" ? "A aceitar..." : "Aceitar"}
      </button>
      <button
        disabled={!!loading}
        onClick={e => { e.stopPropagation(); handleRespond(false); }}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 9,
          border: "1px solid #E24B4A40", background: "#E24B4A15",
          color: "#E24B4A", fontSize: 12, fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: loading === "accept" ? 0.5 : 1,
          transition: "all 0.15s",
        }}
      >
        {loading === "reject"
          ? <Loader2 size={12} style={{ animation: "pnspin 1s linear infinite" }}/>
          : <X size={12}/>
        }
        {loading === "reject" ? "A rejeitar..." : "Rejeitar"}
      </button>
    </div>
  );
}

// ─── Notification Card ────────────────────────────────────────────────────────
function NotifCard({
  n, onRead, onDelete, onRefresh,
}: {
  n: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  const isInvite = isCompanyInvite(n);
  const cfg = isInvite
    ? { icon: Building2, color: "#378ADD", bg: "#378ADD18" }
    : (TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system);
  const Icon = cfg.icon;
  const isUnread = n.status === "unread";

  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        padding: "16px", borderRadius: 14,
        background: isUnread ? "#131b27" : "#0d1117",
        border: `1px solid ${isInvite ? "#378ADD30" : (isUnread ? "#1d2535" : "#1a2535")}`,
        cursor: isUnread ? "pointer" : "default",
        transition: "all 0.15s", position: "relative",
      }}
      onClick={() => isUnread && !isInvite && onRead(n.id)}
    >
      {isUnread && (
        <div style={{
          position: "absolute", top: 16, right: 16,
          width: 8, height: 8, borderRadius: "50%", background: "#1D9E75",
        }} />
      )}

      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: cfg.bg, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={18} style={{ color: cfg.color }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 14, fontWeight: isUnread ? 700 : 500, color: "#e2e8f0", margin: 0 }}>{n.title}</p>
          <span style={{ fontSize: 11, color: "#3a4a5a", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
        </div>
        <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.5, margin: 0 }}>{n.body}</p>

        {/* Botões aceitar/rejeitar — só para convites de empresa */}
        {isInvite && (
          <InviteActions
            notification={n}
            onResponded={() => {
              onRead(n.id);
              onRefresh();
            }}
          />
        )}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete(n.id); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#2a3a4a", padding: 4, flexShrink: 0, transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#E24B4A")}
        onMouseLeave={e => (e.currentTarget.style.color = "#2a3a4a")}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProviderNotificationsPage() {
  const {
    notifications, unread, loading,
    hasMore, markAsRead, markAllAsRead,
    deleteNotification, loadMore, refresh,
  } = useNotifications();

  const [tab, setTab]           = useState<TabFilter>("all");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => { setIsLoggedIn(!!getToken()); }, []);

  const filtered = notifications.filter(n => {
    if (tab === "unread") return n.status === "unread";
    if (tab === "read")   return n.status === "read";
    return true;
  });

  return (
    <>
      <style>{`
        .pn-wrap{display:flex;flex-direction:column;gap:20px;padding:28px 32px;max-width:720px}
        .pn-tabs{display:flex;gap:4px;background:#131b27;border-radius:12px;padding:4px;border:1px solid #1a2535;width:fit-content}
        .pn-tab{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;color:#6a7a8a;transition:all 0.15s;font-family:inherit;white-space:nowrap}
        .pn-tab.on{background:#1D9E75;color:white}
        .pn-list{display:flex;flex-direction:column;gap:8px}
        .pn-skeleton{background:#1a2535;border-radius:8px;animation:pnsk 1.5s infinite}
        @keyframes pnsk{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes pnspin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .pn-load-btn{width:100%;padding:12px;border-radius:12px;border:1px solid #1a2535;background:#131b27;color:#6a7a8a;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .pn-load-btn:hover{border-color:#1D9E75;color:#1D9E75}
        @media(max-width:640px){.pn-wrap{padding:16px 16px 20px}}
      `}</style>

      <div className="pn-wrap">

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>Notificações</h1>
            <p style={{ fontSize:13, color:"#4a6a6a" }}>
              {unread > 0 ? `${unread} não lida${unread !== 1 ? "s" : ""}` : "Tudo lido"}
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button
              onClick={refresh} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:12, border:"1px solid #1a2535", background:"#131b27", color:"#6a7a8a", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}
            >
              <RefreshCw size={13} style={{ animation: loading ? "pnspin 1s linear infinite" : "none" }} />
              Actualizar
            </button>
            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:12, border:"1px solid #1d9e7540", background:"#1d9e7520", color:"#1D9E75", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
              >
                <Check size={13}/> Marcar todas
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="pn-tabs">
          {(["all", "unread", "read"] as TabFilter[]).map(t => (
            <button key={t} className={`pn-tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
              {t === "all" ? "Todas" : t === "unread" ? "Não lidas" : "Lidas"}
              {t === "unread" && unread > 0 && (
                <span style={{ marginLeft:6, background:"#1D9E75", color:"white", fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:99 }}>
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Not logged in */}
        {!isLoggedIn && (
          <div style={{ textAlign:"center", padding:"60px 20px", background:"#131b27", border:"1px solid #1a2535", borderRadius:16 }}>
            <Bell size={32} style={{ color:"#2a3a4a", margin:"0 auto 12px" }} />
            <p style={{ fontSize:15, fontWeight:600, color:"#c0d0e0" }}>Faz login para ver notificações</p>
          </div>
        )}

        {/* Loading */}
        {isLoggedIn && loading && notifications.length === 0 && (
          <div className="pn-list">
            {[1,2,3,4].map(i => (
              <div key={i} style={{ display:"flex", gap:14, padding:16, background:"#131b27", border:"1px solid #1a2535", borderRadius:14 }}>
                <div className="pn-skeleton" style={{ width:42, height:42, borderRadius:12, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div className="pn-skeleton" style={{ width:"55%", height:13, marginBottom:8 }}/>
                  <div className="pn-skeleton" style={{ width:"80%", height:11 }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {isLoggedIn && !loading && filtered.length === 0 && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", gap:16, textAlign:"center", background:"#131b27", border:"1px solid #1a2535", borderRadius:16 }}>
            <div style={{ width:64, height:64, borderRadius:20, background:"#0d1117", border:"1px solid #1a2535", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Bell size={28} style={{ color:"#2a3a4a" }}/>
            </div>
            <div>
              <p style={{ fontSize:16, fontWeight:700, color:"#c0d0e0", marginBottom:8 }}>
                {tab === "unread" ? "Nenhuma não lida" : tab === "read" ? "Nenhuma lida" : "Sem notificações"}
              </p>
              <p style={{ fontSize:13, color:"#4a6a6a", lineHeight:1.6 }}>
                {tab === "all" ? "As tuas notificações aparecem aqui quando tiveres actividade." : "Muda o filtro para ver outras."}
              </p>
            </div>
            {tab !== "all" && (
              <button onClick={() => setTab("all")} style={{ fontSize:13, color:"#1D9E75", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                Ver todas
              </button>
            )}
          </div>
        )}

        {/* List */}
        {isLoggedIn && filtered.length > 0 && (
          <div className="pn-list">
            {filtered.map(n => (
              <NotifCard
                key={n.id}
                n={n}
                onRead={markAsRead}
                onDelete={deleteNotification}
                onRefresh={refresh}
              />
            ))}
            {hasMore && (
              <button className="pn-load-btn" onClick={loadMore} disabled={loading}>
                {loading
                  ? <><Loader2 size={13} style={{ display:"inline", marginRight:6, animation:"pnspin 1s linear infinite" }}/>A carregar...</>
                  : "Carregar mais"}
              </button>
            )}
          </div>
        )}

      </div>
    </>
  );
}
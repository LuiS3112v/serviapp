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

// ─── Types ─────────────────────────────────────────────────────────────────

type TabFilter = "all" | "unread" | "read";

// ─── Helpers ───────────────────────────────────────────────────────────────

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

// Cor de identidade do provider — usada só para sinalizar "novo":
// indicador de não lida, borda de card não lido, tab activa. Todos os
// ícones de notificação partilham o mesmo estilo neutro, independentemente
// do tipo (incluindo o convite de empresa).
const ACCENT = "#EF9F27";
const ACCENT_SOFT = "#fef3e2";
const ACCENT_BORDER = "#fcd9a1";
const ACCENT_HOVER_TEXT = "#b96f0f";

const TYPE_ICON: Record<string, any> = {
  message: MessageCircle,
  service_accepted: CheckCircle,
  service_started: CheckCircle,
  service_completed: CheckCircle,
  service_cancelled: AlertCircle,
  payment: Wallet,
  wallet: Wallet,
  kyc_approved: CheckCircle,
  kyc_rejected: AlertCircle,
  system: Bell,
  admin: AlertCircle,
};

// ─── Detecta convite de empresa ────────────────────────────────────────────

function isCompanyInvite(n: AppNotification): boolean {
  return (
    n.type === "system" &&
    (n.metadata?.isCompanyInvite === true ||
      n.title?.includes("Convite para equipa"))
  );
}

// ─── Botões aceitar/rejeitar convite ───────────────────────────────────────

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

  const invitationId = notification.metadata?.invitationId as string | undefined;

  const handleRespond = async (accept: boolean) => {
    if (!invitationId) {
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
        background: done === "accepted" ? "#f1f5f9" : "#fef2f2",
        border: `1px solid ${done === "accepted" ? "#e2e8f0" : "#fecaca"}`,
        fontSize: 12, fontWeight: 600,
        color: done === "accepted" ? "#334155" : "#dc2626",
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
          background: "#334155",
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
          border: "1px solid #fecaca", background: "#fef2f2",
          color: "#dc2626", fontSize: 12, fontWeight: 600,
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

// ─── Notification Card ─────────────────────────────────────────────────────

function NotifCard({
  n, onRead, onDelete, onRefresh,
}: {
  n: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}) {
  const isInvite = isCompanyInvite(n);
  const Icon = isInvite ? Building2 : (TYPE_ICON[n.type] ?? Bell);
  const isUnread = n.status === "unread";

  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        padding: "16px", borderRadius: 14,
        background: isUnread ? "#ffffff" : "#fbfcfd",
        border: `1px solid ${isInvite ? ACCENT_BORDER : (isUnread ? ACCENT_BORDER : "#eef1f5")}`,
        boxShadow: isUnread ? "0 2px 10px rgba(15,23,42,0.05)" : "none",
        cursor: isUnread && !isInvite ? "pointer" : "default",
        transition: "all 0.15s", position: "relative",
      }}
      onClick={() => isUnread && !isInvite && onRead(n.id)}
    >
      {/* Indicador de não lida */}
      {isUnread && (
        <div style={{
          position: "absolute", top: 16, right: 16,
          width: 8, height: 8, borderRadius: "50%",
          background: ACCENT,
        }}/>
      )}

      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: "#f1f5f9", display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={18} style={{ color: "#475569" }}/>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 14, fontWeight: isUnread ? 700 : 500, color: "#0f172a", margin: 0 }}>{n.title}</p>
          <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: 0 }}>{n.body}</p>

        {isInvite && (
          <InviteActions
            notification={n}
            onResponded={() => { onRead(n.id); onRefresh(); }}
          />
        )}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete(n.id); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#cbd5e1", padding: 4, flexShrink: 0, transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
        onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}
      >
        <Trash2 size={14}/>
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ProviderNotificationsPage() {
  const {
    notifications, unread, loading,
    hasMore, markAsRead, markAllAsRead,
    deleteNotification, loadMore, refresh,
  } = useNotifications();

  const [tab, setTab]               = useState<TabFilter>("all");
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
        @keyframes pnspin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pnsk   { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }

        .pn-wrap  { display: flex; flex-direction: column; gap: 20px; padding: 28px 32px; max-width: 720px; }

        /* ── Tabs — accent do provider quando activa ── */
        .pn-tabs  { display: flex; gap: 4px; background: #ffffff; border-radius: 12px; padding: 4px; border: 1px solid #eef1f5; width: fit-content; }
        .pn-tab   {
          padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 500;
          cursor: pointer; border: none; background: none;
          color: #475569; transition: all 0.15s; font-family: inherit; white-space: nowrap;
        }
        .pn-tab:hover:not(.on) { background: ${ACCENT_SOFT}; color: ${ACCENT_HOVER_TEXT}; }
        .pn-tab.on             { background: ${ACCENT}; color: white; }

        .pn-badge { margin-left: 6px; background: ${ACCENT}; color: white; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 99px; display: inline-block; }
        .pn-tab.on .pn-badge  { background: rgba(255,255,255,0.25); color: white; }

        /* ── Botão Actualizar ── */
        .pn-btn-refresh {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 12px;
          border: 1px solid #eef1f5; background: #ffffff;
          color: #64748b; font-size: 13px; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .pn-btn-refresh:hover:not(:disabled) { border-color: ${ACCENT_BORDER}; color: ${ACCENT_HOVER_TEXT}; background: #fffbf3; }
        .pn-btn-refresh:disabled { opacity: 0.6; cursor: default; }

        /* ── Lista e skeletons ── */
        .pn-list     { display: flex; flex-direction: column; gap: 8px; }
        .pn-skeleton { background: #e2e8f0; border-radius: 8px; animation: pnsk 1.5s infinite; }

        /* ── Load more ── */
        .pn-load-btn {
          width: 100%; padding: 12px; border-radius: 12px;
          border: 1px solid #eef1f5; background: #ffffff;
          color: #64748b; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: inherit; transition: all 0.15s;
        }
        .pn-load-btn:hover { border-color: ${ACCENT}; color: ${ACCENT_HOVER_TEXT}; }

        @media (max-width: 640px) { .pn-wrap { padding: 16px 16px 20px; } }
      `}</style>

      <div className="pn-wrap">

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:4 }}>Notificações</h1>
            <p style={{ fontSize:13, color:"#64748b" }}>
              {unread > 0 ? `${unread} não lida${unread !== 1 ? "s" : ""}` : "Tudo lido"}
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={refresh} disabled={loading} className="pn-btn-refresh">
              <RefreshCw size={13} style={{ animation: loading ? "pnspin 1s linear infinite" : "none" }}/>
              Actualizar
            </button>
            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:12, border:`1px solid ${ACCENT_BORDER}`, background:ACCENT_SOFT, color:ACCENT_HOVER_TEXT, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
              >
                <Check size={13}/> Marcar todas
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="pn-tabs">
          {(["all","unread","read"] as TabFilter[]).map(t => (
            <button key={t} className={`pn-tab${tab===t?" on":""}`} onClick={()=>setTab(t)}>
              {t==="all"?"Todas":t==="unread"?"Não lidas":"Lidas"}
              {t==="unread" && unread > 0 && (
                <span className="pn-badge">{unread}</span>
              )}
            </button>
          ))}
        </div>

        {/* Not logged in */}
        {!isLoggedIn && (
          <div style={{ textAlign:"center", padding:"60px 20px", background:"#ffffff", border:"1px solid #eef1f5", borderRadius:16 }}>
            <Bell size={32} style={{ color:"#cbd5e1", margin:"0 auto 12px" }}/>
            <p style={{ fontSize:15, fontWeight:600, color:"#334155" }}>Faz login para ver notificações</p>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoggedIn && loading && notifications.length === 0 && (
          <div className="pn-list">
            {[1,2,3,4].map(i => (
              <div key={i} style={{ display:"flex", gap:14, padding:16, background:"#ffffff", border:"1px solid #eef1f5", borderRadius:14 }}>
                <div className="pn-skeleton" style={{ width:42, height:42, borderRadius:12, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div className="pn-skeleton" style={{ width:"55%", height:13, marginBottom:8 }}/>
                  <div className="pn-skeleton" style={{ width:"80%", height:11 }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {isLoggedIn && !loading && filtered.length === 0 && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", gap:16, textAlign:"center", background:"#ffffff", border:"1px solid #eef1f5", borderRadius:16 }}>
            <div style={{ width:64, height:64, borderRadius:20, background:"#f8fafc", border:"1px solid #eef1f5", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Bell size={28} style={{ color:"#cbd5e1" }}/>
            </div>
            <div>
              <p style={{ fontSize:16, fontWeight:700, color:"#334155", marginBottom:8 }}>
                {tab==="unread"?"Nenhuma não lida":tab==="read"?"Nenhuma lida":"Sem notificações"}
              </p>
              <p style={{ fontSize:13, color:"#64748b", lineHeight:1.6 }}>
                {tab==="all"
                  ? "As tuas notificações aparecem aqui quando tiveres actividade."
                  : "Muda o filtro para ver outras notificações."}
              </p>
            </div>
            {tab !== "all" && (
              <button onClick={()=>setTab("all")} style={{ fontSize:13, color:ACCENT_HOVER_TEXT, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
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
                  : "Carregar mais"
                }
              </button>
            )}
          </div>
        )}

      </div>
    </>
  );
}
"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Bell, CheckCircle, MessageCircle, Wallet, AlertCircle,
  Trash2, Check, Loader2, RefreshCw,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { AppNotification } from "@/lib/notifications.api";
import { getToken } from "@/lib/auth.api";

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

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  message:           { icon: MessageCircle, color: "#1D9E75", bg: "#e3f5ee" },
  service_accepted:  { icon: CheckCircle,   color: "#2563eb", bg: "#dbeafe" },
  service_started:   { icon: CheckCircle,   color: "#7C3AED", bg: "#ede7fe" },
  service_completed: { icon: CheckCircle,   color: "#1D9E75", bg: "#e3f5ee" },
  service_cancelled: { icon: AlertCircle,   color: "#dc2626", bg: "#fef2f2" },
  payment:           { icon: Wallet,        color: "#EF9F27", bg: "#fef3e2" },
  wallet:            { icon: Wallet,        color: "#EF9F27", bg: "#fef3e2" },
  kyc_approved:      { icon: CheckCircle,   color: "#1D9E75", bg: "#e3f5ee" },
  kyc_rejected:      { icon: AlertCircle,   color: "#dc2626", bg: "#fef2f2" },
  system:            { icon: Bell,          color: "#64748b", bg: "#f1f5f9" },
  admin:             { icon: AlertCircle,   color: "#DB2777", bg: "#fce7f3" },
};

// ─── Notification Card ─────────────────────────────────────────────────────

function NotifCard({
  n, onRead, onDelete,
}: {
  n: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
  const Icon = cfg.icon;
  const isUnread = n.status === "unread";

  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        padding: "16px", borderRadius: 14,
        background: isUnread ? "#ffffff" : "#fbfcfd",
        border: `1px solid ${isUnread ? "#dbeafe" : "#eef1f5"}`,
        boxShadow: isUnread ? "0 2px 10px rgba(15,23,42,0.05)" : "none",
        cursor: "pointer", transition: "all 0.15s",
        position: "relative",
      }}
      onClick={() => isUnread && onRead(n.id)}
    >
      {isUnread && (
        <div style={{
          position: "absolute", top: 16, right: 16,
          width: 8, height: 8, borderRadius: "50%",
          background: "#2563eb",
        }}/>
      )}

      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: cfg.bg, display: "flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={18} style={{ color: cfg.color }}/>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 14, fontWeight: isUnread ? 700 : 500, color: "#0f172a" }}>{n.title}</p>
          <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{n.body}</p>
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete(n.id); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#cbd5e1", padding: 4, flexShrink: 0,
          transition: "color 0.15s",
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

export default function NotificationsPage() {
  const {
    notifications, unread, loading,
    hasMore, markAsRead, markAllAsRead,
    deleteNotification, loadMore, refresh,
  } = useNotifications();

  const [tab, setTab] = useState<TabFilter>("all");
  const isLoggedIn = !!getToken();

  const filtered = notifications.filter(n => {
    if (tab === "unread") return n.status === "unread";
    if (tab === "read") return n.status === "read";
    return true;
  });

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes sk { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }

        .notif-wrap { display: flex; min-height: 100vh; background: #f8fafc }
        .notif-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column }
        .notif-inner { flex: 1; padding: 28px 32px; max-width: 720px; display: flex; flex-direction: column; gap: 20px }

        /* ── Tabs ── */
        .tabs { display: flex; gap: 4px; background: #ffffff; border-radius: 12px; padding: 4px; border: 1px solid #eef1f5; width: fit-content }
        .tab {
          padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 500;
          cursor: pointer; border: none; background: none;
          /* FIX 1: contraste melhorado — era #64748b, agora #475569 */
          color: #475569;
          transition: all 0.15s; font-family: inherit; white-space: nowrap
        }
        .tab:hover:not(.on) { background: #f1f5f9; color: #1e293b }
        .tab.on { background: #2563eb; color: white }

        /* FIX 4: badge visível quando tab está activa (fundo azul → badge branco) */
        .tab.on .notif-badge { background: rgba(255,255,255,0.25); color: white }
        .notif-badge {
          margin-left: 6px; background: #2563eb; color: white;
          font-size: 10px; font-weight: 700; padding: 1px 6px;
          border-radius: 99px; display: inline-block;
        }

        /* ── Botões de acção ── */
        .btn-refresh {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 12px;
          border: 1px solid #eef1f5; background: #ffffff;
          color: #64748b; font-size: 13px; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        /* FIX 2: hover no botão Actualizar */
        .btn-refresh:hover:not(:disabled) { border-color: #cbd5e1; color: #334155; background: #f8fafc }
        .btn-refresh:disabled { opacity: 0.6; cursor: default }

        /* ── Lista e esqueletos ── */
        .notif-list { display: flex; flex-direction: column; gap: 8px }
        .skeleton { background: #e2e8f0; border-radius: 8px; animation: sk 1.5s infinite }

        /* ── Load more ── */
        .load-more-btn {
          width: 100%; padding: 12px; border-radius: 12px;
          border: 1px solid #eef1f5; background: #ffffff;
          color: #64748b; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: inherit; transition: all 0.15s
        }
        .load-more-btn:hover { border-color: #2563eb; color: #2563eb }

        @media (max-width: 1024px) { .notif-main { margin-left: 0 } }
        @media (max-width: 640px)  { .notif-inner { padding: 70px 16px 20px } }
      `}</style>

      <div className="notif-wrap">
        <Sidebar/>
        <div className="notif-main">
          <Navbar/>
          <div className="notif-inner">

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:4 }}>Notificações</h1>
                <p style={{ fontSize:13, color:"#64748b" }}>
                  {unread > 0 ? `${unread} não lida${unread !== 1 ? "s" : ""}` : "Tudo lido"}
                </p>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {/* FIX 2: hover tratado via className */}
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="btn-refresh"
                >
                  <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }}/>
                  Actualizar
                </button>
                {unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:12, border:"1px solid #dbeafe", background:"#eff6ff", color:"#2563eb", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
                  >
                    <Check size={13}/> Marcar todas
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              {(["all","unread","read"] as TabFilter[]).map(t => (
                <button key={t} className={`tab${tab===t?" on":""}`} onClick={()=>setTab(t)}>
                  {t==="all"?"Todas":t==="unread"?"Não lidas":"Lidas"}
                  {/* FIX 4: badge usa classe própria para override quando tab.on */}
                  {t==="unread" && unread > 0 && (
                    <span className="notif-badge">{unread}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Not logged in */}
            {!isLoggedIn && (
              <div style={{ textAlign:"center", padding:"60px 20px", background:"#ffffff", border:"1px solid #eef1f5", borderRadius:16 }}>
                <Bell size={32} style={{ color:"#cbd5e1", margin:"0 auto 12px" }}/>
                <p style={{ fontSize:15, fontWeight:600, color:"#334155", marginBottom:8 }}>Faz login para ver notificações</p>
              </div>
            )}

            {/* Loading skeletons */}
            {isLoggedIn && loading && notifications.length === 0 && (
              <div className="notif-list">
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display:"flex", gap:14, padding:16, background:"#ffffff", border:"1px solid #eef1f5", borderRadius:14 }}>
                    <div className="skeleton" style={{ width:42, height:42, borderRadius:12, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div className="skeleton" style={{ width:"55%", height:13, marginBottom:8 }}/>
                      <div className="skeleton" style={{ width:"80%", height:11 }}/>
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
                {tab!=="all" && (
                  <button onClick={()=>setTab("all")} style={{ fontSize:13, color:"#2563eb", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>
                    Ver todas
                  </button>
                )}
              </div>
            )}

            {/* List */}
            {isLoggedIn && filtered.length > 0 && (
              <div className="notif-list">
                {filtered.map(n => (
                  <NotifCard
                    key={n.id}
                    n={n}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
                {hasMore && (
                  <button className="load-more-btn" onClick={loadMore} disabled={loading}>
                    {loading
                      ? <><Loader2 size={13} style={{ display:"inline", marginRight:6, animation:"spin 1s linear infinite" }}/>A carregar...</>
                      : "Carregar mais"
                    }
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
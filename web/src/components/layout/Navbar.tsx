"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Search, MapPin, Menu } from "lucide-react";
import { chatApi } from "@/lib/chat.api";
import { notificationsApi } from "@/lib/notifications.api";
import { getSession, getToken } from "@/lib/auth.api";
import { usePlatformRealtime } from "@/hooks/usePlatformRealtime";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [initials, setInitials] = useState("?");
  const { on } = usePlatformRealtime();

  useEffect(() => {
    const user = getSession();
    setInitials(user?.fullName?.charAt(0)?.toUpperCase() ?? "C");

    const token = getToken();
    if (!token) return;

    // Carga inicial — uma única vez no mount
    chatApi.getUnread().then(d => setUnreadChat(d.count)).catch(() => {});
    notificationsApi.getUnreadCount().then(d => setUnreadNotif(d.count)).catch(() => {});
  }, []);

  // Zera badge de notificações ao entrar na página de notificações
  useEffect(() => {
    if (pathname === "/notifications") {
      setUnreadNotif(0);
    }
  }, [pathname]);

  // Zera badge de chat ao entrar na página de chat (lista de conversas)
  useEffect(() => {
    if (pathname === "/chat") {
      // Re-fetch para ter o valor exacto após marcar como lidas
      chatApi.getUnread().then(d => setUnreadChat(d.count)).catch(() => {});
    }
  }, [pathname]);

  // Actualiza badge de notificações em realtime quando chega nova notificação
  useEffect(() => {
    return on("notification_created", (payload) => {
      // _sync: true → evento de re-sincronização após reconexão; substitui total
      if (payload._sync) {
        setUnreadNotif(pathname === "/notifications" ? 0 : (payload.total as number ?? 0));
        return;
      }
      // Incrementa só se não estiver já na página de notificações
      setUnreadNotif(c => (pathname === "/notifications" ? 0 : c + 1));
    });
  }, [on, pathname]);

  // Actualiza badge de chat em realtime quando chega nova mensagem ou leitura
  useEffect(() => {
    return on("chat_unread_changed", (payload) => {
      // total: valor absoluto enviado após markAsRead — usar directamente
      if (payload.total !== undefined) {
        setUnreadChat(Math.max(0, payload.total as number));
        return;
      }
      // Se estiver na página de chat, re-fetch para valor exacto
      if (pathname === "/chat" || /^\/chat\//.test(pathname)) {
        chatApi.getUnread().then(d => setUnreadChat(d.count)).catch(() => {});
        return;
      }
      // delta: incremento por nova mensagem
      if (payload.delta !== undefined) {
        setUnreadChat(c => Math.max(0, c + (payload.delta as number)));
      } else {
        chatApi.getUnread().then(d => setUnreadChat(d.count)).catch(() => {});
      }
    });
  }, [on, pathname]);

  return (
    <>
      <style>{`
        .navbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:64px;background:#FFFFFF;border-bottom:1px solid #E2E8F0;gap:12px;flex-wrap:nowrap}
        .navbar-menu-btn{display:none;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:#FFFFFF;border:1px solid #E2E8F0;color:#475569;cursor:pointer;flex-shrink:0;transition:all 0.15s;margin-right:4px}
        .navbar-menu-btn:hover{border-color:#0F172A;color:#0F172A}
        @media(max-width:1024px){
          .navbar-menu-btn{display:flex}
        }
        .navbar-search{display:flex;align-items:center;gap:10px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:10px 16px;flex:1;min-width:0;max-width:480px;cursor:pointer;transition:border-color 0.2s,box-shadow 0.2s,background 0.2s}
        .navbar-search:hover{border-color:#94A3B8;background:#FFFFFF;box-shadow:0 0 0 3px rgba(37,99,235,0.10)}
        .navbar-search-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
        .navbar-right{display:flex;align-items:center;gap:12px;margin-left:20px;flex-shrink:0}
        .navbar-location{display:flex;align-items:center;gap:6px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:8px 14px;flex-shrink:0;white-space:nowrap}
        .navbar-icon-btn{position:relative;cursor:pointer;flex-shrink:0}
        .navbar-icon-inner{width:40px;height:40px;border-radius:12px;background:#FFFFFF;border:1px solid #E2E8F0;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .navbar-icon-inner.is-chat{background:#FFFFFF}
        .navbar-icon-inner.is-chat:hover{background:#F8FAFC;border-color:#E2E8F0;transform:translateY(-1px)}
        .navbar-icon-inner.is-notif{background:#FFFFFF;border-color:#E2E8F0}
        .navbar-icon-inner.is-notif:hover{background:#F8FAFC;border-color:#E2E8F0;transform:translateY(-1px)}
        .navbar-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:99px;border:2px solid #FFFFFF;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;padding:0 4px;box-shadow:0 1px 3px rgba(15,23,42,0.18)}
        .navbar-badge.is-chat{background:#2563EB}
        .navbar-badge.is-notif{background:#F59E0B}
        .navbar-avatar{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#2563EB,#4F46E5);border:1px solid rgba(37,99,235,0.22);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;cursor:pointer;transition:all 0.15s;box-shadow:0 2px 8px rgba(37,99,235,0.28);flex-shrink:0}
        .navbar-avatar:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(37,99,235,0.36)}
        @media(max-width:1024px){
          .navbar{padding:0 16px}
          .navbar-location{display:none}
          .navbar-search{max-width:300px}
        }
        @media(max-width:860px){
          .navbar-search{max-width:240px}
          .navbar-right{gap:8px;margin-left:12px}
        }
        @media(max-width:640px){
          .navbar{padding:0 12px;gap:8px}
          .navbar-search{max-width:none}
          .navbar-right{gap:6px;margin-left:8px}
        }
        @media(max-width:420px){
          .navbar-icon-inner,.navbar-avatar{width:36px;height:36px}
          .navbar-search{padding:9px 12px}
        }
        @media(max-width:360px){
          .navbar{padding:0 10px;gap:6px}
          .navbar-right{gap:4px;margin-left:6px}
          .navbar-icon-inner,.navbar-avatar{width:32px;height:32px;border-radius:10px}
        }
      `}</style>
      <nav className="navbar">
        <button
          className="navbar-menu-btn"
          onClick={() => window.dispatchEvent(new CustomEvent("sidebar:toggle"))}
          aria-label="Abrir menu"
        >
          <Menu size={20}/>
        </button>
        <div className="navbar-search" onClick={() => router.push("/search")}>
          <Search size={16} style={{color:"#64748B",flexShrink:0}}/>
          <span className="navbar-search-text" style={{fontSize:14,color:"#64748B",userSelect:"none"}}>Pesquise um serviço...</span>
        </div>
        <div className="navbar-right">
          <div className="navbar-location">
            <MapPin size={14} style={{color:"#64748B"}}/>
            <span style={{fontSize:13,color:"#64748B",fontWeight:600}}>Luanda, Angola</span>
          </div>
          <div className="navbar-icon-btn" onClick={()=>router.push("/chat")}>
            <div className="navbar-icon-inner is-chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            {unreadChat > 0 && <span className="navbar-badge is-chat">{unreadChat > 99 ? "99+" : unreadChat}</span>}
          </div>
          <div className="navbar-icon-btn" onClick={()=>router.push("/notifications")}>
            <div className="navbar-icon-inner is-notif">
              <Bell size={18} style={{color:"#64748B"}}/>
            </div>
            {unreadNotif > 0 && <span className="navbar-badge is-notif">{unreadNotif > 99 ? "99+" : unreadNotif}</span>}
          </div>
          <div className="navbar-avatar" onClick={()=>router.push("/profile/client")}>
            {initials}
          </div>
        </div>
      </nav>
    </>
  );
}
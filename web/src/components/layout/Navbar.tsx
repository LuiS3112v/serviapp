"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, MapPin } from "lucide-react";
import { chatApi } from "@/lib/chat.api";
import { notificationsApi } from "@/lib/notifications.api";
import { getSession, getToken } from "@/lib/auth.api";

export default function Navbar() {
  const router = useRouter();
  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);

  const [initials, setInitials] = useState("?");

  useEffect(() => {
    const user = getSession();
    setInitials(user?.fullName?.charAt(0)?.toUpperCase() ?? "C");

    const token = getToken();
    if (!token) return;

    const fetchCounts = () => {
      chatApi.getUnread().then(d => setUnreadChat(d.count)).catch(() => {});
      notificationsApi.getUnreadCount().then(d => setUnreadNotif(d.count)).catch(() => {});
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        .navbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:64px;background:#FFFFFF;border-bottom:1px solid #E2E8F0}
        .navbar-search{display:flex;align-items:center;gap:10px;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:10px 16px;flex:1;max-width:480px;cursor:pointer;transition:border-color 0.2s,box-shadow 0.2s,background 0.2s}
        .navbar-search:hover{border-color:#94A3B8;background:#FFFFFF;box-shadow:0 0 0 3px rgba(37,99,235,0.10)}
        .navbar-right{display:flex;align-items:center;gap:12px;margin-left:20px}
        .navbar-location{display:flex;align-items:center;gap:6px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:8px 14px}
        .navbar-icon-btn{position:relative;cursor:pointer}
        .navbar-icon-inner{width:40px;height:40px;border-radius:12px;background:#FFFFFF;border:1px solid #E2E8F0;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .navbar-icon-inner.is-chat{background:#FFFFFF}
        .navbar-icon-inner.is-chat:hover{background:#F8FAFC;border-color:#E2E8F0;transform:translateY(-1px)}
        .navbar-icon-inner.is-notif{background:#FFFFFF;border-color:#E2E8F0}
        .navbar-icon-inner.is-notif:hover{background:#F8FAFC;border-color:#E2E8F0;transform:translateY(-1px)}
        .navbar-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:99px;border:2px solid #FFFFFF;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;padding:0 4px;box-shadow:0 1px 3px rgba(15,23,42,0.18)}
        .navbar-badge.is-chat{background:#2563EB}
        .navbar-badge.is-notif{background:#F59E0B}
        .navbar-avatar{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#2563EB,#4F46E5);border:1px solid rgba(37,99,235,0.22);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;cursor:pointer;transition:all 0.15s;box-shadow:0 2px 8px rgba(37,99,235,0.28)}
        .navbar-avatar:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(37,99,235,0.36)}
        @media(max-width:1024px){.navbar{padding:0 16px 0 64px}.navbar-location{display:none}}
        @media(max-width:640px){.navbar-search{max-width:none}}
      `}</style>
      <nav className="navbar">
        <div className="navbar-search" onClick={() => router.push("/search")}>
          <Search size={16} style={{color:"#64748B",flexShrink:0}}/>
          <span style={{fontSize:14,color:"#64748B",userSelect:"none"}}>Pesquise um serviço...</span>
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
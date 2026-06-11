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

  // FIX hydration mismatch — getSession() lê localStorage que não existe no servidor
  // Antes: const user = getSession() no topo → servidor retorna null → inicial "C"
  //        cliente lê localStorage → inicial diferente → MISMATCH
  // Depois: sempre começa com "?" no servidor E no cliente, só actualiza após mount
  const [initials, setInitials] = useState("?");

  useEffect(() => {
    // Lê sessão apenas no cliente após hydration completa
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
        .navbar{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:64px;background:#080e1a;border-bottom:1px solid #1a2535}
        .navbar-search{display:flex;align-items:center;gap:10px;background:#0d1520;border:1px solid #1a2535;border-radius:12px;padding:10px 16px;flex:1;max-width:480px;cursor:pointer;transition:border 0.2s}
        .navbar-search:hover{border-color:#1D9E75}
        .navbar-right{display:flex;align-items:center;gap:12px;margin-left:20px}
        .navbar-location{display:flex;align-items:center;gap:6px;background:#0d1520;border:1px solid #1a2535;border-radius:10px;padding:8px 14px}
        .navbar-icon-btn{position:relative;cursor:pointer}
        .navbar-icon-inner{width:40px;height:40px;border-radius:12px;background:#0d1520;border:1px solid #1a2535;display:flex;align-items:center;justify-content:center;transition:all 0.15s}
        .navbar-icon-inner:hover{border-color:#1D9E75}
        .navbar-badge{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;border-radius:99px;background:#EF9F27;border:2px solid #080e1a;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#0d1117;padding:0 4px}
        .navbar-avatar{width:40px;height:40px;border-radius:12px;background:#1a3a2a;border:1px solid #1d9e7440;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#1D9E75;cursor:pointer;transition:all 0.15s}
        .navbar-avatar:hover{border-color:#1D9E75}
        @media(max-width:1024px){.navbar{padding:0 16px 0 64px}.navbar-location{display:none}}
        @media(max-width:640px){.navbar-search{max-width:none}}
      `}</style>
      <nav className="navbar">
        <div className="navbar-search" onClick={() => router.push("/search")}>
          <Search size={16} style={{color:"#4a7070",flexShrink:0}}/>
          <span style={{fontSize:14,color:"#4a5a6a",userSelect:"none"}}>Pesquise um serviço...</span>
        </div>
        <div className="navbar-right">
          <div className="navbar-location">
            <MapPin size={14} style={{color:"#1D9E75"}}/>
            <span style={{fontSize:13,color:"#8a9ab0"}}>Luanda, Angola</span>
          </div>
          <div className="navbar-icon-btn" onClick={()=>router.push("/chat")}>
            <div className="navbar-icon-inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a9ab0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            {unreadChat > 0 && <span className="navbar-badge">{unreadChat > 99 ? "99+" : unreadChat}</span>}
          </div>
          <div className="navbar-icon-btn" onClick={()=>router.push("/notifications")}>
            <div className="navbar-icon-inner">
              <Bell size={18} style={{color:"#8a9ab0"}}/>
            </div>
            {unreadNotif > 0 && <span className="navbar-badge">{unreadNotif > 99 ? "99+" : unreadNotif}</span>}
          </div>
          <div className="navbar-avatar" onClick={()=>router.push("/profile/client")}>
            {initials}
          </div>
        </div>
      </nav>
    </>
  );
}
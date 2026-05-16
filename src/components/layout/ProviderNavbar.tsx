"use client";
import { useRouter } from "next/navigation";
import { Bell, Search, MapPin } from "lucide-react";

export default function ProviderNavbar() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .pnavbar { position:sticky; top:0; z-index:30; display:flex; align-items:center; justify-content:space-between; padding:0 28px; height:64px; background:#080e1a; border-bottom:1px solid #1a2535; }
        .pnavbar-search { display:flex; align-items:center; gap:10px; background:#0d1520; border:1px solid #1a2535; border-radius:12px; padding:10px 16px; flex:1; max-width:480px; }
        .pnavbar-search input { background:none; border:none; outline:none; font-size:14px; color:#8a9ab0; width:100%; font-family:inherit; }
        .pnavbar-right { display:flex; align-items:center; gap:12px; margin-left:20px; }
        .pnavbar-location { display:flex; align-items:center; gap:6px; background:#0d1520; border:1px solid #1a2535; border-radius:10px; padding:8px 14px; }
        .pnavbar-bell { position:relative; cursor:pointer; }
        .pnavbar-bell-inner { width:40px; height:40px; border-radius:12px; background:#0d1520; border:1px solid #1a2535; display:flex; align-items:center; justify-content:center; }
        .pnavbar-bell-dot { position:absolute; top:8px; right:8px; width:8px; height:8px; border-radius:50%; background:#EF9F27; border:2px solid #080e1a; }
        .pnavbar-avatar { width:40px; height:40px; border-radius:12px; background:#2a1e08; border:1px solid #EF9F2740; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#EF9F27; cursor:pointer; }
        @media(max-width:1024px) {
          .pnavbar { padding:0 16px 0 64px; }
          .pnavbar-location { display:none; }
        }
        @media(max-width:640px) {
          .pnavbar-search input::placeholder { font-size:12px; }
        }
      `}</style>
      <nav className="pnavbar">
        <div className="pnavbar-search">
          <Search size={16} style={{ color:"#7a6040", flexShrink:0 }} />
          <input placeholder="Pesquise clientes, serviços ou pedidos..." />
        </div>
        <div className="pnavbar-right">
          <div className="pnavbar-location">
            <MapPin size={14} style={{ color:"#EF9F27" }} />
            <span style={{ fontSize:13, color:"#8a9ab0" }}>Luanda, Angola</span>
          </div>
          <div className="pnavbar-bell" onClick={() => router.push("/provider/notifications")}>
            <div className="pnavbar-bell-inner">
              <Bell size={18} style={{ color:"#8a9ab0" }} />
            </div>
            <span className="pnavbar-bell-dot" />
          </div>
          <div className="pnavbar-avatar" onClick={() => router.push("/provider/profile")}>P</div>
        </div>
      </nav>
    </>
  );
}
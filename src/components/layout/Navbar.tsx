"use client";
import { useRouter } from "next/navigation";
import { Bell, Search, MapPin } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .navbar { position:sticky; top:0; z-index:30; display:flex; align-items:center; justify-content:space-between; padding:0 28px; height:64px; background:#080e1a; border-bottom:1px solid #1a2535; }
        .navbar-search { display:flex; align-items:center; gap:10px; background:#0d1520; border:1px solid #1a2535; border-radius:12px; padding:10px 16px; flex:1; max-width:480px; }
        .navbar-search input { background:none; border:none; outline:none; font-size:14px; color:#8a9ab0; width:100%; font-family:inherit; }
        .navbar-right { display:flex; align-items:center; gap:12px; margin-left:20px; }
        .navbar-location { display:flex; align-items:center; gap:6px; background:#0d1520; border:1px solid #1a2535; border-radius:10px; padding:8px 14px; }
        .navbar-bell { position:relative; cursor:pointer; }
        .navbar-bell-inner { width:40px; height:40px; border-radius:12px; background:#0d1520; border:1px solid #1a2535; display:flex; align-items:center; justify-content:center; }
        .navbar-bell-dot { position:absolute; top:8px; right:8px; width:8px; height:8px; border-radius:50%; background:#EF9F27; border:2px solid #080e1a; }
        .navbar-avatar { width:40px; height:40px; border-radius:12px; background:#1a3a2a; border:1px solid #1d9e7440; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#1D9E75; cursor:pointer; }
        @media(max-width:1024px) {
          .navbar { padding:0 16px 0 64px; }
          .navbar-location { display:none; }
        }
        @media(max-width:640px) {
          .navbar-search { max-width:none; }
          .navbar-search input::placeholder { font-size:12px; }
        }
      `}</style>
      <nav className="navbar">
        <div className="navbar-search">
          <Search size={16} style={{ color:"#4a7070", flexShrink:0 }} />
          <input placeholder="Pesquise um serviço..." />
        </div>
        <div className="navbar-right">
          <div className="navbar-location">
            <MapPin size={14} style={{ color:"#1D9E75" }} />
            <span style={{ fontSize:13, color:"#8a9ab0" }}>Luanda, Angola</span>
          </div>
          <div className="navbar-bell" onClick={() => router.push("/notifications")}>
            <div className="navbar-bell-inner">
              <Bell size={18} style={{ color:"#8a9ab0" }} />
            </div>
            <span className="navbar-bell-dot" />
          </div>
          <div className="navbar-avatar" onClick={() => router.push("/profile/client")}>U</div>
        </div>
      </nav>
    </>
  );
}
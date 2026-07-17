"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Search, MapPin, Briefcase, MessageCircle,
  Bell, Wallet, User, Settings, LogOut, Zap, X, Menu,
} from "lucide-react";
import { clearAllSessions } from "@/lib/auth.api";

const navItems = [
  { section: "Principal", items: [
    { label: "Início",    icon: Home,          href: "/home"      },
    { label: "Pesquisar", icon: Search,         href: "/search"    },
    { label: "Mapa",      icon: MapPin,         href: "/map"       },
    { label: "Serviços",  icon: Briefcase,      href: "/services"  },
  ]},
  { section: "Comunicação", items: [
    { label: "Chat",          icon: MessageCircle, href: "/chat"          },
    { label: "Notificações",  icon: Bell,          href: "/notifications" },
  ]},
  { section: "Financeiro", items: [
    // FIX: "Transacções" removida — o histórico de pagamentos passou a
    // viver dentro de /wallet (renomeada para histórico de pagamentos),
    // que já mostra tudo o que essa página mostraria, e essa página
    // nunca teve backend ligado.
    { label: "Pagamentos",   icon: Wallet,  href: "/wallet" },
  ]},
  { section: "Conta", items: [
    { label: "Perfil",      icon: User,     href: "/profile/client" },
    { label: "Definições",  icon: Settings, href: "/settings"       },
  ]},
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = () => {
    onClose?.();
    clearAllSessions();
    router.push("/?logout=1");
  };

  return (
    <>
      <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid #1a2535", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"#1D9E75", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Zap size={20} color="white"/>
          </div>
          <span style={{ fontSize:20, fontWeight:700, color:"#e2e8f0" }}>
            Servi<span style={{ color:"#1D9E75" }}>app</span>
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#4a6a6a", display:"flex" }}>
            <X size={20}/>
          </button>
        )}
      </div>

      <div className="sb-nav">
        {navItems.map(group => (
          <div key={group.section} style={{ marginBottom:8 }}>
            <p style={{ padding:"10px 20px 4px", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"#2a3a4a" }}>
              {group.section}
            </p>
            {group.items.map(item => {
              const Icon   = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose?.()}
                  style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"11px 20px", fontSize:14, fontWeight:500,
                    color: active ? "#1D9E75" : "#6a7a8a",
                    background: active ? "#1d9e7512" : "transparent",
                    borderLeft: `3px solid ${active ? "#1D9E75" : "transparent"}`,
                    textDecoration:"none", transition:"all 0.15s",
                  }}
                >
                  <Icon size={18}/>
                  <span style={{ flex:1 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

       <div style={{ padding:"16px 20px", borderTop:"1px solid #1a2535", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:"#1a3a2a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#1D9E75", flexShrink:0 }}>C</div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:600, color:"#c0d0e0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>O meu perfil</p>
          <p style={{ fontSize:12, color:"#4a5a6a" }}>Cliente</p>
        </div>
        <button
          onClick={handleLogout}
          style={{ background:"none", border:"none", cursor:"pointer", padding:4, display:"flex", alignItems:"center" }}
          aria-label="Terminar sessão"
        >
          <LogOut size={16} style={{ color:"#3a4a5a" }}/>
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        .sb-desktop{position:fixed;left:0;top:0;height:100vh;height:100dvh;width:240px;background:#080e1a;border-right:1px solid #1a2535;display:flex;flex-direction:column;z-index:40}
        .sb-toggle{display:none;position:fixed;top:14px;left:14px;z-index:50;width:40px;height:40px;border-radius:12px;background:#080e1a;border:1px solid #1a2535;align-items:center;justify-content:center;cursor:pointer}
        .sb-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:2000;display:none}
        .sb-drawer{position:fixed;left:0;top:0;height:100vh;height:100dvh;width:240px;background:#080e1a;border-right:1px solid #1a2535;display:flex;flex-direction:column;z-index:2001;transform:translateX(-100%);transition:transform 0.25s ease}
        .sb-drawer.open{transform:translateX(0)}
        .sb-nav{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 0}
        .sb-footer{padding:16px 20px;border-top:1px solid #1a2535;display:flex;align-items:center;gap:12}
        @media(max-width:1024px){
          .sb-desktop{display:none!important}
          .sb-toggle{display:flex!important}
          .sb-close{display:flex!important}
          .sb-nav{padding:8px 0}
          .sb-footer{padding:12px 20px}
        }
      `}</style>

      <aside className="sb-desktop"><SidebarContent/></aside>

      <button className="sb-toggle" onClick={() => setOpen(true)}>
        <Menu size={20} color="#8a9ab0"/>
      </button>

      {open && <div className="sb-overlay" onClick={() => setOpen(false)}/>}

      <aside className={`sb-drawer${open ? " open" : ""}`}>
        <SidebarContent onClose={() => setOpen(false)}/>
      </aside>
    </>
  );
}
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
      <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:11, background:"#2563EB", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(37,99,235,0.32)" }}>
            <Zap size={20} color="white"/>
          </div>
          <span style={{ fontSize:20, fontWeight:700, color:"#0F172A" }}>
            Servi<span style={{ color:"#2563EB" }}>app</span>
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="sb-close-btn">
            <X size={20}/>
          </button>
        )}
      </div>

      <div className="sb-nav">
        {navItems.map(group => (
          <div key={group.section} style={{ marginBottom:8 }}>
            <p style={{ padding:"10px 20px 4px", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"#94A3B8" }}>
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
                  className={`sb-link${active ? " active" : ""}`}
                >
                  <Icon size={18} className="sb-link-icon"/>
                  <span className="sb-link-text" style={{ flex:1 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

       <div style={{ margin:"8px 12px 12px", padding:"12px 14px", background:"#FFFFFF", border:"1px solid #E2E8F0", borderRadius:14, boxShadow:"0 1px 3px rgba(15,23,42,0.05)", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#2563EB,#4F46E5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#FFFFFF", flexShrink:0, boxShadow:"0 2px 6px rgba(37,99,235,0.28)" }}>C</div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:600, color:"#0F172A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>O meu perfil</p>
          <p style={{ fontSize:12, color:"#64748B" }}>Cliente</p>
        </div>
        <button
          onClick={handleLogout}
          className="sb-logout-btn"
          aria-label="Terminar sessão"
        >
          <LogOut size={16}/>
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
        .sb-desktop{position:fixed;left:0;top:0;height:100vh;height:100dvh;width:240px;background:#F8FAFC;border-right:1px solid #E2E8F0;display:flex;flex-direction:column;z-index:40}
        .sb-toggle{display:none;position:fixed;top:14px;left:14px;z-index:50;width:40px;height:40px;border-radius:12px;background:#FFFFFF;border:1px solid #E2E8F0;align-items:center;justify-content:center;cursor:pointer;color:#475569;box-shadow:0 2px 8px rgba(15,23,42,0.08);transition:all 0.15s}
        .sb-toggle:hover{border-color:#2563EB;color:#2563EB}
        .sb-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:2000;display:none}
        .sb-drawer{position:fixed;left:0;top:0;height:100vh;height:100dvh;width:240px;background:#F8FAFC;border-right:1px solid #E2E8F0;display:flex;flex-direction:column;z-index:2001;transform:translateX(-100%);transition:transform 0.25s ease;box-shadow:8px 0 28px rgba(15,23,42,0.10)}
        .sb-drawer.open{transform:translateX(0)}

        /* Scrollbar discreta — antes usava o scrollbar preto/escuro por
           omissão do browser, que destacava demais em cima do menu claro.
           Agora é fina, cinza-clara e só aparece de facto ao fazer hover. */
        .sb-nav{
          flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 0;
          scrollbar-width:thin;
          scrollbar-color:rgba(148,163,184,0.35) transparent;
        }
        .sb-nav::-webkit-scrollbar{width:5px}
        .sb-nav::-webkit-scrollbar-track{background:transparent}
        .sb-nav::-webkit-scrollbar-thumb{background-color:rgba(148,163,184,0.35);border-radius:99px}
        .sb-nav::-webkit-scrollbar-thumb:hover{background-color:rgba(148,163,184,0.6)}

        .sb-footer{padding:16px 20px;border-top:1px solid #E2E8F0;display:flex;align-items:center;gap:12}

        .sb-link{position:relative;display:flex;align-items:center;gap:12px;margin:2px 10px 2px 0;padding:11px 20px 11px 16px;font-size:14px;font-weight:500;border-left:4px solid transparent;border-radius:0 10px 10px 0;text-decoration:none;transition:background 0.15s ease,border-color 0.15s ease}
        .sb-link:hover{background:#EEF4FF}
        .sb-link .sb-link-icon{color:#64748B;transition:color 0.15s ease;flex-shrink:0}
        .sb-link:hover .sb-link-icon{color:#2563EB}
        .sb-link .sb-link-text{color:#475569;transition:color 0.15s ease}
        .sb-link:hover .sb-link-text{color:#2563EB}
        .sb-link.active{background:#DBEAFE;border-left-color:#2563EB}
        .sb-link.active .sb-link-icon{color:#2563EB}
        .sb-link.active .sb-link-text{color:#1D4ED8;font-weight:600}

        .sb-close-btn{background:none;border:none;cursor:pointer;color:#94A3B8;display:flex;padding:4px;border-radius:8px;transition:all 0.15s ease}
        .sb-close-btn:hover{color:#1F2937;background:#F1F5F9}

        .sb-logout-btn{background:none;border:none;cursor:pointer;padding:6px;display:flex;align-items:center;border-radius:8px;color:#94A3B8;transition:color 0.15s ease,background 0.15s ease;flex-shrink:0}
        .sb-logout-btn:hover{color:#EF4444;background:#FEF2F2}

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
        <Menu size={20}/>
      </button>

      {open && <div className="sb-overlay" onClick={() => setOpen(false)}/>}

      <aside className={`sb-drawer${open ? " open" : ""}`}>
        <SidebarContent onClose={() => setOpen(false)}/>
      </aside>
    </>
  );
}
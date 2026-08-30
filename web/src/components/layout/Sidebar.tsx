"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Search, MapPin, Briefcase, MessageCircle,
  Bell, Wallet, User, Settings, LogOut, Zap, X, HelpCircle,
} from "lucide-react";
import { clearAllSessions } from "@/lib/auth.api";
import BottomNav from "@/components/layout/BottomNav";

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
    { label: "Pagamentos",   icon: Wallet,  href: "/wallet" },
  ]},
  { section: "Conta", items: [
    { label: "Perfil",         icon: User,        href: "/profile/client" },
    { label: "Como funciona",  icon: HelpCircle,  href: "/como-funciona"  },
    { label: "Definições",     icon: Settings,    href: "/settings"       },
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
          <div style={{ width:36, height:36, borderRadius:11, background:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <img src="/logo-64.png" alt="Mestroo" style={{width:36,height:36,objectFit:"contain"}}/>
          </div>
          <span style={{ fontSize:20, fontWeight:700, color:"#0F172A" }}>
            Mestroo
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
        <div style={{ width:36, height:36, borderRadius:"50%", background:"#0F172A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#FFFFFF", flexShrink:0, boxShadow:"0 2px 6px rgba(15,23,42,0.24)" }}>C</div>
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

  // Botão hambúrguer: vive DENTRO do <Navbar/> (inline, ao lado da
  // pesquisa) nas páginas que o montam — via evento global
  // "sidebar:toggle" que este componente escuta. Páginas sem Navbar
  // (ex: /chat/[id]) têm o seu próprio botão inline no cabeçalho,
  // que dispara o mesmo evento — ver esse ficheiro para detalhes.
  // Nenhum botão fixed/flutuante é usado aqui: um botão position:fixed
  // solto na página, independente do fluxo normal do layout, foi a
  // causa de dois bugs anteriores (mover-se com o scroll; e, quando
  // aumentado para ocupar toda a faixa do topo, ficar visualmente
  // desalinhado da barra de pesquisa em vez de ficar ao lado dela).
  useEffect(() => {
    const handleToggle = () => setOpen((current) => !current);
    window.addEventListener("sidebar:toggle", handleToggle);
    return () => window.removeEventListener("sidebar:toggle", handleToggle);
  }, []);

  return (
    <>
      <style>{`
        .sb-desktop{position:fixed;left:0;top:0;height:100vh;height:100dvh;width:240px;background:#F8FAFC;border-right:1px solid #E2E8F0;display:flex;flex-direction:column;z-index:40}
        .sb-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:2000;display:none}
        .sb-drawer{position:fixed;left:0;top:0;height:100vh;height:100dvh;width:240px;background:#F8FAFC;border-right:1px solid #E2E8F0;display:flex;flex-direction:column;z-index:2001;transform:translateX(-100%);transition:transform 0.25s ease;box-shadow:8px 0 28px rgba(15,23,42,0.10)}
        .sb-drawer.open{transform:translateX(0)}

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
        .sb-link:hover{background:#F1F5F9}
        .sb-link .sb-link-icon{color:#64748B;transition:color 0.15s ease;flex-shrink:0}
        .sb-link:hover .sb-link-icon{color:#0F172A}
        .sb-link .sb-link-text{color:#475569;transition:color 0.15s ease}
        .sb-link:hover .sb-link-text{color:#0F172A}
        .sb-link.active{background:#EEF0F3;border-left-color:#0F172A}
        .sb-link.active .sb-link-icon{color:#0F172A}
        .sb-link.active .sb-link-text{color:#0F172A;font-weight:600}

        .sb-close-btn{background:none;border:none;cursor:pointer;color:#94A3B8;display:flex;padding:4px;border-radius:8px;transition:all 0.15s ease}
        .sb-close-btn:hover{color:#1F2937;background:#F1F5F9}

        .sb-logout-btn{background:none;border:none;cursor:pointer;padding:6px;display:flex;align-items:center;border-radius:8px;color:#94A3B8;transition:color 0.15s ease,background 0.15s ease;flex-shrink:0}
        .sb-logout-btn:hover{color:#EF4444;background:#FEF2F2}

        @media(max-width:1024px){
          .sb-desktop{display:none!important}
          .sb-close{display:flex!important}
          .sb-nav{padding:8px 0}
          .sb-footer{padding:12px 20px}
        }
      `}</style>

      <aside className="sb-desktop"><SidebarContent/></aside>

      {open && <div className="sb-overlay" onClick={() => setOpen(false)}/>}

      <aside className={`sb-drawer${open ? " open" : ""}`}>
        <SidebarContent onClose={() => setOpen(false)}/>
      </aside>

      {/* Bottom navigation — mobile only (ver media query no BottomNav) */}
      <BottomNav role="client" />
    </>
  );
}
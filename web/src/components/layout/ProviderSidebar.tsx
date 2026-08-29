"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, BarChart3, MessageCircle, Bell,
  Wallet, User, Settings, LogOut, Zap,
  Star, X, Menu, ShoppingBag, ClipboardList,
} from "lucide-react";
import { clearAllSessions } from "@/lib/auth.api";
import BottomNav from "@/components/layout/BottomNav";
 
const NAV = [
  {
    section: "Principal",
    items: [
      { label: "Início",       icon: Home,     href: "/provider-home" },
      { label: "Estatísticas", icon: BarChart3, href: "/provider/stats" },
    ],
  },
  {
    section: "Mercado",
    items: [
      { label: "Pedidos disponíveis", icon: ShoppingBag,   href: "/provider/services" },
      { label: "Os meus trabalhos",   icon: ClipboardList, href: "/provider/services/new" },
    ],
  },
  {
    section: "Comunicação",
    items: [
      { label: "Chat",         icon: MessageCircle, href: "/provider/chat" },
      { label: "Notificações", icon: Bell,          href: "/provider/notifications" },
    ],
  },
  {
    section: "Financeiro",
    items: [
      { label: "Wallet", icon: Wallet, href: "/provider/wallet" },
    ],
  },
  {
    section: "Perfil",
    items: [
      { label: "Perfil & Catálogo", icon: User,        href: "/provider/profile" },
      { label: "Avaliações",        icon: Star,        href: "/provider/reviews" },
      { label: "Definições",        icon: Settings,    href: "/provider/settings" },
    ],
  },
];
 
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
 
  function isActive(href: string): boolean {
    if (href === "/provider-home") return pathname === "/provider-home";
    return pathname === href;
  }

  const handleLogout = () => {
    onClose?.();
    clearAllSessions();
    router.push("/");
  };
 
  return (
    <>
      {/* ── Logo header ───────────────────────────────────────────────── */}
      <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"#0F172A", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(15,23,42,0.24)" }}>
            <Zap size={20} color="#fff"/>
          </div>
          <div>
            <span style={{ fontSize:18, fontWeight:700, color:"#0F172A" }}>
              Mestroo
            </span>
            <div style={{ fontSize:10, color:"#94A3B8", fontWeight:600, letterSpacing:"0.07em", marginTop:1 }}>PAINEL PRESTADOR</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="psb-close-btn">
            <X size={20}/>
          </button>
        )}
      </div>
 
      {/* ── Nav links ─────────────────────────────────────────────────── */}
      <div className="psb-nav">
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom:4 }}>
            <p style={{ padding:"10px 20px 4px", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"#94A3B8" }}>
              {group.section}
            </p>
            {group.items.map(item => {
              const Icon   = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose?.()}
                  className={`psb-link${active ? " psb-link--active" : ""}`}
                >
                  <Icon size={17} className="psb-link-icon"/>
                  <span className="psb-link-text" style={{ flex:1 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
 
      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div style={{ margin:"8px 12px 12px", padding:"12px 14px", background:"#FFFFFF", border:"1px solid #E2E8F0", borderRadius:14, boxShadow:"0 1px 3px rgba(15,23,42,0.05)", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:"#0F172A", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff", flexShrink:0, boxShadow:"0 2px 6px rgba(15,23,42,0.24)" }}>P</div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:600, color:"#0F172A", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", marginBottom:2 }}>Prestador</p>
          <p style={{ fontSize:11, color:"#64748B" }}>Conta activa</p>
        </div>
        <button
          onClick={handleLogout}
          className="psb-logout-btn"
          aria-label="Terminar sessão"
        >
          <LogOut size={16}/>
        </button>
      </div>
    </>
  );
}
 
export default function ProviderSidebar() {
  const [open, setOpen] = useState(false);
 
  return (
    <>
      <style>{`
        /* ── Desktop sidebar ──────────────────────────────────────────── */
        .psb-d {
          position: fixed; left: 0; top: 0;
          height: 100vh; height: 100dvh; width: 240px;
          background: #F8FAFC; border-right: 1px solid #E2E8F0;
          display: flex; flex-direction: column; z-index: 700; overflow: hidden;
        }

        /* ── Mobile toggle button ─────────────────────────────────────── */
        .psb-mb {
          display: none;
          position: fixed;
          /* CORRIGIDO — mesmo fix do Sidebar do cliente: top:14px
             desalinhava ao fazer scroll em Safari/Chrome mobile porque
             a barra de endereço muda a altura visível e o toggle ficava
             a flutuar. Agora ocupa toda a altura do Navbar (top:0,
             height:64px) e centra o ícone via flexbox — sempre alinhado
             independentemente de reflows do browser. */
          top: 0; left: 0;
          height: 64px; width: 64px;
          z-index: 700;
          align-items: center; justify-content: center;
          cursor: pointer;
          color: #475569;
          background: transparent;
          border: none;
          transition: color 0.15s;
        }
        @media(hover:hover){
          .psb-mb:hover { color: #0F172A; }
        }
        .psb-mb:active { transform: scale(0.92); }

        /* ── Overlay ──────────────────────────────────────────────────── */
        .psb-ov {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45); z-index: 2000; display: none;
        }

        /* ── Drawer (mobile) ──────────────────────────────────────────── */
        .psb-dr {
          position: fixed; left: 0; top: 0;
          height: 100vh; height: 100dvh; width: 240px;
          background: #F8FAFC; border-right: 1px solid #E2E8F0;
          display: flex; flex-direction: column; z-index: 2001;
          transform: translateX(-100%); transition: transform 0.25s ease;
          overflow: hidden; box-shadow: 8px 0 28px rgba(15,23,42,0.10);
        }
        .psb-dr.open { transform: translateX(0); }

        /* ── Scrollable nav area ──────────────────────────────────────── */
        .psb-nav {
          flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
          padding: 8px 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(148,163,184,0.35) transparent;
        }
        .psb-nav::-webkit-scrollbar { width: 5px; }
        .psb-nav::-webkit-scrollbar-track { background: transparent; }
        .psb-nav::-webkit-scrollbar-thumb { background-color: rgba(148,163,184,0.35); border-radius: 99px; }
        .psb-nav::-webkit-scrollbar-thumb:hover { background-color: rgba(148,163,184,0.6); }

        /* ── Nav link base ────────────────────────────────────────────── */
        .psb-link {
          position: relative; display: flex; align-items: center; gap: 12px;
          margin: 2px 10px 2px 0; padding: 11px 20px 11px 16px;
          font-size: 14px; font-weight: 500;
          border-left: 4px solid transparent;
          border-radius: 0 10px 10px 0;
          text-decoration: none; transition: background 0.15s ease, border-color 0.15s ease;
        }
        .psb-link:hover { background: #F1F5F9; }
        .psb-link .psb-link-icon { color: #64748B; transition: color 0.15s ease; flex-shrink: 0; }
        .psb-link:hover .psb-link-icon { color: #0F172A; }
        .psb-link .psb-link-text { color: #475569; transition: color 0.15s ease; }
        .psb-link:hover .psb-link-text { color: #0F172A; }

        /* ── Active state ─────────────────────────────────────────────── */
        .psb-link--active { background: #EEF0F3; border-left-color: #0F172A; }
        .psb-link--active .psb-link-icon { color: #0F172A; }
        .psb-link--active .psb-link-text { color: #0F172A; font-weight: 600; }

        /* ── Close button (mobile drawer) ─────────────────────────────── */
        .psb-close-btn {
          background: none; border: none; cursor: pointer;
          color: #94A3B8; display: flex; padding: 4px; border-radius: 8px;
          transition: all 0.15s ease;
        }
        .psb-close-btn:hover { color: #1F2937; background: #F1F5F9; }

        /* ── Logout button ────────────────────────────────────────────── */
        .psb-logout-btn {
          background: none; border: none; cursor: pointer;
          padding: 6px; display: flex; align-items: center;
          border-radius: 8px; color: #94A3B8;
          transition: color 0.15s ease, background 0.15s ease; flex-shrink: 0;
        }
        .psb-logout-btn:hover { color: #EF4444; background: #FEF2F2; }

        @media (max-width: 1024px) {
          .psb-d  { display: none !important; }
          .psb-mb { display: flex !important; }
          .psb-ov.open { display: block !important; }
          .psb-nav { padding: 6px 0; }
        }
      `}</style>

      {/* Desktop */}
      <aside className="psb-d"><SidebarContent/></aside>

      {/* Mobile toggle */}
      <button className="psb-mb" onClick={() => setOpen(true)}>
        <Menu size={20}/>
      </button>

      {/* Overlay */}
      <div className={`psb-ov${open ? " open" : ""}`} onClick={() => setOpen(false)}/>

      {/* Drawer */}
      <aside className={`psb-dr${open ? " open" : ""}`}>
        <SidebarContent onClose={() => setOpen(false)}/>
      </aside>

      {/* Bottom navigation — mobile only (ver media query no BottomNav) */}
      <BottomNav role="provider" />
    </>
  );
}
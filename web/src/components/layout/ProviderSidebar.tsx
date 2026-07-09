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
      // FIX: "Transacções" removida — o histórico de ganhos já vive
      // dentro de /provider/wallet, que mostra tudo o que essa página
      // mostraria, e essa página nunca teve backend ligado.
      { label: "Wallet", icon: Wallet, href: "/provider/wallet" },
    ],
  },
  {
    section: "Perfil",
    items: [
      { label: "Perfil & Catálogo", icon: User,     href: "/provider/profile" },
      { label: "Avaliações",        icon: Star,     href: "/provider/reviews" },
      { label: "Definições",        icon: Settings, href: "/provider/settings" },
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
      <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid #1a2535", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"#EF9F27", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Zap size={20} color="#0d1117"/>
          </div>
          <div>
            <span style={{ fontSize:18, fontWeight:700, color:"#e2e8f0" }}>
              Servi<span style={{ color:"#EF9F27" }}>app</span>
            </span>
            <div style={{ fontSize:10, color:"#EF9F27", fontWeight:600, letterSpacing:"0.07em", marginTop:1 }}>PAINEL PRESTADOR</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#4a6a6a", display:"flex" }}>
            <X size={20}/>
          </button>
        )}
      </div>
 
      <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom:4 }}>
            <p style={{ padding:"10px 20px 4px", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"#2a3a4a" }}>
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
                  style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"11px 20px", fontSize:14, fontWeight:500,
                    color: active ? "#EF9F27" : "#6a7a8a",
                    background: active ? "#EF9F2712" : "transparent",
                    borderLeft: `3px solid ${active ? "#EF9F27" : "transparent"}`,
                    textDecoration:"none", transition:"all 0.15s",
                  }}
                >
                  <Icon size={17}/>
                  <span style={{ flex:1 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
 
      <div style={{ padding:"16px 20px", borderTop:"1px solid #1a2535", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:"50%", background:"#2a1e08", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#EF9F27", flexShrink:0 }}>P</div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>Prestador</p>
          <p style={{ fontSize:11, color:"#4a5a6a" }}>Conta activa</p>
        </div>
        <LogOut
          size={16}
          style={{ color:"#3a4a5a", cursor:"pointer", flexShrink:0 }}
          onClick={handleLogout}
        />
      </div>
    </>
  );
}
 
export default function ProviderSidebar() {
  const [open, setOpen] = useState(false);
 
  return (
    <>
      <style>{`
        .psb-d{position:fixed;left:0;top:0;height:100vh;width:240px;background:#080e1a;border-right:1px solid #1a2535;display:flex;flex-direction:column;z-index:40;overflow:hidden}
        .psb-mb{display:none;position:fixed;top:14px;left:14px;z-index:50;width:40px;height:40px;border-radius:12px;background:#080e1a;border:1px solid #1a2535;align-items:center;justify-content:center;cursor:pointer}
        .psb-ov{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:45;display:none}
        .psb-dr{position:fixed;left:0;top:0;height:100vh;width:240px;background:#080e1a;border-right:1px solid #1a2535;display:flex;flex-direction:column;z-index:46;transform:translateX(-100%);transition:transform 0.25s ease;overflow:hidden}
        .psb-dr.open{transform:translateX(0)}
        @media(max-width:1024px){
          .psb-d{display:none!important}
          .psb-mb{display:flex!important}
          .psb-ov.open{display:block!important}
        }
      `}</style>
      <aside className="psb-d"><SidebarContent/></aside>
      <button className="psb-mb" onClick={()=>setOpen(true)}><Menu size={20} color="#8a9ab0"/></button>
      <div className={`psb-ov${open?" open":""}`} onClick={()=>setOpen(false)}/>
      <aside className={`psb-dr${open?" open":""}`}><SidebarContent onClose={()=>setOpen(false)}/></aside>
    </>
  );
}
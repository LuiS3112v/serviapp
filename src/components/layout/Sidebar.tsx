"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, MapPin, Briefcase, MessageCircle, Bell, Wallet, Receipt, User, Settings, LogOut, Zap } from "lucide-react";

const navItems = [
  { section: "Principal", items: [
    { label: "Início", icon: Home, href: "/home" },
    { label: "Pesquisar", icon: Search, href: "/search" },
    { label: "Mapa", icon: MapPin, href: "/map" },
    { label: "Serviços", icon: Briefcase, href: "/services" },
  ]},
  { section: "Comunicação", items: [
    { label: "Chat", icon: MessageCircle, href: "/chat" },
    { label: "Notificações", icon: Bell, href: "/notifications" },
  ]},
  { section: "Financeiro", items: [
    { label: "Wallet", icon: Wallet, href: "/wallet" },
    { label: "Transacções", icon: Receipt, href: "/transactions" },
  ]},
  { section: "Conta", items: [
    { label: "Perfil", icon: User, href: "/profile/client" },
    { label: "Definições", icon: Settings, href: "/settings" },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside style={{ position:"fixed",left:0,top:0,height:"100vh",width:240,background:"#080e1a",borderRight:"1px solid #1a2535",display:"flex",flexDirection:"column",zIndex:40 }}>
      <div style={{ padding:"24px 20px",borderBottom:"1px solid #1a2535",display:"flex",alignItems:"center",gap:10 }}>
        <div style={{ width:36,height:36,borderRadius:10,background:"#1D9E75",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <Zap size={20} color="white" />
        </div>
        <span style={{ fontSize:20,fontWeight:700,color:"#e2e8f0" }}>
          Servi<span style={{ color:"#1D9E75" }}>app</span>
        </span>
      </div>

      <div style={{ flex:1,overflowY:"auto",padding:"12px 0" }}>
        {navItems.map(group => (
          <div key={group.section} style={{ marginBottom:8 }}>
            <p style={{ padding:"10px 20px 4px",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",color:"#2a3a4a" }}>
              {group.section}
            </p>
            {group.items.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 20px",fontSize:14,fontWeight:500,color:active?"#1D9E75":"#6a7a8a",background:active?"#1d9e7512":"transparent",borderLeft:active?"3px solid #1D9E75":"3px solid transparent",textDecoration:"none",transition:"all 0.15s" }}>
                  <Icon size={18} />
                  <span style={{ flex:1 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding:"16px 20px",borderTop:"1px solid #1a2535",display:"flex",alignItems:"center",gap:12 }}>
        <div style={{ width:36,height:36,borderRadius:"50%",background:"#1a3a2a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#1D9E75",flexShrink:0 }}>U</div>
        <div style={{ flex:1,minWidth:0 }}>
          <p style={{ fontSize:14,fontWeight:600,color:"#c0d0e0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>O meu perfil</p>
          <p style={{ fontSize:12,color:"#4a5a6a" }}>Cliente</p>
        </div>
        <LogOut size={16} style={{ color:"#3a4a5a",cursor:"pointer",flexShrink:0 }} onClick={() => router.push("/")} />
      </div>
    </aside>
  );
}
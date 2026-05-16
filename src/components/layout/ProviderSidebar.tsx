"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, BarChart3, Briefcase, MessageCircle, Bell, Wallet, Receipt, User, Settings, LogOut, Zap, Users, Star, PlusCircle, X, Menu } from "lucide-react";

const navItems = [
  { section:"Principal", items:[
    { label:"Início", icon:Home, href:"/provider-home" },
    { label:"Novo serviço", icon:PlusCircle, href:"/provider/services/new" },
    { label:"Estatísticas", icon:BarChart3, href:"/provider/stats" },
  ]},
  { section:"Trabalho", items:[
    { label:"Pedidos", icon:Briefcase, href:"/provider/services" },
    { label:"Equipa", icon:Users, href:"/provider/company" },
    { label:"Avaliações", icon:Star, href:"/provider/reviews" },
  ]},
  { section:"Comunicação", items:[
    { label:"Chat", icon:MessageCircle, href:"/provider/chat" },
    { label:"Notificações", icon:Bell, href:"/provider/notifications" },
  ]},
  { section:"Financeiro", items:[
    { label:"Wallet", icon:Wallet, href:"/provider/wallet" },
    { label:"Transacções", icon:Receipt, href:"/provider/transactions" },
  ]},
  { section:"Conta", items:[
    { label:"Perfil", icon:User, href:"/provider/profile" },
    { label:"Definições", icon:Settings, href:"/provider/settings" },
  ]},
];

const isActive = (href: string, pathname: string) => {
  if (href === "/provider-home") return pathname === "/provider-home";
  if (href === "/provider/services") return pathname === "/provider/services";
  if (href === "/provider/services/new") return pathname === "/provider/services/new";
  return pathname === href;
};

export default function ProviderSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <>
      <div style={{ padding:"24px 20px", borderBottom:"1px solid #1a2535", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"#EF9F27", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Zap size={20} color="#0d1117" />
          </div>
          <div>
            <span style={{ fontSize:18, fontWeight:700, color:"#e2e8f0" }}>Servi<span style={{ color:"#EF9F27" }}>app</span></span>
            <div style={{ fontSize:10, color:"#EF9F27", fontWeight:600, letterSpacing:"0.06em", marginTop:1 }}>PAINEL PRESTADOR</div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#4a6a6a" }} className="sidebar-close-p">
          <X size={20} />
        </button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"12px 0" }}>
        {navItems.map(group => (
          <div key={group.section} style={{ marginBottom:8 }}>
            <p style={{ padding:"10px 20px 4px", fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"#2a3a4a" }}>{group.section}</p>
            {group.items.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href, pathname);
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 20px", fontSize:14, fontWeight:500, color:active?"#EF9F27":"#6a7a8a", background:active?"#EF9F2712":"transparent", borderLeft:active?"3px solid #EF9F27":"3px solid transparent", textDecoration:"none", transition:"all 0.15s" }}>
                  <Icon size={18} />
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
          <p style={{ fontSize:14, fontWeight:600, color:"#c0d0e0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>O meu perfil</p>
          <p style={{ fontSize:12, color:"#4a5a6a" }}>Prestador</p>
        </div>
        <LogOut size={16} style={{ color:"#3a4a5a", cursor:"pointer", flexShrink:0 }} onClick={() => router.push("/")} />
      </div>
    </>
  );

  return (
    <>
      <style>{`
        .psidebar-desktop { position:fixed; left:0; top:0; height:100vh; width:240px; background:#080e1a; border-right:1px solid #1a2535; display:flex; flex-direction:column; z-index:40; }
        .psidebar-mobile-btn { display:none; position:fixed; top:14px; left:14px; z-index:50; width:40px; height:40px; border-radius:12px; background:#080e1a; border:1px solid #1a2535; align-items:center; justify-content:center; cursor:pointer; }
        .psidebar-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:45; }
        .psidebar-drawer { position:fixed; left:0; top:0; height:100vh; width:240px; background:#080e1a; border-right:1px solid #1a2535; display:flex; flex-direction:column; z-index:46; transform:translateX(-100%); transition:transform 0.25s ease; }
        .psidebar-drawer.open { transform:translateX(0); }
        .sidebar-close-p { display:none !important; }
        @media(max-width:1024px) {
          .psidebar-desktop { display:none !important; }
          .psidebar-mobile-btn { display:flex !important; }
          .psidebar-overlay { display:block; }
          .sidebar-close-p { display:flex !important; }
        }
      `}</style>

      <aside className="psidebar-desktop"><SidebarContent /></aside>
      <button className="psidebar-mobile-btn" onClick={() => setOpen(true)}>
        <Menu size={20} color="#8a9ab0" />
      </button>
      {open && <div className="psidebar-overlay" onClick={() => setOpen(false)} />}
      <aside className={`psidebar-drawer${open ? " open" : ""}`}>
        <SidebarContent />
      </aside>
    </>
  );
}
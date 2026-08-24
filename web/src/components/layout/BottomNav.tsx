"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, MapPin, Briefcase, ShoppingBag, MessageCircle, Wallet, User, Building2 } from "lucide-react";
import { TOKENS, BOTTOM_NAV_HEIGHT, BOTTOM_NAV_SAFE_AREA, MOBILE_BREAKPOINT } from "@/lib/design-tokens";

interface BottomNavItem {
  label: string;
  icon: typeof Home;
  href: string;
}

// Mesmos destinos já usados em Sidebar.tsx (secção "Principal" + Chat),
// só reduzidos aos 5 mais usados no dia-a-dia do cliente.
const CLIENT_ITEMS: BottomNavItem[] = [
  { label: "Início",    icon: Home,          href: "/home"     },
  { label: "Pesquisar", icon: Search,         href: "/search"   },
  { label: "Mapa",      icon: MapPin,         href: "/map"      },
  { label: "Serviços",  icon: Briefcase,      href: "/services" },
  { label: "Chat",      icon: MessageCircle,  href: "/chat"     },
];

// Mesmos destinos já usados em ProviderSidebar.tsx.
const PROVIDER_ITEMS: BottomNavItem[] = [
  { label: "Início",   icon: Home,          href: "/provider-home"      },
  { label: "Pedidos",  icon: ShoppingBag,   href: "/provider/services"  },
  { label: "Empresa",  icon: Building2,     href: "/provider/company"   },
  { label: "Wallet",   icon: Wallet,        href: "/provider/wallet"    },
  { label: "Perfil",   icon: User,          href: "/provider/profile"  },
];

interface BottomNavProps {
  role: "client" | "provider";
}

// O chat individual aberto (/chat/[id] e /provider/chat/[id]) é
// position:fixed + inset:0, com o campo de escrever mensagem colado ao
// fundo do ecrã (ver chatd-input-area / pcd-input-area). Uma bottom nav
// sobreposta ali tapava exactamente essa ação principal do ecrã, por
// isso esta rota fica de fora — mesmo critério já usado em
// ProviderChrome.tsx para decidir quando NÃO montar a Navbar/Sidebar.
function isChatDetailRoute(pathname: string): boolean {
  return /^\/chat\/[^/]+$/.test(pathname) || /^\/provider\/chat\/[^/]+$/.test(pathname);
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  if (isChatDetailRoute(pathname)) return null;

  const items = role === "client" ? CLIENT_ITEMS : PROVIDER_ITEMS;
  const accent = role === "client" ? TOKENS.color.brand : TOKENS.color.provider;

  return (
    <>
      <style>{`
        .bnav{
          display:none;
          position:fixed;left:0;right:0;bottom:0;z-index:1500;
          height:${BOTTOM_NAV_HEIGHT}px;
          padding-bottom:${BOTTOM_NAV_SAFE_AREA};
          background:${TOKENS.color.white};
          border-top:1px solid ${TOKENS.color.line};
          align-items:stretch;
          justify-content:space-around;
        }
        .bnav-item{
          flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:3px;text-decoration:none;color:${TOKENS.color.faint};
          transition:color 0.15s ease;
        }
        .bnav-item.active{ color:${accent}; }
        .bnav-item-label{ font-size:10.5px;font-weight:600; }

        @media(max-width:${MOBILE_BREAKPOINT}px){
          .bnav{ display:flex; }
        }
      `}</style>
      <nav className="bnav">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className={`bnav-item${active ? " active" : ""}`}>
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span className="bnav-item-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
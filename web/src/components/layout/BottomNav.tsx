"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Briefcase, ShoppingBag, MessageCircle, Wallet, User, Building2 } from "lucide-react";
import {
  TOKENS, BOTTOM_NAV_HEIGHT, BOTTOM_NAV_SAFE_AREA, MOBILE_BREAKPOINT,
  CLIENT_HOME_ROUTE, PROVIDER_HOME_ROUTE,
} from "@/lib/design-tokens";
import { useScrollDirection } from "@/hooks/use-scroll-direction";

interface BottomNavItem {
  label: string;
  icon: typeof Home;
  href: string;
}

// "Pesquisar" foi removido daqui de propósito: a Navbar (montada em
// toda a app) já tem a barra "Pesquise um serviço..." que leva a
// /search — repetir a mesma ação na BottomNav era redundante. A
// pesquisa em si não foi alterada nem removida, só deixou de estar
// duplicada aqui.
const CLIENT_ITEMS: BottomNavItem[] = [
  { label: "Início",    icon: Home,          href: "/home"     },
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

// A BottomNav só aparece nas duas Homes (navegação contextual da Home,
// não um elemento permanente em todas as páginas) — nunca no chat
// individual (que é fullscreen fixed, ver isChatDetailRoute mais
// abaixo, mantido por segurança mesmo que essa rota nunca coincida com
// as Homes) nem em qualquer outra página (Pesquisa, Mapa, formulários,
// KYC, etc.).
function isHomeRoute(pathname: string, role: "client" | "provider"): boolean {
  return role === "client" ? pathname === CLIENT_HOME_ROUTE : pathname === PROVIDER_HOME_ROUTE;
}

function isChatDetailRoute(pathname: string): boolean {
  return /^\/chat\/[^/]+$/.test(pathname) || /^\/provider\/chat\/[^/]+$/.test(pathname);
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const scrollVisible = useScrollDirection();

  if (!isHomeRoute(pathname, role) || isChatDetailRoute(pathname)) return null;

  const items = role === "client" ? CLIENT_ITEMS : PROVIDER_ITEMS;
  const accent = role === "client" ? TOKENS.color.brand : TOKENS.color.provider;

  return (
    <>
      <style>{`
        .bnav{
          display:none;
          position:fixed;left:0;right:0;bottom:0;z-index:1500;
          justify-content:center;
          height:calc(${BOTTOM_NAV_HEIGHT}px + ${BOTTOM_NAV_SAFE_AREA});
          /* A barra em si é fixed e nunca se move — só o conteúdo
             interno (.bnav-inner) desliza. Isto garante que esconder a
             barra nunca altera o fluxo da página, scrollHeight ou o
             padding-bottom reservado em globals.css (ver nota lá).
             pointer-events:none aqui + pointer-events:auto no
             .bnav-inner evita uma zona morta de cliques do tamanho da
             barra ficar "presa" no ecrã quando .bnav-inner desliza para
             fora — sem isto, tocar onde a barra costumava estar (mas já
             está escondida) não chegaria ao conteúdo por baixo. */
          pointer-events:none;
        }
        .bnav-inner{
          width:100%;
          max-width:640px;
          display:flex;
          align-items:stretch;
          justify-content:space-around;
          /* CORREÇÃO ESTRUTURAL: antes esta caixa tinha height:60px
             fixo E padding-bottom:safe-area ao mesmo tempo. Com
             box-sizing:border-box (aplicado globalmente), o
             padding-bottom é SUBTRAÍDO dos 60px em vez de somado —
             no iPhone (safe-area ~34px), sobravam só ~26px de área
             útil real para ícone+label, esmagando tudo no topo da
             barra (exactamente o que a captura de ecrã mostrava).
             Agora a altura soma os dois, tal como o wrapper .bnav
             já fazia — os 60px de área útil ficam sempre completos,
             e a safe-area passa a ser espaço extra reservado por
             baixo, não subtraído do espaço dos ícones. */
          height:calc(${BOTTOM_NAV_HEIGHT}px + ${BOTTOM_NAV_SAFE_AREA});
          padding-bottom:${BOTTOM_NAV_SAFE_AREA};
          background:${TOKENS.color.white};
          border-top:1px solid ${TOKENS.color.line};
          pointer-events:auto;

          transform:translateY(0);
          transition:transform 0.22s cubic-bezier(.4,0,.2,1);
          will-change:transform;
        }
        .bnav-inner.hidden{
          transform:translateY(100%);
        }

        .bnav-item{
          flex:1;
          min-width:0;
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          gap:2px;
          padding:6px 4px;
          text-decoration:none;color:${TOKENS.color.faint};
          transition:color 0.15s ease;
        }
        .bnav-item.active{ color:${accent}; }
        .bnav-item svg{ flex-shrink:0; }
        .bnav-item-label{
          font-size:clamp(9.5px, 2.6vw, 11px);
          font-weight:600;
          line-height:1.1;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          max-width:100%;
        }

        @media(max-width:${MOBILE_BREAKPOINT}px){
          .bnav{ display:flex; }
        }
        /* Ecrãs muito estreitos (ex: iPhone SE, 375px e abaixo): reduz
           levemente o padding lateral de cada item para dar mais
           espaço aos ícones/labels sem os cortar. */
        @media(max-width:360px){
          .bnav-item{ padding:6px 2px; }
        }
      `}</style>
      <nav className="bnav" aria-label={role === "client" ? "Navegação principal" : "Navegação do prestador"}>
        <div className={`bnav-inner${scrollVisible ? "" : " hidden"}`}>
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
        </div>
      </nav>
    </>
  );
}
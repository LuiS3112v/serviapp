import ProviderChrome from "../../components/layout/ProviderChrome";
import { requireRole } from "@/lib/session.server";
import { BOTTOM_NAV_HEIGHT, BOTTOM_NAV_SAFE_AREA, MOBILE_BREAKPOINT } from "@/lib/design-tokens";

// ═══════════════════════════════════════════════════════════════════════
// Layout do grupo (provider) — PROVIDER / COMPANY ONLY
//
// Cobre: /provider-home, /provider/*
//
// Este ficheiro continua a fazer só a verificação de sessão no servidor
// (requireRole) — igual ao original. A estrutura visual (Sidebar, Navbar,
// <main>) passou para o <ProviderChrome/>, um componente cliente, porque
// agora essa estrutura depende da ROTA actual (usePathname só existe em
// componentes cliente, e este layout precisa de continuar a ser async
// por causa do requireRole).
//
// PORQUÊ: na rota do chat individual (/provider/chat/[id]), a própria
// página já monta a sua Sidebar e o seu wrapper full-screen — igual ao
// chat do cliente. O <ProviderChrome/> reconhece essa rota e, só nela,
// não volta a montar Sidebar/Navbar/<main> por cima. Em todas as outras
// rotas do provider, o comportamento é exactamente o mesmo de antes.
//
// FIX (responsividade — mobile/PWA, histórico, mantido no CSS abaixo):
// 1) min-height:100vh → acrescentado min-height:100dvh (fallback mantido
//    para browsers sem suporte). 100vh em mobile Chrome/Safari conta a
//    barra de endereço como espaço disponível, ficando maior do que o
//    ecrã realmente visível.
// 2) min-width:0 em .prov-main — protecção contra overflow horizontal.
// 3) minHeight:0 no <main> (dentro do ProviderChrome) — sem isto, um
//    filho que precise de height:100% não tem uma base de altura
//    fiável, porque um flex item em coluna não encolhe abaixo do seu
//    conteúdo por definição.
//
// BOTTOM NAV (mobile): o <ProviderSidebar/> passou a renderizar também
// um <BottomNav/> fixo no fundo do ecrã abaixo de 1024px (ver
// ProviderSidebar.tsx e BottomNav.tsx). Esse componente nunca ocupa
// espaço no fluxo normal (position:fixed), por isso .prov-main precisa
// de reservar esse espaço manualmente via padding-bottom, ou o fim do
// conteúdo de qualquer página (ex: botão de submeter um formulário)
// ficaria escondido atrás da barra. A própria rota de chat individual
// não é afectada por este padding porque o ProviderChrome não monta
// .prov-main nela (ver isChatDetail acima) — o que também é exactamente
// a rota em que o BottomNav já se auto-exclui.
// ═══════════════════════════════════════════════════════════════════════

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["provider", "company"]);

  return (
    <>
      <style>{`
        .prov-layout{display:flex;min-height:100vh;min-height:100dvh;background:#f8fafc}
        .prov-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;min-height:100dvh;min-width:0;overflow-x:hidden}
        @media(max-width:${MOBILE_BREAKPOINT}px){
          .prov-main{
            margin-left:0;
            padding-bottom:calc(${BOTTOM_NAV_HEIGHT}px + ${BOTTOM_NAV_SAFE_AREA});
          }
        }
      `}</style>
      <ProviderChrome>{children}</ProviderChrome>
    </>
  );
}
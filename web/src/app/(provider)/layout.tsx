import ProviderNavbar from "@/components/layout/ProviderNavbar";
import ProviderSidebar from "@/components/layout/ProviderSidebar";
import { requireRole } from "@/lib/session.server";

// ═══════════════════════════════════════════════════════════════════════
// Layout do grupo (provider) — PROVIDER / COMPANY ONLY
//
// Cobre: /provider-home, /provider/*
//
// Único acrescento face ao ficheiro original: requireRole() no topo.
// Todo o resto (estrutura visual, estilos, componentes) é inalterado.
//
// FIX (responsividade — mobile/PWA):
// 1) min-height:100vh → acrescentado min-height:100dvh (fallback mantido
//    para browsers sem suporte). 100vh em mobile Chrome/Safari conta a
//    barra de endereço como espaço disponível, ficando maior do que o
//    ecrã realmente visível — isso fazia páginas do provider (incluindo
//    o chat) ficarem "mais altas" do que deviam, cortando conteúdo no
//    fundo ou deixando espaço morto.
// 2) min-width:0 em .prov-main — protecção contra overflow horizontal:
//    um flex item sem min-width:0 não encolhe abaixo do conteúdo
//    intrínseco. Não altera nada visualmente onde já não há overflow.
// 3) minHeight:0 no <main> — sem isto, um filho que precise de
//    height:100% (como a página de chat) não tem uma base de altura
//    fiável, porque um flex item em coluna não encolhe abaixo do seu
//    conteúdo por definição. Com min-height:0, o <main> respeita o
//    flex:1 que já tinha e os filhos passam a poder preencher
//    corretamente 100% da altura disponível. Não afecta páginas que já
//    crescem naturalmente com o conteúdo (a maioria) — só habilita as
//    que precisam de altura total (como o chat).
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
        @media(max-width:1024px){.prov-main{margin-left:0}}
      `}</style>
      <div className="prov-layout">
        <ProviderSidebar />
        <div className="prov-main">
          <ProviderNavbar />
          <main style={{ flex:1, minHeight:0, minWidth:0 }}>{children}</main>
        </div>
      </div>
    </>
  );
}
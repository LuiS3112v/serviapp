import { requireRole } from "@/lib/session.server";
import ClientChrome from "@/components/layout/ClientChrome";
import { BOTTOM_NAV_HEIGHT, BOTTOM_NAV_SAFE_AREA, MOBILE_BREAKPOINT } from "@/lib/design-tokens";

// ═══════════════════════════════════════════════════════════════════════
// Layout do grupo (dashboard) — CLIENT ONLY
//
// Cobre: /home, /services, /wallet, /profile, /chat, /map, /notifications,
// /security, /categories, /company, /settings, /transactions, /onboarding,
// /privacidade, /privacy, /termos, /terms, /admin (ver nota abaixo)
//
// ARQUITECTURA — alinhada com o provider:
// O provider usa <ProviderChrome> neste layout para manter Sidebar e
// Navbar persistentes entre navegações (uma única instância montada,
// nunca desmontada durante soft navigation). O cliente agora faz o
// mesmo com <ClientChrome>:
//   • Sidebar e Navbar vivem aqui, num componente que o Next.js App
//     Router preserva entre rotas do mesmo route group
//   • cada página individual deixou de incluir <Sidebar> e <Navbar>
//   • elimina o ciclo de unmount/mount que causava o freeze no cliente
//
// NOTA sobre /admin: a rota /admin também vive dentro deste route group.
// Por isso este layout permite tanto "client" como "admin" passarem —
// a restrição específica de que só admin acede a /admin fica a cargo do
// layout mais específico (dashboard)/admin/layout.tsx, que corre A
// SEGUIR a este, dentro da mesma árvore de render.
// ═══════════════════════════════════════════════════════════════════════

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["client", "admin"]);

  return (
    <>
      <style>{`
        .cl-layout{display:flex;min-height:100vh;min-height:100dvh;background:#FFFFFF}
        .cl-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-width:0;overflow-x:hidden}
        @media(max-width:${MOBILE_BREAKPOINT}px){
          .cl-main{
            margin-left:0;
            padding-bottom:calc(${BOTTOM_NAV_HEIGHT}px + ${BOTTOM_NAV_SAFE_AREA});
          }
        }
      `}</style>
      <ClientChrome>{children}</ClientChrome>
    </>
  );
}
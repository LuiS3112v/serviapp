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
        .prov-layout{display:flex;min-height:100vh;background:#f8fafc}
        .prov-main{flex:1;margin-left:240px;display:flex;flex-direction:column;min-height:100vh;overflow-x:hidden}
        @media(max-width:1024px){.prov-main{margin-left:0}}
      `}</style>
      <div className="prov-layout">
        <ProviderSidebar />
        <div className="prov-main">
          <ProviderNavbar />
          <main style={{ flex:1 }}>{children}</main>
        </div>
      </div>
    </>
  );
}
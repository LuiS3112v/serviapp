"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

// ═══════════════════════════════════════════════════════════════════════
// ClientChrome — equivalente ao ProviderChrome, para o dashboard do
// cliente.
//
// PORQUÊ EXISTE:
// O layout do provider usa <ProviderChrome> para manter Sidebar e
// Navbar num componente persistente — o Next.js App Router preserva
// este componente entre navegações do mesmo route group, por isso o
// Sidebar nunca é desmontado/remontado durante soft navigation.
//
// O layout do cliente usava <>{children}</> — cada página montava
// <Sidebar> e <Navbar> individualmente. A cada navegação, o React
// desmontava o Sidebar antigo e montava um novo. Durante esse ciclo,
// o overlay do Sidebar (position:fixed;inset:0;z-index:2000) ficava
// num estado transitório — podia capturar eventos que deveriam ir para
// a nova página, causando o freeze e os botões sem resposta que só
// aconteciam no cliente, nunca no provider.
//
// ROTAS ESPECIAIS:
// • /chat/[id] — tem o seu próprio wrapper full-screen (chatd-wrap)
//   sem Navbar. Não montamos estrutura duplicada aqui.
// ═══════════════════════════════════════════════════════════════════════

function isSpecialRoute(pathname: string): boolean {
  // Chat detail tem wrapper e header próprios — não usar ChromeLayout
  return /^\/chat\/[^/]+$/.test(pathname);
}

export default function ClientChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isSpecialRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="cl-layout">
      <Sidebar />
      <div className="cl-main">
        <Navbar />
        <main style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

// ═══════════════════════════════════════════════════════════════════════
// ClientChrome — equivalente ao ProviderChrome, para o dashboard do
// cliente.
//
// PORQUÊ EXISTE:
// O layout do provider tem um <ProviderChrome> que envolve tudo numa
// estrutura persistente — o Sidebar e o Navbar ficam montados entre
// navegações, porque vivem num componente pai que o Next.js App Router
// preserva durante soft navigations.
//
// O layout do cliente era apenas <>{children}</> — cada página tinha o
// seu próprio <Sidebar> e <Navbar> inline. Isso significa que em cada
// navegação entre páginas do cliente, o React desmontava o Sidebar
// antigo e montava um novo. Durante esse ciclo, o Sidebar (que tem
// position:fixed e listeners de toque/teclado) ficava num estado
// transitório onde o antigo ainda existia no DOM e o novo ainda não
// estava montado — causando o "freeze" da tela e os botões a não
// responderem que só acontecia no cliente e nunca no provider.
//
// ROTAS ESPECIAIS:
// O chat individual (/chat/<id>) já monta o seu próprio wrapper
// full-screen sem Navbar/Sidebar — igual ao chat do provider. O
// ClientChrome reconhece essa rota e devolve os children directamente,
// sem montar a estrutura duplicada.
// ═══════════════════════════════════════════════════════════════════════

function isClientChatDetailRoute(pathname: string): boolean {
  return /^\/chat\/[^/]+$/.test(pathname);
}

export default function ClientChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatDetail = isClientChatDetailRoute(pathname);

  if (isChatDetail) {
    return <>{children}</>;
  }

  return (
    <div className="hw">
      <Sidebar />
      <div className="hm">
        <Navbar />
        <main style={{ flex: 1, minHeight: 0, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
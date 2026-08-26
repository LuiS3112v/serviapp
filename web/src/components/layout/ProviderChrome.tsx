"use client";
import { usePathname } from "next/navigation";
import ProviderNavbar from "@/components/layout/ProviderNavbar";
import ProviderSidebar from "@/components/layout/ProviderSidebar";
import { useGlobalProviderLocationBroadcast } from "@/hooks/useGlobalProviderLocationBroadcast";

// Reconhece /provider/chat/<id> (o chat de UMA conversa aberta) mas NÃO
// /provider/chat (a lista de conversas) — essa continua a precisar da
// Navbar/Sidebar normais do layout, porque a própria página da lista
// (ProviderChatPage) não traz nenhuma das duas.
function isProviderChatDetailRoute(pathname: string): boolean {
  return /^\/provider\/chat\/[^/]+$/.test(pathname);
}

export default function ProviderChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatDetail = isProviderChatDetailRoute(pathname);

  // Transmite a localização do provider para o gateway /service-location
  // sempre que existe um serviço activo (ACCEPTED / PAYMENT_HELD /
  // IN_PROGRESS), independentemente da página onde o provider navega.
  // Montado aqui (layout persistente) em vez de em cada página individual,
  // para que a transmissão não pare quando o provider muda de página.
  useGlobalProviderLocationBroadcast();

  // A página de chat individual (ProviderChatDetailPage) já monta a sua
  // própria <ProviderSidebar/> e o seu próprio wrapper full-screen
  // (.pcd-wrap/.pcd-main) — exactamente como o chat do cliente. Se
  // renderizássemos aqui também a Sidebar e a Navbar do layout, ficaríamos
  // com duas Sidebars montadas ao mesmo tempo e a Navbar por cima do chat.
  // Por isso, só para esta rota, devolvemos os children "nus".
  if (isChatDetail) {
    return <>{children}</>;
  }

  return (
    <div className="prov-layout">
      <ProviderSidebar />
      <div className="prov-main">
        <ProviderNavbar />
        <main style={{ flex: 1, minHeight: 0, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
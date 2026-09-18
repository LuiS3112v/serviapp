"use client";
import { usePathname } from "next/navigation";
import ProviderNavbar from "@/components/layout/ProviderNavbar";
import ProviderSidebar from "@/components/layout/ProviderSidebar";
import { useGlobalProviderLocationBroadcast } from "@/hooks/useGlobalProviderLocationBroadcast";
import { usePlatformRealtime } from "@/hooks/usePlatformRealtime";

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

  // Canal realtime da plataforma — escuta platform_event via socket /chat.
  // Montado aqui (layout persistente) para que a ligação sobreviva a
  // navegações entre páginas sem criar novas conexões.
  usePlatformRealtime();

  // Transmite a localização do provider via /service-location sempre que
  // existe um serviço activo, independentemente da página actual.
  useGlobalProviderLocationBroadcast();

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
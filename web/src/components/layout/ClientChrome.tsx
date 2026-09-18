"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { usePlatformRealtime } from "@/hooks/usePlatformRealtime";

function isMapRoute(pathname: string): boolean {
  return pathname === '/map';
}

function isSpecialRoute(pathname: string): boolean {
  return /^\/chat\/[^/]+$/.test(pathname);
}

// Componente interno que monta o hook realtime — separado para garantir
// que o hook corre sempre (não condicional), mesmo quando isSpecialRoute.
function RealtimeLayer() {
  usePlatformRealtime();
  return null;
}

export default function ClientChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const onMap = isMapRoute(pathname);

  if (isSpecialRoute(pathname)) {
    return (
      <>
        <RealtimeLayer />
        {children}
      </>
    );
  }

  return (
    <>
      <RealtimeLayer />
      <div className="cl-layout">
        <Sidebar />
        <div className="cl-main">
          <Navbar />
          <main
            className={onMap ? 'cl-main-map' : undefined}
            style={
              onMap
                ? {
                    flex: 1, minHeight: 0, minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', overflowX: 'hidden',
                  }
                : {
                    flex: 1, minHeight: 0, minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    overflowY: 'auto', overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch' as any,
                    overscrollBehavior: 'contain',
                  }
            }
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
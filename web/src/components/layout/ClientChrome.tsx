"use client";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { ScrollContainerContext } from "@/contexts/scroll-container-context";

function isSpecialRoute(pathname: string): boolean {
  return /^\/chat\/[^/]+$/.test(pathname);
}

export default function ClientChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  if (isSpecialRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    // O ref do <main> é passado via contexto para o useScrollDirection
    // no BottomNav — assim o hook escuta o scroll do container correcto
    // desde o primeiro render, sem depender de getElementById.
    <ScrollContainerContext.Provider value={mainRef}>
      <div className="cl-layout">
        <Sidebar />
        <div className="cl-main">
          <Navbar />
          <main
            ref={mainRef}
            id="cl-scroll-main"
            style={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </ScrollContainerContext.Provider>
  );
}
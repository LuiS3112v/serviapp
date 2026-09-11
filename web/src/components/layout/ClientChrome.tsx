"use client";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

function isSpecialRoute(pathname: string): boolean {
  return /^\/chat\/[^/]+$/.test(pathname);
}

// O scroll da app do cliente acontece neste <main> (overflowY:auto),
// não no window. O ref é passado via data-attribute para o BottomNav
// o encontrar via document.querySelector — evita prop drilling ou
// contexto só para isto.
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
  );
}
"use client";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

function isSpecialRoute(pathname: string): boolean {
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
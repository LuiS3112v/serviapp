import ProviderSidebar from "@/components/layout/ProviderSidebar";
import ProviderNavbar from "@/components/layout/ProviderNavbar";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .provider-layout { display:flex; min-height:100vh; background:#0d1117; }
        .provider-content { flex:1; margin-left:240px; display:flex; flex-direction:column; }
        @media(max-width:1024px) { .provider-content { margin-left:0; } }
      `}</style>
      <div className="provider-layout">
        <ProviderSidebar />
        <div className="provider-content">
          <ProviderNavbar />
          <main style={{ flex:1 }}>{children}</main>
        </div>
      </div>
    </>
  );
}
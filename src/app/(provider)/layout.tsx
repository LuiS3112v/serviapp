import ProviderNavbar from "@/components/layout/ProviderNavbar";
import ProviderSidebar from "@/components/layout/ProviderSidebar";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        .prov-layout{display:flex;min-height:100vh;background:#0d1117}
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
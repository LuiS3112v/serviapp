import ProviderSidebar from "@/components/layout/ProviderSidebar";
import ProviderNavbar from "@/components/layout/ProviderNavbar";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:"flex",minHeight:"100vh",background:"#0d1117" }}>
      <ProviderSidebar />
      <div style={{ flex:1,marginLeft:240,display:"flex",flexDirection:"column" }}>
        <ProviderNavbar />
        <main style={{ flex:1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
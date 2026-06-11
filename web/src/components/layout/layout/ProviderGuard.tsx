"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, AlertCircle } from "lucide-react";
import { getToken, clearSession } from "@/lib/auth.api";

export default function ProviderGuard({ children }: { children: React.ReactNode }) {
  const router  = useRouter();
  const [status, setStatus] = useState<"checking" | "ok" | "wrong">("checking");
  const [role, setRole]     = useState<string>("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      clearSession();
      router.replace("/");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const r: string = payload.role ?? "";
      setRole(r);
      if (["provider", "company", "admin"].includes(r)) {
        setStatus("ok");
      } else {
        setStatus("wrong");
      }
    } catch {
      clearSession();
      router.replace("/");
    }
  }, []);

  if (status === "checking") {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0d1117", gap:12 }}>
        <Loader2 size={24} style={{ color:"#EF9F27", animation:"spin 1s linear infinite" }}/>
        <span style={{ fontSize:14, color:"#4a6a6a" }}>A verificar sessão...</span>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (status === "wrong") {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#0d1117" }}>
        <div style={{ textAlign:"center", maxWidth:400, padding:32 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:"#E24B4A15", border:"1px solid #E24B4A30", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <AlertCircle size={28} style={{ color:"#E24B4A" }}/>
          </div>
          <p style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>Conta incorrecta</p>
          <p style={{ fontSize:14, color:"#4a6a6a", lineHeight:1.6, marginBottom:24 }}>
            Estás logado com uma conta do tipo <strong style={{ color:"#EF9F27" }}>"{role}"</strong>.
            Para aceder ao painel de prestador precisas de uma conta com o tipo <strong style={{ color:"#1D9E75" }}>"provider"</strong> ou <strong style={{ color:"#1D9E75" }}>"company"</strong>.
          </p>
          <button
            onClick={() => { clearSession(); router.replace("/"); }}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:12, border:"none", background:"#EF9F27", color:"#0d1117", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", margin:"0 auto" }}
          >
            <LogOut size={16}/> Fazer logout e entrar como prestador
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
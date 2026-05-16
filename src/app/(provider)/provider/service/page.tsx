"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Briefcase } from "lucide-react";

const tabs = ["Todos","Pendente","Em execução","Concluído"];

export default function ProviderServicesPage() {
  const router = useRouter();
  const [tab, setTab] = useState("Todos");
  return (
    <>
      <style>{`
        .psv-inner{padding:28px 32px;display:flex;flex-direction:column;gap:20px}
        .tabs{display:flex;gap:4px;background:#131b27;border-radius:12px;padding:4px;border:1px solid #1a2535;width:fit-content;flex-wrap:wrap}
        .tab{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;color:#6a7a8a;transition:all 0.15s;font-family:inherit}
        .tab.on{background:#EF9F27;color:#0d1117}
        .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;text-align:center}
        @media(max-width:640px){.psv-inner{padding:16px}}
      `}</style>
      <div className="psv-inner">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Pedidos de serviço</h1>
            <p style={{fontSize:13,color:"#4a6a6a"}}>Gere os pedidos dos clientes</p>
          </div>
          <button onClick={()=>router.push("/provider/services/new")} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:12,border:"none",background:"#EF9F27",color:"#0d1117",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            <Plus size={16}/> Novo serviço
          </button>
        </div>
        <div className="tabs">
          {tabs.map(t=>(
            <button key={t} className={`tab${tab===t?" on":""}`} onClick={()=>setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="empty">
          <div style={{width:64,height:64,borderRadius:20,background:"#131b27",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Briefcase size={28} style={{color:"#2a3a4a"}}/>
          </div>
          <p style={{fontSize:16,fontWeight:700,color:"#c0d0e0"}}>Sem pedidos ainda</p>
          <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:320}}>Quando o teu perfil estiver activo, os pedidos dos clientes vão aparecer aqui.</p>
        </div>
      </div>
    </>
  );
}
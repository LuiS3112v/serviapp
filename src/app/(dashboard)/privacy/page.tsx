"use client";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Lock, ArrowLeft } from "lucide-react";

const sections = [
  {title:"1. Dados que recolhemos",text:"Recolhemos dados de identificação (nome, email, telemóvel), documentos de identidade para verificação KYC, dados de localização quando activos, e histórico de transacções e serviços."},
  {title:"2. Como usamos os dados",text:"Os dados são usados para verificar a tua identidade, processar pagamentos, melhorar a plataforma, enviar notificações relevantes e garantir a segurança de todos os utilizadores."},
  {title:"3. Partilha de dados",text:"Não vendemos os teus dados a terceiros. Partilhamos apenas com parceiros de pagamento (para processar transacções) e autoridades competentes quando exigido por lei."},
  {title:"4. Segurança",text:"Utilizamos encriptação SSL/TLS para todas as comunicações. Os documentos KYC são armazenados em servidores seguros com acesso restrito à equipa autorizada."},
  {title:"5. Retenção de dados",text:"Os teus dados são mantidos enquanto a conta estiver activa. Após encerramento de conta, mantemos dados por 5 anos por obrigação legal, depois são eliminados."},
  {title:"6. Os teus direitos",text:"Tens direito a aceder, corrigir ou eliminar os teus dados pessoais. Para exercer estes direitos entra em contacto connosco através dos canais de suporte."},
  {title:"7. Cookies",text:"Utilizamos cookies essenciais para o funcionamento da plataforma e cookies analíticos (anónimos) para melhorar a experiência. Podes gerir as preferências nas definições."},
];

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .priv-wrap{display:flex;min-height:100vh;background:#0d1117}
        .priv-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .priv-inner{flex:1;padding:28px 32px;max-width:720px;display:flex;flex-direction:column;gap:20px}
        .priv-section{background:#131b27;border:1px solid #1a2535;border-radius:14px;padding:20px}
        .back-btn{display:flex;align-items:center;gap:8px;background:none;border:none;cursor:pointer;color:#4a6a7a;font-size:13px;padding:0;font-family:inherit}
        .back-btn:hover{color:#378ADD}
        @media(max-width:1024px){.priv-main{margin-left:0}}
        @media(max-width:640px){.priv-inner{padding:16px}}
      `}</style>
      <div className="priv-wrap">
        <Sidebar/>
        <div className="priv-main">
          <Navbar/>
          <div className="priv-inner">
            <button className="back-btn" onClick={() => router.push("/settings")}>
              <ArrowLeft size={16}/> Voltar às definições
            </button>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",borderRadius:14,background:"#0a1a2e",border:"1px solid #378ADD25"}}>
              <Lock size={20} style={{color:"#378ADD",flexShrink:0}}/>
              <div>
                <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0"}}>Política de Privacidade</p>
                <p style={{fontSize:12,color:"#4a6a7a"}}>Última actualização: 2026 · Serviapp Angola</p>
              </div>
            </div>
            {sections.map((s,i)=>(
              <div className="priv-section" key={i}>
                <h2 style={{fontSize:15,fontWeight:700,color:"#c0d0e0",marginBottom:10}}>{s.title}</h2>
                <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.75}}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
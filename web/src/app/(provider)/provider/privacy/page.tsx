"use client";
import { useRouter } from "next/navigation";
import { Lock, ArrowLeft } from "lucide-react";

const sections = [
  {title:"1. Dados que recolhemos",text:"Recolhemos dados de identificação (nome, email, telemóvel), documentos KYC, localização quando activo, histórico de serviços e transacções, e avaliações recebidas."},
  {title:"2. Como usamos os dados",text:"Os dados são usados para verificar a tua identidade como prestador, processar pagamentos, calcular comissões, melhorar a plataforma e garantir a segurança."},
  {title:"3. Partilha de dados",text:"Não vendemos os teus dados. Partilhamos apenas com parceiros de pagamento e autoridades quando exigido por lei. Os clientes vêem apenas o teu perfil público."},
  {title:"4. Segurança",text:"Utilizamos encriptação SSL/TLS. Os documentos KYC são armazenados em servidores seguros com acesso restrito à equipa de verificação autorizada."},
  {title:"5. Retenção de dados",text:"Os dados são mantidos enquanto a conta estiver activa. Após encerramento mantemos por 5 anos por obrigação legal, depois são eliminados de forma segura."},
  {title:"6. Os teus direitos",text:"Tens direito a aceder, corrigir ou eliminar os teus dados pessoais. Para exercer estes direitos contacta-nos através dos canais de suporte da plataforma."},
  {title:"7. Cookies",text:"Utilizamos cookies essenciais para o funcionamento e cookies analíticos anónimos para melhorar a experiência. Podes gerir as preferências nas definições."},
];

export default function ProviderPrivacyPage() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .ppriv-inner{flex:1;padding:28px 32px;max-width:720px;display:flex;flex-direction:column;gap:20px}
        .priv-section{background:#131b27;border:1px solid #1a2535;border-radius:14px;padding:20px}
        .back-btn{display:flex;align-items:center;gap:8px;background:none;border:none;cursor:pointer;color:#4a6a7a;font-size:13px;padding:0;font-family:inherit}
        .back-btn:hover{color:#EF9F27}
        @media(max-width:640px){.ppriv-inner{padding:16px}}
      `}</style>
      <div className="ppriv-inner">
        <button className="back-btn" onClick={() => router.push("/provider/settings")}>
          <ArrowLeft size={16}/> Voltar às definições
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",borderRadius:14,background:"#0a1520",border:"1px solid #EF9F2725"}}>
          <Lock size={20} style={{color:"#EF9F27",flexShrink:0}}/>
          <div>
            <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0"}}>Política de Privacidade — Prestador</p>
            <p style={{fontSize:12,color:"#7a6a4a"}}>Última actualização: 2026 · Serviapp Angola</p>
          </div>
        </div>
        {sections.map((s,i)=>(
          <div className="priv-section" key={i}>
            <h2 style={{fontSize:15,fontWeight:700,color:"#c0d0e0",marginBottom:10}}>{s.title}</h2>
            <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.75}}>{s.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}
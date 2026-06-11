"use client";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";

const sections = [
  {title:"1. Aceitação dos Termos",text:"Ao aceder e utilizar a plataforma Serviapp como prestador de serviços, concordas com estes Termos. Se não concordares, não deves utilizar a plataforma."},
  {title:"2. Papel do Prestador",text:"Como prestador, és responsável pela qualidade, pontualidade e profissionalismo dos serviços que ofereces. A Serviapp actua como intermediário digital."},
  {title:"3. Registo e Verificação",text:"Para ofereceres serviços deves completar o processo de verificação de identidade (KYC) e manter as informações do perfil actualizadas e verdadeiras."},
  {title:"4. Pagamentos e Escrow",text:"Os pagamentos são retidos em escrow até confirmação de conclusão do serviço. A libertação do valor ocorre após confirmação do cliente ou resolução de disputa."},
  {title:"5. Comissões da Plataforma",text:"A Serviapp retém uma comissão de 10% a 20% sobre cada transacção concluída. A percentagem exacta depende da categoria e volume de serviços."},
  {title:"6. Qualidade e Avaliações",text:"Deves manter um nível de avaliação adequado. Contas com avaliação persistentemente baixa poderão ser suspensas ou removidas da plataforma."},
  {title:"7. Rescisão",text:"Reservamo-nos o direito de suspender ou terminar contas que violem estes termos, a nosso critério e sem aviso prévio."},
];

export default function ProviderTermsPage() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .pterms-inner{flex:1;padding:28px 32px;max-width:720px;display:flex;flex-direction:column;gap:20px}
        .terms-section{background:#131b27;border:1px solid #1a2535;border-radius:14px;padding:20px}
        .back-btn{display:flex;align-items:center;gap:8px;background:none;border:none;cursor:pointer;color:#4a7a6a;font-size:13px;padding:0;font-family:inherit}
        .back-btn:hover{color:#EF9F27}
        @media(max-width:640px){.pterms-inner{padding:16px}}
      `}</style>
      <div className="pterms-inner">
        <button className="back-btn" onClick={() => router.push("/provider/settings")}>
          <ArrowLeft size={16}/> Voltar às definições
        </button>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",borderRadius:14,background:"#1a1208",border:"1px solid #EF9F2725"}}>
          <Shield size={20} style={{color:"#EF9F27",flexShrink:0}}/>
          <div>
            <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0"}}>Termos de Serviço — Prestador</p>
            <p style={{fontSize:12,color:"#7a6a4a"}}>Última actualização: 2026 · Serviapp Angola</p>
          </div>
        </div>
        {sections.map((s,i)=>(
          <div className="terms-section" key={i}>
            <h2 style={{fontSize:15,fontWeight:700,color:"#c0d0e0",marginBottom:10}}>{s.title}</h2>
            <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.75}}>{s.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}
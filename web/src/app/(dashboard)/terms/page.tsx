"use client";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Shield, ArrowLeft } from "lucide-react";

const sections = [
  {title:"1. Aceitação dos Termos",text:"Ao aceder e utilizar a plataforma Serviapp, concordas com estes Termos de Serviço. Se não concordares, não deves utilizar a plataforma."},
  {title:"2. Descrição do Serviço",text:"A Serviapp é uma plataforma digital que facilita a ligação entre clientes e prestadores de serviços em Angola. Não somos prestadores de serviços — somos um intermediário digital."},
  {title:"3. Registo e Conta",text:"Para utilizar a plataforma deves criar uma conta com informações verdadeiras. És responsável pela confidencialidade da tua senha e por todas as actividades realizadas na tua conta."},
  {title:"4. Pagamentos e Escrow",text:"Todos os pagamentos digitais são processados através do nosso sistema de escrow. O valor fica retido até ambas as partes confirmarem a conclusão do serviço."},
  {title:"5. Comissões",text:"A Serviapp cobra uma comissão sobre cada transacção processada pela plataforma. A percentagem varia entre 10% e 20% consoante a categoria e região."},
  {title:"6. Verificação de Identidade",text:"Os prestadores de serviços são obrigados a completar o processo de verificação de identidade (KYC) antes de poderem oferecer os seus serviços na plataforma."},
  {title:"7. Responsabilidades",text:"A Serviapp não se responsabiliza pela qualidade dos serviços prestados. Encorajamos os utilizadores a avaliar os prestadores após cada serviço."},
  {title:"8. Rescisão",text:"Reservamo-nos o direito de suspender ou terminar contas que violem estes termos, a nosso critério e sem aviso prévio."},
];

export default function TermsPage() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .terms-wrap{display:flex;min-height:100vh;background:#f8fafc}
        .terms-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .terms-inner{flex:1;padding:28px 32px;max-width:720px;display:flex;flex-direction:column;gap:20px}
        .terms-section{background:#ffffff;border:1px solid #eef1f5;border-radius:14px;padding:20px;box-shadow:0 2px 12px rgba(15,23,42,0.04)}
        .back-btn{display:flex;align-items:center;gap:8px;background:none;border:none;cursor:pointer;color:#64748b;font-size:13px;padding:0;font-family:inherit}
        .back-btn:hover{color:#1D9E75}
        @media(max-width:1024px){.terms-main{margin-left:0}}
        @media(max-width:640px){.terms-inner{padding:16px}}
      `}</style>
      <div className="terms-wrap">
        <Sidebar/>
        <div className="terms-main">
          <Navbar/>
          <div className="terms-inner">
            <button className="back-btn" onClick={() => router.push("/settings")}>
              <ArrowLeft size={16}/> Voltar às definições
            </button>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",borderRadius:14,background:"#f0faf6",border:"1px solid #bbf7e8"}}>
              <Shield size={20} style={{color:"#1D9E75",flexShrink:0}}/>
              <div>
                <p style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>Termos de Serviço</p>
                <p style={{fontSize:12,color:"#0f766e"}}>Última actualização: 2026 · Serviapp Angola</p>
              </div>
            </div>
            {sections.map((s,i)=>(
              <div className="terms-section" key={i}>
                <h2 style={{fontSize:15,fontWeight:700,color:"#0f172a",marginBottom:10}}>{s.title}</h2>
                <p style={{fontSize:13,color:"#64748b",lineHeight:1.75}}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
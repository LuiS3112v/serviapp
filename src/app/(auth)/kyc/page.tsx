"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, CheckCircle, ArrowLeft } from "lucide-react";

export default function KYCPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleSubmit = () => {
    router.push("/provider-home");
  };

  return (
    <>
      <style>{`
        .kyc-wrap{min-height:100vh;background:#0d1117;display:flex;align-items:center;justify-content:center;padding:24px}
        .kyc-card{width:100%;max-width:480px;background:#131b27;border:1px solid #1a2535;border-radius:24px;padding:40px 36px}
        .upload-area{border:2px dashed #1a2535;border-radius:14px;padding:32px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;margin-bottom:14px;transition:border 0.2s;text-align:center}
        .upload-area:hover{border-color:#1D9E75}
        .prog-bar{height:4px;border-radius:99px;background:#1a2535;margin-bottom:28px}
        .prog-fill{height:100%;border-radius:99px;background:#1D9E75;transition:width 0.3s}
        .step-btn{width:100%;padding:15px;border-radius:12px;border:none;background:#1D9E75;color:white;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit}
        @media(max-width:480px){.kyc-card{padding:28px 20px}}
      `}</style>
      <div className="kyc-wrap">
        <div className="kyc-card">
          <button onClick={()=>step===1?router.push("/provider-home"):setStep(s=>s-1)} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#4a6a6a",background:"none",border:"none",cursor:"pointer",marginBottom:24,fontFamily:"inherit"}}>
            <ArrowLeft size={15}/> Voltar
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{width:40,height:40,borderRadius:12,background:"#1d9e7520",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Shield size={20} style={{color:"#1D9E75"}}/>
            </div>
            <div>
              <h1 style={{fontSize:20,fontWeight:700,color:"#e2e8f0"}}>Verificação de identidade</h1>
              <p style={{fontSize:13,color:"#4a6a6a"}}>Passo {step} de 2</p>
            </div>
          </div>
          <div className="prog-bar"><div className="prog-fill" style={{width:step===1?"50%":"100%"}}/></div>
          {step===1?(
            <>
              <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:6}}>Documento de identidade</p>
              <p style={{fontSize:13,color:"#4a6a6a",marginBottom:20,lineHeight:1.6}}>Faz upload do teu Bilhete de Identidade (frente e verso).</p>
              <div className="upload-area">
                <span style={{fontSize:32}}>📄</span>
                <p style={{fontSize:14,fontWeight:600,color:"#6a7a8a"}}>Frente do BI</p>
                <p style={{fontSize:12,color:"#3a4a5a"}}>JPG, PNG ou PDF · máx 5MB</p>
              </div>
              <div className="upload-area">
                <span style={{fontSize:32}}>📄</span>
                <p style={{fontSize:14,fontWeight:600,color:"#6a7a8a"}}>Verso do BI</p>
                <p style={{fontSize:12,color:"#3a4a5a"}}>JPG, PNG ou PDF · máx 5MB</p>
              </div>
              <button className="step-btn" onClick={()=>setStep(2)}>Continuar →</button>
            </>
          ):(
            <>
              <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:6}}>Selfie com documento</p>
              <p style={{fontSize:13,color:"#4a6a6a",marginBottom:20,lineHeight:1.6}}>Tira uma foto segurando o teu BI junto ao rosto.</p>
              <div className="upload-area" style={{minHeight:180}}>
                <span style={{fontSize:40}}>🤳</span>
                <p style={{fontSize:14,fontWeight:600,color:"#6a7a8a"}}>Selfie com o BI</p>
                <p style={{fontSize:12,color:"#3a4a5a"}}>Rosto visível + documento legível</p>
              </div>
              <div style={{background:"#0b2a2a",border:"1px solid #1d9e7525",borderRadius:12,padding:14,marginBottom:20}}>
                {["Aprovação em até 48h","Dados tratados com confidencialidade","Só para verificação"].map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<2?8:0}}>
                    <CheckCircle size={13} style={{color:"#1D9E75",flexShrink:0}}/>
                    <span style={{fontSize:12,color:"#4a8a6a"}}>{t}</span>
                  </div>
                ))}
              </div>
              <button className="step-btn" onClick={handleSubmit}>Submeter documentos →</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
"use client";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { ArrowLeft, CheckCircle, Clock, MessageCircle, Shield } from "lucide-react";

const steps = [
  {label:"Solicitado",desc:"Pedido criado e aguarda prestador"},
  {label:"Aceite",desc:"Prestador aceitou o pedido"},
  {label:"Pago",desc:"Pagamento retido em escrow"},
  {label:"Em execução",desc:"Serviço em andamento"},
  {label:"Concluído",desc:"Serviço terminado e confirmado"},
];

export default function ServiceDetailPage() {
  const router = useRouter();
  const currentStep = 1;
  return (
    <>
      <style>{`
        .sd-wrap{display:flex;min-height:100vh;background:#0d1117}
        .sd-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .sd-inner{flex:1;padding:28px 32px;max-width:700px;display:flex;flex-direction:column;gap:20px}
        .sd-card{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:22px}
        .timeline{display:flex;flex-direction:column;gap:0}
        .tl-item{display:flex;gap:16px;position:relative}
        .tl-line{position:absolute;left:17px;top:36px;width:2px;height:calc(100% - 8px);background:#1a2535}
        .tl-line.done{background:#1D9E75}
        .tl-dot{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1}
        .tl-content{flex:1;padding-bottom:24px}
        .action-btn{display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:12px;border:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
        @media(max-width:1024px){.sd-main{margin-left:0}}
        @media(max-width:640px){.sd-inner{padding:16px}}
      `}</style>
      <div className="sd-wrap">
        <Sidebar/>
        <div className="sd-main">
          <Navbar/>
          <div className="sd-inner">
            <button onClick={()=>router.back()} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#4a6a6a",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>
              <ArrowLeft size={15}/> Os meus serviços
            </button>

            <div>
              <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Detalhe do serviço</h1>
              <p style={{fontSize:13,color:"#4a6a6a"}}>Acompanha o estado do teu pedido</p>
            </div>

            <div className="sd-card">
              <p style={{fontSize:11,fontWeight:600,color:"#4a5a6a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>Progresso do serviço</p>
              <div className="timeline">
                {steps.map((s,i)=>{
                  const done=i<currentStep;
                  const active=i===currentStep;
                  return (
                    <div className="tl-item" key={i}>
                      {i<steps.length-1&&<div className={`tl-line${done?" done":""}`}/>}
                      <div className="tl-dot" style={{background:done?"#1D9E75":active?"#1d9e7520":"#1a2535",border:active?"2px solid #1D9E75":"none"}}>
                        {done?<CheckCircle size={18} color="white"/>:<Clock size={16} style={{color:active?"#1D9E75":"#3a4a5a"}}/>}
                      </div>
                      <div className="tl-content">
                        <p style={{fontSize:14,fontWeight:600,color:done||active?"#e2e8f0":"#3a4a5a",marginBottom:3}}>{s.label}</p>
                        <p style={{fontSize:12,color:"#4a5a6a",lineHeight:1.5}}>{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sd-card">
              <p style={{fontSize:11,fontWeight:600,color:"#4a5a6a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Informações</p>
              {[
                {label:"Categoria",value:"—"},
                {label:"Data",value:"—"},
                {label:"Morada",value:"—"},
                {label:"Valor",value:"—"},
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<3?"1px solid #1a2535":"none"}}>
                  <span style={{fontSize:13,color:"#4a6a6a"}}>{item.label}</span>
                  <span style={{fontSize:13,fontWeight:600,color:"#c0d0e0"}}>{item.value}</span>
                </div>
              ))}
            </div>

            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:14,background:"#0b2424",border:"1px solid #1d9e7525"}}>
              <Shield size={18} style={{color:"#1D9E75",flexShrink:0}}/>
              <p style={{fontSize:13,color:"#4a7a7a"}}>Pagamento protegido — libertado após confirmação de ambas as partes.</p>
            </div>

            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button className="action-btn" style={{background:"#1D9E75",color:"white",flex:1}}>
                <CheckCircle size={16}/> Confirmar conclusão
              </button>
              <button className="action-btn" style={{background:"#131b27",color:"#8a9ab0",border:"1px solid #1a2535"}}>
                <MessageCircle size={16}/> Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, CheckCircle, Clock, MessageCircle,
  Shield, Loader2, AlertCircle, Star, X,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { servicesApi, Service } from "@/lib/services.api";
import { chatApi } from "@/lib/chat.api";

const STATUS_CFG: Record<string,{label:string;color:string;bg:string}> = {
  pending:     {label:"Aguarda prestador",color:"#6a7a8a",bg:"#1a2535"},
  accepted:    {label:"Aceite",           color:"#378ADD",bg:"#378ADD20"},
  in_progress: {label:"Em execução",      color:"#EF9F27",bg:"#EF9F2720"},
  completed:   {label:"Concluído",        color:"#1D9E75",bg:"#1d9e7520"},
  cancelled:   {label:"Cancelado",        color:"#E24B4A",bg:"#E24B4A20"},
};

const TIMELINE = [
  {label:"Solicitado",  desc:"Pedido criado e aguarda prestador"},
  {label:"Aceite",      desc:"Prestador aceitou o pedido"},
  {label:"Em execução", desc:"Trabalho em andamento"},
  {label:"Concluído",   desc:"Serviço terminado e confirmado"},
];
const STATUS_STEP: Record<string,number> = {
  pending:0, accepted:1, in_progress:2, completed:3,
};

const fmt  = (d?:string) => !d?"—":new Date(d).toLocaleDateString("pt-PT",{day:"2-digit",month:"long",year:"numeric"});
const fmtD = (d?:string) => !d?"—":new Date(d).toLocaleString("pt-PT",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [service, setService]             = useState<Service|null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [confirming, setConfirming]       = useState(false);
  const [rating, setRating]               = useState(5);
  const [reviewText, setReviewText]       = useState("");
  const [chatLoading, setChatLoading]     = useState(false);
  const [confirmed, setConfirmed]         = useState(false);
  const [acceptingProp, setAcceptingProp] = useState(false);
  const [rejectingProp, setRejectingProp] = useState(false);

  useEffect(()=>{
    if (!id) return;
    servicesApi.getOne(id)
      .then(s=>{ setService(s); if(s.clientRating) setRating(s.clientRating); })
      .catch(e=>setError(e.message||"Erro ao carregar."))
      .finally(()=>setLoading(false));
  },[id]);

  const handleConfirm = async () => {
    if (!service) return;
    setConfirming(true);
    try {
      const updated = await servicesApi.confirm(service.id,{rating,review:reviewText||undefined});
      setService(updated); setConfirmed(true);
    }
    catch(e:unknown){ setError(e instanceof Error ? e.message : "Erro ao confirmar."); }
    finally { setConfirming(false); }
  };

  const handleAcceptProposal = async () => {
    if (!service) return;
    setAcceptingProp(true); setError("");
    try { setService(await servicesApi.acceptProposal(service.id)); }
    catch(e:unknown){ setError(e instanceof Error ? e.message : "Erro ao aceitar proposta."); }
    finally { setAcceptingProp(false); }
  };

  const handleRejectProposal = async () => {
    if (!service) return;
    setRejectingProp(true); setError("");
    try { setService(await servicesApi.rejectProposal(service.id)); }
    catch(e:unknown){ setError(e instanceof Error ? e.message : "Erro ao recusar proposta."); }
    finally { setRejectingProp(false); }
  };

  const handleChat = async () => {
    if (!service?.providerId) return;
    setChatLoading(true);
    try {
      const { room } = await chatApi.createOrGetRoom({
        participantId: service.providerId,
        serviceId:     service.id,
      });
      router.push(`/chat/${room.id}`);
    } catch {
      router.push("/chat");
    } finally {
      setChatLoading(false);
    }
  };

  const currentStep = service ? (STATUS_STEP[service.status] ?? 0) : 0;
  const cfg         = service ? (STATUS_CFG[service.status] ?? STATUS_CFG.pending) : STATUS_CFG.pending;
  // clientConfirmedAt existe agora na interface Service
  const canConfirm  = service?.status === "completed" && !service?.clientConfirmedAt;
  const hasProposal = !!service?.proposedByProviderId && !!service?.proposedPrice && service?.status === "pending";

  return (
    <>
      <style>{`
        .sdw{display:flex;min-height:100vh;background:#0d1117}
        .sdm{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .sdi{flex:1;padding:28px 32px;max-width:700px;display:flex;flex-direction:column;gap:20px}
        .sdc{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:22px}
        .tli{display:flex;gap:16px;position:relative}
        .tll{position:absolute;left:17px;top:36px;width:2px;height:calc(100% - 8px);background:#1a2535}
        .tll.done{background:#1D9E75}
        .tld{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1}
        .tlc{flex:1;padding-bottom:24px}
        .ir{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid #1a2535}
        .ir:last-child{border-bottom:none}
        .ab{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 20px;border-radius:12px;border:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:opacity 0.2s}
        .ab:disabled{opacity:0.6;cursor:not-allowed}
        .ab:hover:not(:disabled){opacity:0.9}
        .ri{width:100%;padding:12px 14px;border-radius:10px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;resize:none;margin-top:12px}
        .ri:focus{border-color:#1D9E75}
        .ri::placeholder{color:#4a5a6a}
        @media(max-width:1024px){.sdm{margin-left:0}}
        @media(max-width:640px){.sdi{padding:16px;gap:16px}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div className="sdw">
        <Sidebar/>
        <div className="sdm">
          <Navbar/>
          <div className="sdi">
            <button onClick={()=>router.back()} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#4a6a6a",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",width:"fit-content"}}>
              <ArrowLeft size={15}/> Os meus serviços
            </button>

            {loading&&(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:12}}>
                <Loader2 size={24} style={{color:"#1D9E75",animation:"spin 1s linear infinite"}}/>
                <span style={{fontSize:14,color:"#4a6a6a"}}>A carregar...</span>
              </div>
            )}

            {error&&!loading&&(
              <div style={{background:"#E24B4A15",border:"1px solid #E24B4A30",borderRadius:12,padding:16,display:"flex",gap:12}}>
                <AlertCircle size={18} style={{color:"#E24B4A"}}/>
                <p style={{fontSize:13,color:"#E24B4A"}}>{error}</p>
              </div>
            )}

            {service&&!loading&&(
              <>
                {/* Título */}
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                    <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",margin:0}}>{service.title}</h1>
                    <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
                  </div>
                  <p style={{fontSize:13,color:"#4a6a6a"}}>Criado em {fmt(service.createdAt)}</p>
                </div>

                {/* Proposta pendente do provider */}
                {hasProposal && (
                  <div style={{background:"#131b27",border:"2px solid #EF9F2740",borderRadius:16,padding:20}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16}}>
                      <div style={{width:42,height:42,borderRadius:12,background:"#2a1e08",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:22}}>
                        💬
                      </div>
                      <div>
                        <p style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>
                          {service.proposedByProvider?.fullName ?? "Um prestador"} fez uma proposta
                        </p>
                        <p style={{fontSize:13,color:"#6a5a3a"}}>
                          Em vez dos <strong style={{color:"#8a9ab0"}}>{Number(service.budget).toLocaleString("pt-PT")} Kz</strong>, o prestador propõe:
                        </p>
                        <p style={{fontSize:24,fontWeight:700,color:"#EF9F27",marginTop:6}}>
                          {Number(service.proposedPrice).toLocaleString("pt-PT")} Kz
                        </p>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button className="ab" style={{background:"#1D9E75",color:"white",flex:1}} disabled={acceptingProp} onClick={handleAcceptProposal}>
                        {acceptingProp?<Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/>:<CheckCircle size={15}/>}
                        {acceptingProp?"A aceitar…":"Aceitar proposta"}
                      </button>
                      <button className="ab" style={{background:"#E24B4A20",color:"#E24B4A",border:"1px solid #E24B4A30",flex:1}} disabled={rejectingProp} onClick={handleRejectProposal}>
                        {rejectingProp?<Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/>:<X size={15}/>}
                        {rejectingProp?"A recusar…":"Recusar proposta"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="sdc">
                  <p style={{fontSize:11,fontWeight:600,color:"#4a5a6a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Informações</p>
                  {[
                    {label:"Categoria",     value:service.category},
                    {label:"Morada",        value:service.address||"—"},
                    {label:"Data agendada", value:fmtD(service.scheduledAt)},
                    {label:"Prestador",     value:service.provider?.fullName??"A aguardar prestador"},
                    {label:"Orçamento",     value:`${Number(service.budget).toLocaleString("pt-PT")} Kz`,hl:true},
                    ...(service.agreedPrice && Number(service.agreedPrice)!==Number(service.budget)
                      ?[{label:"Valor acordado",value:`${Number(service.agreedPrice).toLocaleString("pt-PT")} Kz`,hl2:true}]
                      :[]),
                  ].map((item,i)=>(
                    <div className="ir" key={i}>
                      <span style={{fontSize:13,color:"#4a6a6a"}}>{item.label}</span>
                      <span style={{fontSize:13,fontWeight:600,color:(item as any).hl2?"#1D9E75":(item as any).hl?"#EF9F27":"#c0d0e0",textAlign:"right",maxWidth:"60%"}}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div className="sdc">
                  <p style={{fontSize:11,fontWeight:600,color:"#4a5a6a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>Progresso do serviço</p>
                  {TIMELINE.map((step,i)=>{
                    const done=i<currentStep; const active=i===currentStep;
                    return (
                      <div className="tli" key={i}>
                        {i<TIMELINE.length-1&&<div className={`tll${done?" done":""}`}/>}
                        <div className="tld" style={{background:done?"#1D9E75":active?"#1d9e7520":"#1a2535",border:active?"2px solid #1D9E75":"none"}}>
                          {done?<CheckCircle size={18} color="white"/>:<Clock size={16} style={{color:active?"#1D9E75":"#3a4a5a"}}/>}
                        </div>
                        <div className="tlc">
                          <p style={{fontSize:14,fontWeight:600,color:done||active?"#e2e8f0":"#3a4a5a",marginBottom:3}}>{step.label}</p>
                          <p style={{fontSize:12,color:"#4a5a6a",lineHeight:1.5}}>{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Avaliação */}
                {canConfirm && !confirmed && (
                  <div className="sdc">
                    <p style={{fontSize:11,fontWeight:600,color:"#4a5a6a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Avalia o prestador</p>
                    <div style={{display:"flex",gap:6,marginBottom:4,alignItems:"center"}}>
                      {[1,2,3,4,5].map(n=>(
                        <button key={n} onClick={()=>setRating(n)} style={{background:"none",border:"none",cursor:"pointer",padding:2}}>
                          <Star size={26} fill={n<=rating?"#EF9F27":"none"} color={n<=rating?"#EF9F27":"#3a4a5a"}/>
                        </button>
                      ))}
                      <span style={{marginLeft:8,fontSize:13,color:"#6a7a8a"}}>{rating}/5</span>
                    </div>
                    <textarea className="ri" rows={3}
                      placeholder="Deixa um comentário sobre o prestador (opcional)..."
                      value={reviewText} onChange={e=>setReviewText(e.target.value)}/>
                  </div>
                )}

                {confirmed && (
                  <div style={{padding:"14px 18px",borderRadius:14,background:"#0b2a2a",border:"1px solid #1d9e7525",display:"flex",alignItems:"center",gap:12}}>
                    <CheckCircle size={18} style={{color:"#1D9E75"}}/>
                    <p style={{fontSize:13,color:"#1D9E75"}}>Serviço confirmado. Obrigado pela avaliação!</p>
                  </div>
                )}

                {/* Segurança */}
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:14,background:"#0b2424",border:"1px solid #1d9e7525"}}>
                  <Shield size={18} style={{color:"#1D9E75",flexShrink:0}}/>
                  <p style={{fontSize:13,color:"#4a7a7a"}}>Pagamento protegido — libertado após a tua confirmação.</p>
                </div>

                {/* Botões */}
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  {canConfirm && !confirmed && (
                    <button className="ab" style={{background:"#1D9E75",color:"white",flex:1}} disabled={confirming} onClick={handleConfirm}>
                      {confirming?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<CheckCircle size={16}/>}
                      {confirming?"A confirmar…":"Confirmar conclusão"}
                    </button>
                  )}
                  {service.providerId && (
                    <button
                      className="ab"
                      style={{background:"#131b27",color:"#8a9ab0",border:"1px solid #1a2535"}}
                      disabled={chatLoading}
                      onClick={handleChat}
                    >
                      {chatLoading?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<MessageCircle size={16}/>}
                      {chatLoading?"A abrir…":"Chat com prestador"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
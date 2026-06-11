"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft, CheckCircle, Clock, MessageCircle,
  Shield, MapPin, Calendar, Tag, Loader2, AlertCircle,
  DollarSign, Play,
} from "lucide-react";
import { servicesApi, Service } from "@/lib/services.api";
import { chatApi } from "@/lib/chat.api";
import { getToken, getSession } from "@/lib/auth.api";

const STATUS_CFG: Record<string,{label:string;color:string;bg:string}> = {
  pending:     {label:"Disponível",  color:"#1D9E75",bg:"#1d9e7520"},
  accepted:    {label:"Aceite",      color:"#378ADD",bg:"#378ADD20"},
  in_progress: {label:"Em execução", color:"#EF9F27",bg:"#EF9F2720"},
  completed:   {label:"Concluído",   color:"#1D9E75",bg:"#1d9e7520"},
  cancelled:   {label:"Cancelado",   color:"#E24B4A",bg:"#E24B4A20"},
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

const fmt = (d?:string) =>
  !d?"—":new Date(d).toLocaleString("pt-PT",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"});

function DetailInner() {
  const router       = useRouter();
  const { id }       = useParams() as { id: string };
  const searchParams = useSearchParams();
  const autoPropose  = searchParams.get("action") === "propose";

  const [service, setService]         = useState<Service|null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [accepting, setAccepting]     = useState(false);
  const [starting, setStarting]       = useState(false);
  const [completing, setCompleting]   = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [showPropose, setShowPropose] = useState(autoPropose);
  const [proposedPrice, setProposedPrice] = useState("");
  const [proposing, setProposing]     = useState(false);

  const [user, setUser] = useState<any>(null);
  useEffect(() => { setUser(getSession()); }, []);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    servicesApi.getOne(id)
      .then(setService)
      .catch(e => setError(e.message || "Erro ao carregar pedido."))
      .finally(() => setLoading(false));
  }, [id]);

  // Chat rápido — abre conversa com o cliente
  const handleChat = async () => {
    if (!service?.clientId) return;
    setChatLoading(true);
    try {
      const { room } = await chatApi.createOrGetRoom({
        participantId: service.clientId,
        serviceId:     service.id,
      });
      router.push(`/provider/chat/${room.id}`);
    } catch {
      router.push("/provider/chat");
    } finally {
      setChatLoading(false);
    }
  };

  // Propor valor — abre formulário + cria sala + envia mensagem de abertura
  const handleProposeClick = async () => {
    setShowPropose(true);
    if (!service?.clientId) return;
    try {
      const { room } = await chatApi.createOrGetRoom({
        participantId: service.clientId,
        serviceId:     service.id,
      });
      await chatApi.sendMessage(
        room.id,
        `Olá! Tenho interesse no teu pedido "${service.title}". Gostaria de negociar o preço antes de aceitar formalmente. Vou enviar uma proposta em breve.`,
      );
    } catch {
      // Não bloqueia o formulário se o chat falhar
    }
  };

  // Aceitar pelo orçamento do cliente
  const handleAccept = async () => {
    if (!service) return;
    setAccepting(true); setError("");
    try { setService(await servicesApi.accept(service.id, service.budget)); }
    catch (e:any) { setError(e.message || "Erro ao aceitar."); }
    finally { setAccepting(false); }
  };

  // Enviar proposta de preço
  const handlePropose = async () => {
    if (!service || !proposedPrice || Number(proposedPrice) <= 0) {
      setError("Introduz um valor válido."); return;
    }
    setProposing(true); setError("");
    try {
      setService(await servicesApi.proposePrice(service.id, Number(proposedPrice)));
      setShowPropose(false);
    }
    catch (e:any) { setError(e.message || "Erro ao enviar proposta."); }
    finally { setProposing(false); }
  };

  const handleStart = async () => {
    if (!service) return;
    setStarting(true); setError("");
    try { setService(await servicesApi.start(service.id)); }
    catch (e:any) { setError(e.message || "Erro ao iniciar."); }
    finally { setStarting(false); }
  };

  const handleComplete = async () => {
    if (!service) return;
    setCompleting(true); setError("");
    try { setService(await servicesApi.complete(service.id)); }
    catch (e:any) { setError(e.message || "Erro ao concluir."); }
    finally { setCompleting(false); }
  };

  const cfg           = service ? (STATUS_CFG[service.status] ?? STATUS_CFG.pending) : STATUS_CFG.pending;
  const currentStep   = service ? (STATUS_STEP[service.status] ?? 0) : 0;
  const isAvailable   = service?.status === "pending" && !service?.providerId;
  const isMyService   = service?.providerId === user?.id;
  const isMyProposal  = service?.proposedByProviderId === user?.id;
  const hasOtherProp  = !!service?.proposedByProviderId && service.proposedByProviderId !== user?.id;

  return (
    <>
      <style>{`
        .sdi{padding:28px 32px;max-width:680px;display:flex;flex-direction:column;gap:20px}
        .sdc{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:22px}
        .tli{display:flex;gap:16px;position:relative}
        .tll{position:absolute;left:17px;top:36px;width:2px;height:calc(100% - 8px);background:#1a2535}
        .tll.done{background:#1D9E75}
        .tld{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1}
        .tlc{flex:1;padding-bottom:24px}
        .ir{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #1a2535}
        .ir:last-child{border-bottom:none}
        .ab{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 20px;border-radius:12px;border:none;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;flex:1;transition:opacity 0.2s}
        .ab:disabled{opacity:0.6;cursor:not-allowed}
        .ab:hover:not(:disabled){opacity:0.9}
        .pi{width:100%;padding:13px 16px;border-radius:12px;background:#0d1117;border:1px solid #EF9F2740;color:#e2e8f0;font-size:14px;outline:none;font-family:inherit;margin-bottom:12px}
        .pi:focus{border-color:#EF9F27}
        .pi::placeholder{color:#4a5a6a}
        @media(max-width:640px){.sdi{padding:16px;gap:16px}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div className="sdi">
        <button onClick={()=>router.back()} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#4a6a6a",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",width:"fit-content"}}>
          <ArrowLeft size={15}/> Voltar
        </button>

        {loading && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:12}}>
            <Loader2 size={24} style={{color:"#EF9F27",animation:"spin 1s linear infinite"}}/>
            <span style={{fontSize:14,color:"#4a6a6a"}}>A carregar...</span>
          </div>
        )}

        {error && !loading && (
          <div style={{background:"#E24B4A15",border:"1px solid #E24B4A30",borderRadius:12,padding:16,display:"flex",gap:12}}>
            <AlertCircle size={18} style={{color:"#E24B4A",flexShrink:0}}/>
            <p style={{fontSize:13,color:"#E24B4A"}}>{error}</p>
          </div>
        )}

        {service && !loading && (
          <>
            {/* Título */}
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",margin:0}}>{service.title}</h1>
                <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
                {isMyProposal && service.status==="pending" && (
                  <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:"#378ADD20",color:"#378ADD"}}>
                    Proposta: {Number(service.proposedPrice).toLocaleString("pt-PT")} Kz
                  </span>
                )}
              </div>
              <p style={{fontSize:13,color:"#4a6a6a"}}>Criado em {fmt(service.createdAt)}</p>
            </div>

            {/* Info cliente */}
            <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"#131b27",border:"1px solid #1a2535",borderRadius:14}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:"#1a3a2a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#1D9E75",flexShrink:0}}>
                {service.client?.fullName?.charAt(0)?.toUpperCase() ?? "C"}
              </div>
              <div>
                <p style={{fontSize:11,color:"#4a6a6a",marginBottom:2}}>Cliente</p>
                <p style={{fontSize:15,fontWeight:700,color:"#e2e8f0"}}>{service.client?.fullName ?? "—"}</p>
              </div>
            </div>

            {/* Detalhes */}
            <div className="sdc">
              <p style={{fontSize:11,fontWeight:600,color:"#4a5a6a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Informações</p>
              {[
                {icon:<Tag size={14}/>,      label:"Categoria",         value:service.category},
                {icon:<MapPin size={14}/>,   label:"Morada",            value:service.address||"—"},
                {icon:<Calendar size={14}/>, label:"Data agendada",     value:fmt(service.scheduledAt)},
                {icon:"💰",                  label:"Orçamento cliente", value:`${Number(service.budget).toLocaleString("pt-PT")} Kz`, hl:true},
                ...(service.agreedPrice && Number(service.agreedPrice)!==Number(service.budget)
                  ? [{icon:"✅", label:"Valor acordado", value:`${Number(service.agreedPrice).toLocaleString("pt-PT")} Kz`, hl2:true}]
                  : []),
              ].map((item,i)=>(
                <div className="ir" key={i}>
                  <span style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#4a6a6a"}}>{item.icon} {item.label}</span>
                  <span style={{fontSize:13,fontWeight:600,color:(item as any).hl2?"#1D9E75":(item as any).hl?"#EF9F27":"#c0d0e0",textAlign:"right",maxWidth:"60%"}}>
                    {item.value}
                  </span>
                </div>
              ))}
              {service.description && (
                <div style={{marginTop:14,padding:"12px 14px",background:"#0d1117",borderRadius:10,border:"1px solid #1a2535"}}>
                  <p style={{fontSize:11,fontWeight:600,color:"#4a5a6a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Descrição</p>
                  <p style={{fontSize:13,color:"#6a7a8a",lineHeight:1.7}}>{service.description}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="sdc">
              <p style={{fontSize:11,fontWeight:600,color:"#4a5a6a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:16}}>Progresso</p>
              {TIMELINE.map((step,i)=>{
                const done=i<currentStep; const active=i===currentStep;
                return (
                  <div className="tli" key={i}>
                    {i<TIMELINE.length-1 && <div className={`tll${done?" done":""}`}/>}
                    <div className="tld" style={{background:done?"#1D9E75":active?"#1d9e7520":"#1a2535",border:active?"2px solid #1D9E75":"none"}}>
                      {done ? <CheckCircle size={18} color="white"/> : <Clock size={16} style={{color:active?"#1D9E75":"#3a4a5a"}}/>}
                    </div>
                    <div className="tlc">
                      <p style={{fontSize:14,fontWeight:600,color:done||active?"#e2e8f0":"#3a4a5a",marginBottom:3}}>{step.label}</p>
                      <p style={{fontSize:12,color:"#4a5a6a",lineHeight:1.5}}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formulário proposta */}
            {showPropose && isAvailable && !hasOtherProp && !isMyProposal && (
              <div className="sdc" style={{border:"1px solid #EF9F2740",background:"#1a1205"}}>
                <p style={{fontSize:13,fontWeight:700,color:"#EF9F27",marginBottom:4}}>Propor outro valor</p>
                <p style={{fontSize:12,color:"#6a5a3a",marginBottom:14,lineHeight:1.5}}>
                  O cliente foi notificado via chat. Introduz o valor que propões para este trabalho.
                </p>
                <input
                  className="pi"
                  type="number"
                  placeholder={`Orçamento do cliente: ${Number(service.budget).toLocaleString("pt-PT")} Kz`}
                  value={proposedPrice}
                  onChange={e=>{setProposedPrice(e.target.value);setError("");}}
                  min="1"
                />
                <div style={{display:"flex",gap:8}}>
                  <button className="ab" style={{background:"#EF9F27",color:"#0d1117"}} disabled={proposing||!proposedPrice} onClick={handlePropose}>
                    {proposing?<Loader2 size={15} style={{animation:"spin 1s linear infinite"}}/>:<DollarSign size={15}/>}
                    {proposing?"A enviar...":"Enviar proposta formal"}
                  </button>
                  <button onClick={()=>setShowPropose(false)} style={{padding:"14px 20px",borderRadius:12,border:"1px solid #1a2535",background:"#0d1117",color:"#6a7a8a",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Proposta enviada — aguarda cliente */}
            {isMyProposal && service.status==="pending" && (
              <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"16px 20px",borderRadius:14,background:"#0b2020",border:"1px solid #378ADD25"}}>
                <Clock size={18} style={{color:"#378ADD",flexShrink:0,marginTop:2}}/>
                <div>
                  <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:4}}>A aguardar resposta do cliente</p>
                  <p style={{fontSize:13,color:"#4a6a6a"}}>
                    Propuseste <strong style={{color:"#378ADD"}}>{Number(service.proposedPrice).toLocaleString("pt-PT")} Kz</strong>. O cliente irá aceitar ou recusar.
                  </p>
                </div>
              </div>
            )}

            {/* Em negociação com outro */}
            {hasOtherProp && isAvailable && (
              <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"16px 20px",borderRadius:14,background:"#2a1e08",border:"1px solid #EF9F2725"}}>
                <AlertCircle size={18} style={{color:"#EF9F27",flexShrink:0,marginTop:2}}/>
                <p style={{fontSize:13,color:"#8a6a3a"}}>
                  Este pedido está em negociação com outro prestador. Não podes aceitar enquanto a negociação estiver activa.
                </p>
              </div>
            )}

            {/* Segurança */}
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:14,background:"#0b2424",border:"1px solid #1d9e7525"}}>
              <Shield size={18} style={{color:"#1D9E75",flexShrink:0}}/>
              <p style={{fontSize:13,color:"#4a7a7a"}}>Pagamento protegido — libertado após confirmação do cliente.</p>
            </div>

            {/* Botões de acção */}
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {/* Disponível para aceitar */}
              {isAvailable && !hasOtherProp && !isMyProposal && (
                <>
                  <button className="ab" style={{background:"#EF9F27",color:"#0d1117"}} disabled={accepting} onClick={handleAccept}>
                    {accepting?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<CheckCircle size={16}/>}
                    {accepting?"A aceitar…":`Aceitar — ${Number(service.budget).toLocaleString("pt-PT")} Kz`}
                  </button>
                  {!showPropose && (
                    <button className="ab" style={{background:"#131b27",color:"#EF9F27",border:"1px solid #EF9F2740",flex:"0 0 auto"}} onClick={handleProposeClick}>
                      <DollarSign size={16}/> Propor valor
                    </button>
                  )}
                </>
              )}

              {/* Aceite → Iniciar */}
              {isMyService && service.status==="accepted" && (
                <button className="ab" style={{background:"#1D9E75",color:"white"}} disabled={starting} onClick={handleStart}>
                  {starting?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<Play size={16}/>}
                  {starting?"A iniciar…":"Iniciar trabalho"}
                </button>
              )}

              {/* Em execução → Concluir */}
              {isMyService && service.status==="in_progress" && (
                <button className="ab" style={{background:"#1D9E75",color:"white"}} disabled={completing} onClick={handleComplete}>
                  {completing?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<CheckCircle size={16}/>}
                  {completing?"A concluir…":"Marcar como concluído"}
                </button>
              )}

              {/* Chat sempre disponível */}
              <button
                className="ab"
                style={{background:"#131b27",color:"#8a9ab0",border:"1px solid #1a2535",flex:"0 0 auto"}}
                disabled={chatLoading || !service.clientId}
                onClick={handleChat}
              >
                {chatLoading?<Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/>:<MessageCircle size={16}/>}
                {chatLoading?"A abrir…":"Chat rápido"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function ProviderServiceDetailPage() {
  return (
    <Suspense fallback={
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:12}}>
        <Loader2 size={24} style={{color:"#EF9F27",animation:"spin 1s linear infinite"}}/>
        <span style={{fontSize:14,color:"#4a6a6a"}}>A carregar...</span>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <DetailInner/>
    </Suspense>
  );
}
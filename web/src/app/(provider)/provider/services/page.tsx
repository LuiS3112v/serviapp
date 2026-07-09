"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase, AlertCircle, ChevronRight, RefreshCw,
  Loader2, CheckCircle, MapPin, Calendar, Tag,
  MessageSquare, Filter, X,
} from "lucide-react";
import { servicesApi, Service, AvailableFilter } from "@/lib/services.api";
import { getToken } from "@/lib/auth.api";

const CATEGORIES = ["","Limpeza","Climatização","Canalização","Eletricista","TI & Redes","Jardinagem","Mudanças","Beleza","Automóvel","Pintura","Construção","Segurança"];
const PROVINCES  = ["","Luanda","Benguela","Huambo","Huíla","Malanje","Namibe","Kwanza Sul","Kwanza Norte","Bié","Moxico","Lunda Norte","Lunda Sul","Cunene","Cabinda","Zaire","Uíge","Bengo","Cuando Cubango"];

// FIX: nomes alinhados com o ServiceStatus real do backend. "pending" e
// "paid" nunca existiram como valores reais — o status correcto depois
// de aceite é "accepted", depois do pagamento é "payment_held", e por
// isso os serviços desapareciam: nenhuma tab reconhecia esses valores.
const STATUS_CFG: Record<string,{label:string;color:string;bg:string}> = {
  requested:          { label:"Disponível",             color:"#1D9E75", bg:"#1d9e7520" },
  accepted:           { label:"Aceite",                 color:"#378ADD", bg:"#378ADD20" },
  payment_held:       { label:"Pago — protegido",       color:"#8B5CF6", bg:"#8B5CF620" },
  in_progress:        { label:"Em execução",            color:"#EF9F27", bg:"#EF9F2720" },
  provider_completed: { label:"Aguarda confirmação",    color:"#EF9F27", bg:"#EF9F2720" },
  completed:          { label:"Concluído",              color:"#1D9E75", bg:"#1d9e7520" },
  cancelled:          { label:"Cancelado",              color:"#E24B4A", bg:"#E24B4A20" },
  refunded:           { label:"Reembolsado",            color:"#E24B4A", bg:"#E24B4A20" },
  disputed:           { label:"Em disputa",             color:"#D4537E", bg:"#D4537E20" },
  rejected:           { label:"Recusado",               color:"#E24B4A", bg:"#E24B4A20" },
};

const TABS = [
  {label:"Mercado",     value:"available",   desc:"Pedidos de clientes disponíveis"},
  {label:"Propostas",   value:"proposals",   desc:"As tuas contra-propostas pendentes"},
  {label:"Aceites",     value:"accepted",    desc:"Trabalhos que aceitaste"},
  {label:"Em execução", value:"in_progress", desc:"A decorrer agora"},
  {label:"Concluídos",  value:"completed",   desc:"Trabalhos terminados"},
  {label:"Cancelados",  value:"cancelled",   desc:"Cancelados"},
];

// FIX: mapeia cada tab para TODOS os status reais que devem aparecer nela.
// "Aceites" agora inclui accepted + payment_held (aceite E já pago, ambos
// ainda não iniciados). "Em execução" inclui in_progress + provider_completed
// (a decorrer e à espera de confirmação do cliente). "Cancelados" inclui
// cancelled + refunded + rejected.
const TAB_STATUSES: Record<string, string[]> = {
  accepted:    ["accepted", "payment_held"],
  in_progress: ["in_progress", "provider_completed"],
  completed:   ["completed"],
  cancelled:   ["cancelled", "refunded", "rejected"],
};

const fmt = (d:string) =>
  new Date(d).toLocaleDateString("pt-PT",{day:"2-digit",month:"short",year:"numeric"});

function PageSpinner() {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:12}}>
      <Loader2 size={24} style={{color:"#EF9F27",animation:"spin 1s linear infinite"}}/>
      <span style={{fontSize:14,color:"#4a6a6a"}}>A carregar...</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ProviderServicesInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const tabParam     = searchParams.get("tab");
  const initTab      = tabParam === "mine" ? "accepted" : (tabParam ?? "available");

  const [tab, setTab]                 = useState(initTab);
  const [services, setServices]       = useState<Service[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState("");
  const [accepting, setAccepting]     = useState<string|null>(null);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter]           = useState<AvailableFilter>({});
  const isLoggedIn = !!getToken();

  const filterKey = JSON.stringify(filter);

  const load = useCallback(async () => {
    if (!isLoggedIn) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      let data: Service[];
      if (tab === "available") {
        data = await servicesApi.getAvailable(JSON.parse(filterKey));
      } else if (tab === "proposals") {
        data = await servicesApi.getMyProposals();
      } else {
        // FIX: busca TODOS os trabalhos do prestador sem filtro no
        // backend, e filtra no frontend pelos status desta tab. O
        // backend antigo só sabia filtrar por um único status; agora
        // cada tab pode cobrir vários status ao mesmo tempo.
        const all = await servicesApi.getProviderServices();
        const wanted = TAB_STATUSES[tab] ?? [tab];
        data = all.filter(s => wanted.includes(s.status));
      }
      setServices(data);
    } catch (e:any) {
      setError(e.message || "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [tab, isLoggedIn, refreshKey, filterKey]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey(k => k+1);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleAccept = async (id:string, budget:number) => {
    setAccepting(id);
    try { await servicesApi.accept(id, budget); setRefreshKey(k => k+1); }
    catch (e:any) { setError(e.message || "Erro ao aceitar."); }
    finally { setAccepting(null); }
  };

  const activeFilters = Object.values(filter).filter(Boolean).length;

  return (
    <>
      <style>{`
        .psv{padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:800px}
        .tabs-row{display:flex;gap:4px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
        .tabs-row::-webkit-scrollbar{display:none}
        .ptab{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;background:#131b27;border:1px solid #1a2535;color:#6a7a8a;transition:all 0.15s;font-family:inherit;white-space:nowrap;flex-shrink:0}
        .ptab.on{background:#EF9F27;border-color:#EF9F27;color:#0d1117}
        .feed{display:flex;flex-direction:column;overflow-y:auto;max-height:calc(100vh - 320px)}
        .feed::-webkit-scrollbar{width:4px}
        .feed::-webkit-scrollbar-thumb{background:#1a2535;border-radius:4px}
        .ocard{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px;margin-bottom:12px;transition:border-color 0.2s}
        .ocard:hover{border-color:#EF9F2760}
        .ocard:last-child{margin-bottom:0}
        .ometa{display:flex;align-items:center;gap:6px;font-size:12px;color:#4a6a6a;flex-wrap:wrap}
        .ometa span{display:flex;align-items:center;gap:4px}
        .empty-s{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;text-align:center}
        .ebox{background:#E24B4A15;border:1px solid #E24B4A30;border-radius:12px;padding:16px;display:flex;align-items:flex-start;gap:12px}
        .abtn{display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:10px;border:none;background:#EF9F27;color:#0d1117;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity 0.2s}
        .abtn:disabled{opacity:0.6;cursor:not-allowed}
        .pbtn{display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:10px;border:1px solid #EF9F2740;background:#EF9F2715;color:#EF9F27;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .pbtn:hover{background:#EF9F27;color:#0d1117}
        .dbtn{display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:10px;border:1px solid #1a2535;background:#0d1117;color:#8a9ab0;font-size:13px;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .dbtn:hover{border-color:#EF9F2760;color:#EF9F27}
        .rbtn{display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:12px;border:1px solid #1a2535;background:#131b27;color:#6a7a8a;font-size:13px;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .rbtn:hover{border-color:#EF9F27;color:#EF9F27}
        .rbtn:disabled{opacity:0.6;cursor:not-allowed}
        .fpanel{background:#131b27;border:1px solid #1a2535;border-radius:14px;padding:16px;display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end}
        .fsel{padding:10px 14px;border-radius:10px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;cursor:pointer;min-width:140px}
        .finp{padding:10px 14px;border-radius:10px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;width:120px}
        .flabel{font-size:11px;font-weight:600;color:#4a5a6a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px}
        @media(max-width:640px){.psv{padding:16px;gap:16px}.feed{max-height:none}.fpanel{flex-direction:column}.fsel,.finp{width:100%!important;min-width:unset}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div className="psv">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>
              {TABS.find(t=>t.value===tab)?.label ?? "Pedidos"}
            </h1>
            <p style={{fontSize:13,color:"#4a6a6a"}}>
              {loading
                ? "A carregar..."
                : `${services.length} resultado${services.length!==1?"s":""} · ${TABS.find(t=>t.value===tab)?.desc}`}
            </p>
          </div>
          <div style={{display:"flex",gap:8}}>
            {tab==="available" && (
              <button
                onClick={()=>setShowFilters(f=>!f)}
                style={{
                  display:"flex",alignItems:"center",gap:6,padding:"10px 16px",borderRadius:12,
                  border:`1px solid ${showFilters?"#EF9F27":"#1a2535"}`,
                  background:showFilters?"#EF9F2720":"#131b27",
                  color:showFilters?"#EF9F27":"#6a7a8a",
                  fontSize:13,cursor:"pointer",fontFamily:"inherit",
                  position:"relative",transition:"all 0.15s",
                }}
              >
                <Filter size={14}/>
                Filtros
                {activeFilters>0 && (
                  <span style={{position:"absolute",top:-6,right:-6,width:16,height:16,borderRadius:"50%",background:"#EF9F27",color:"#0d1117",fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {activeFilters}
                  </span>
                )}
              </button>
            )}
            <button className="rbtn" disabled={loading||refreshing} onClick={handleRefresh}>
              <RefreshCw size={14} style={{animation:loading||refreshing?"spin 1s linear infinite":"none"}}/>
              {refreshing?"A actualizar...":"Actualizar"}
            </button>
          </div>
        </div>

        <div className="tabs-row">
          {TABS.map(t=>(
            <button key={t.value} className={`ptab${tab===t.value?" on":""}`} onClick={()=>setTab(t.value)}>
              {t.label}
            </button>
          ))}
        </div>

        {showFilters && tab==="available" && (
          <div className="fpanel">
            <div>
              <p className="flabel">Categoria</p>
              <select className="fsel" value={filter.category??""} onChange={e=>setFilter(f=>({...f,category:e.target.value||undefined}))}>
                <option value="">Todas as categorias</option>
                {CATEGORIES.filter(Boolean).map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <p className="flabel">Província</p>
              <select className="fsel" value={filter.province??""} onChange={e=>setFilter(f=>({...f,province:e.target.value||undefined}))}>
                <option value="">Todas as províncias</option>
                {PROVINCES.filter(Boolean).map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <p className="flabel">Orçamento mín. (Kz)</p>
              <input className="finp" type="number" placeholder="0" min="0"
                value={filter.minBudget??""} onChange={e=>setFilter(f=>({...f,minBudget:e.target.value?Number(e.target.value):undefined}))}/>
            </div>
            <div>
              <p className="flabel">Orçamento máx. (Kz)</p>
              <input className="finp" type="number" placeholder="Sem limite" min="0"
                value={filter.maxBudget??""} onChange={e=>setFilter(f=>({...f,maxBudget:e.target.value?Number(e.target.value):undefined}))}/>
            </div>
            {activeFilters>0 && (
              <button onClick={()=>setFilter({})} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 14px",borderRadius:10,border:"1px solid #E24B4A40",background:"#E24B4A15",color:"#E24B4A",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                <X size={12}/> Limpar
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="ebox">
            <AlertCircle size={18} style={{color:"#E24B4A",flexShrink:0,marginTop:2}}/>
            <p style={{fontSize:13,color:"#E24B4A"}}>{error}</p>
          </div>
        )}

        {loading ? <PageSpinner/> : services.length===0 ? (
          <div className="empty-s">
            <div style={{width:64,height:64,borderRadius:20,background:"#131b27",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Briefcase size={28} style={{color:"#2a3a4a"}}/>
            </div>
            <p style={{fontSize:16,fontWeight:700,color:"#c0d0e0"}}>
              {tab==="available"  ?"Sem pedidos de clientes disponíveis":
               tab==="proposals"  ?"Sem propostas enviadas":
               tab==="accepted"   ?"Sem trabalhos aceites":
               tab==="in_progress"?"Nenhum trabalho em execução":
               tab==="completed"  ?"Sem trabalhos concluídos":"Sem cancelamentos"}
            </p>
            <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:340}}>
              {tab==="available"
                ?"Quando clientes publicarem pedidos, vão aparecer aqui para aceitares ou propores um valor."
                :tab==="proposals"
                ?"Quando propores um preço alternativo, aparece aqui enquanto o cliente não responde."
                :tab==="accepted"
                ?"Quando aceitares pedidos, aparecem aqui. Podes então iniciar o trabalho."
                :tab==="in_progress"
                ?"Quando iniciares um trabalho aceite, aparece aqui até ser concluído."
                :"Os teus registos aparecem aqui para consulta."}
            </p>
          </div>
        ) : (
          <div className="feed">
            {services.map(s=>{
              const cfg          = STATUS_CFG[s.status] ?? STATUS_CFG.requested;
              const isAvailable  = s.status==="requested" && !s.providerId;
              const hasOtherProp = !!s.proposedByProviderId && !s.providerId;
              return (
                <div className="ocard" key={s.id}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                        <h3 style={{fontSize:15,fontWeight:700,color:"#e2e8f0",margin:0}}>{s.title}</h3>
                        <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>
                        {tab==="proposals" && s.proposedPrice && (
                          <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:"#378ADD20",color:"#378ADD"}}>
                            Proposta: {Number(s.proposedPrice).toLocaleString("pt-PT")} Kz
                          </span>
                        )}
                        {hasOtherProp && tab==="available" && (
                          <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:"#EF9F2720",color:"#EF9F27",border:"1px solid #EF9F2740"}}>
                            Em negociação
                          </span>
                        )}
                      </div>
                      <div className="ometa">
                        {s.client?.fullName && <span style={{color:"#8a9ab0",fontWeight:500}}>{s.client.fullName}</span>}
                        <span style={{color:"#2a3a4a"}}>·</span>
                        <span><Tag size={11}/> {s.category}</span>
                        {(s.province||s.address) && (
                          <><span style={{color:"#2a3a4a"}}>·</span><span><MapPin size={11}/> {s.province||s.address}</span></>
                        )}
                        {s.scheduledAt && (
                          <><span style={{color:"#2a3a4a"}}>·</span><span><Calendar size={11}/> {fmt(s.scheduledAt)}</span></>
                        )}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <p style={{fontSize:16,fontWeight:700,color:"#EF9F27"}}>{Number(s.budget).toLocaleString("pt-PT")} Kz</p>
                      {s.agreedPrice && Number(s.agreedPrice)!==Number(s.budget) && (
                        <p style={{fontSize:12,color:"#1D9E75",fontWeight:600}}>
                          Acordado: {Number(s.agreedPrice).toLocaleString("pt-PT")} Kz
                        </p>
                      )}
                      <p style={{fontSize:11,color:"#3a4a5a",marginTop:2}}>{fmt(s.createdAt)}</p>
                    </div>
                  </div>
                  {s.description && (
                    <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,marginBottom:14,padding:"10px 14px",background:"#0d1117",borderRadius:10,border:"1px solid #1a2535"}}>
                      {s.description.length>140 ? s.description.slice(0,140)+"…" : s.description}
                    </p>
                  )}
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {isAvailable && !hasOtherProp && (
                      <button className="abtn" disabled={accepting===s.id} onClick={()=>handleAccept(s.id, s.budget)}>
                        {accepting===s.id ? <Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/> : <CheckCircle size={14}/>}
                        {accepting===s.id ? "A aceitar…" : `Aceitar — ${Number(s.budget).toLocaleString("pt-PT")} Kz`}
                      </button>
                    )}
                    {isAvailable && !hasOtherProp && (
                      <button className="pbtn" onClick={()=>router.push(`/provider/services/${s.id}?action=propose`)}>
                        <MessageSquare size={14}/>
                        Propor valor
                      </button>
                    )}
                    <button className="dbtn" onClick={()=>router.push(`/provider/services/${s.id}`)}>
                      Ver detalhe <ChevronRight size={14}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function ProviderServicesPage() {
  return (
    <Suspense fallback={<PageSpinner/>}>
      <ProviderServicesInner/>
    </Suspense>
  );
}
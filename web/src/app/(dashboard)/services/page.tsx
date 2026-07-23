"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Plus, Briefcase, Clock, CheckCircle,
  AlertCircle, ChevronRight, Loader2, RefreshCw,
} from "lucide-react";
import { servicesApi, Service } from "@/lib/services.api";
import { getToken, getSession } from "@/lib/auth.api";

// FIX: tabs e status alinhados com o ServiceStatus real do backend.
// "pending" e "paid" nunca existiram como valores reais — por isso os
// serviços desapareciam depois de aceites e pagos: nenhuma tab ou
// STATUS_CONFIG reconhecia "accepted" nem "payment_held".
const TABS = [
  { label:"Todos",       value:"" },
  { label:"Pendente",    value:"pending" },      // agrupa requested + accepted + payment_held
  { label:"Em execução", value:"in_progress" },  // agrupa in_progress + provider_completed
  { label:"Concluído",   value:"completed" },
  { label:"Cancelado",   value:"cancelled" },    // agrupa cancelled + refunded + rejected
];

// Cada tab do frontend mapeia para um conjunto de status reais do backend
const TAB_STATUSES: Record<string, string[]> = {
  "":            [], // Todos — sem filtro
  pending:       ["requested", "accepted", "payment_held"],
  in_progress:   ["in_progress", "provider_completed"],
  completed:     ["completed"],
  cancelled:     ["cancelled", "refunded", "rejected"],
};

const STATUS_CONFIG: Record<string, { label:string; color:string; bg:string; icon:any }> = {
  requested:          { label:"Solicitado",          color:"#64748B", bg:"#F1F5F9",   icon:Clock },
  accepted:           { label:"Aceite",              color:"#378ADD", bg:"#378ADD20", icon:CheckCircle },
  payment_held:       { label:"Pago — protegido",    color:"#8B5CF6", bg:"#8B5CF620", icon:CheckCircle },
  in_progress:        { label:"Em execução",         color:"#EF9F27", bg:"#EF9F2720", icon:Clock },
  provider_completed: { label:"Aguarda confirmação", color:"#EF9F27", bg:"#EF9F2720", icon:Clock },
  completed:          { label:"Concluído",           color:"#0E7A5F", bg:"#0E7A5F20", icon:CheckCircle },
  cancelled:          { label:"Cancelado",           color:"#E24B4A", bg:"#E24B4A20", icon:AlertCircle },
  refunded:           { label:"Reembolsado",         color:"#E24B4A", bg:"#E24B4A20", icon:AlertCircle },
  disputed:           { label:"Em disputa",          color:"#D4537E", bg:"#D4537E20", icon:AlertCircle },
  rejected:           { label:"Recusado",            color:"#E24B4A", bg:"#E24B4A20", icon:AlertCircle },
};

// Timeline de 6 passos, alinhada com o fluxo real de escrow
const TIMELINE_STEPS = ["Solicitado","Aceite","Pago","Em execução","Concluído","Confirmado"];
const STATUS_STEP: Record<string, number> = {
  requested:          1,
  accepted:           2,
  payment_held:       3,
  in_progress:        4,
  provider_completed: 5,
  completed:          6,
};

type PageStatus = "initial-loading" | "refreshing" | "idle";

export default function ServicesPage() {
  const router = useRouter();
  const [tab, setTab] = useState("");
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [pageStatus, setPageStatus] = useState<PageStatus>("initial-loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const isRefreshRef = useRef(false);

  const loading = pageStatus !== "idle";
  const refreshing = pageStatus === "refreshing";

  useEffect(() => {
    const user = getSession();
    if (!getToken()) { router.push("/"); return; }
    if (user?.role === "provider" || user?.role === "company") {
      router.replace("/provider/services");
    }
  }, []);

  // FIX: busca SEMPRE todos os serviços do cliente sem filtro no backend,
  // e filtra no frontend pelos status agrupados desta tab. Isto evita
  // depender do backend saber mapear "pending" para vários status reais.
  const load = useCallback(async () => {
    const token = getToken();
    const user = getSession();
    if (!token || user?.role !== "client") { setPageStatus("idle"); return; }

    setPageStatus(isRefreshRef.current ? "refreshing" : "initial-loading");
    setError("");
    try {
      const [data] = await Promise.all([
        servicesApi.getMyServices(),
        new Promise(res => setTimeout(res, 2000)),
      ]);
      setAllServices(data);
    } catch (e: any) {
      setError(
        e.message?.includes("Forbidden")
          ? "Sem permissão. Certifica-te que estás logado como cliente."
          : e.message || "Erro ao carregar serviços."
      );
    } finally {
      setPageStatus("idle");
      isRefreshRef.current = false;
    }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => {
    isRefreshRef.current = true;
    setPageStatus("refreshing");
    setRefreshKey(k => k + 1);
  };

  // Filtro aplicado no frontend — cada tab pode cobrir vários status reais
  const services = tab === ""
    ? allServices
    : allServices.filter(s => (TAB_STATUSES[tab] ?? [tab]).includes(s.status));

  return (
    <>
      <style>{`
        .sv-wrap{display:flex;min-height:100vh;background:#FFFFFF}
        .sv-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .sv-inner{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:20px}
        .tabs{display:flex;gap:4px;background:#F1F5F9;border-radius:12px;padding:4px;border:1px solid #E2E8F0;width:fit-content;flex-wrap:wrap}
        .tab{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;color:#64748B;transition:all 0.15s;font-family:inherit}
        .tab.on{background:#0E7A5F;color:white}
        .scard{background:#E2E8F0;border:1px solid #CBD5E1;border-radius:16px;padding:20px;cursor:pointer;transition:all 0.2s;margin-bottom:12px;box-shadow:0 1px 3px rgba(15,23,42,0.06)}
        .scard:hover{border-color:#0E7A5F;box-shadow:0 10px 22px rgba(15,23,42,0.10)}
        .timeline{display:flex;align-items:center;margin-top:16px}
        .tl-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
        .tl-line{flex:1;height:2px;margin-bottom:16px}
        .tl-label{font-size:9px;color:#4B5563;text-align:center;margin-top:4px;max-width:60px}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;text-align:center}
        .error-box{background:#FEF2F2;border:1px solid #FCA5A5;border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px}

        @keyframes do-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning      { display:inline-flex; animation:do-spin 0.7s linear infinite; }
        .not-spinning  { display:inline-flex; }
        .page-spinning { display:inline-flex; animation:do-spin 1s linear infinite; }

        .refresh-btn {
          display:flex;align-items:center;gap:6px;padding:10px 16px;
          border-radius:12px;border:1px solid #E2E8F0;background:#FFFFFF;
          color:#475569;font-size:13px;font-family:inherit;
          min-width:128px;justify-content:center;
          transition:color 0.15s, border-color 0.15s;
        }
        .refresh-btn:not(:disabled) { cursor:pointer; }
        .refresh-btn:not(:disabled):hover { border-color:#0E7A5F60; color:#0E7A5F; }
        .refresh-btn:disabled { opacity:0.6; cursor:not-allowed; }

        @media(max-width:1024px){.sv-main{margin-left:0}}
        @media(max-width:640px){.sv-inner{padding:70px 16px 20px}}
      `}</style>

      <div className="sv-wrap">
        <Sidebar/>
        <div className="sv-main">
          <Navbar/>
          <div className="sv-inner">

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:4}}>Os meus serviços</h1>
                <p style={{fontSize:13,color:"#4B5563"}}>
                  {loading ? "A carregar..." : `${services.length} pedido${services.length!==1?"s":""}`}
                </p>
              </div>
              <div style={{display:"flex",gap:8}}>

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="refresh-btn"
                >
                  <span className={refreshing ? "spinning" : "not-spinning"}>
                    <RefreshCw size={14}/>
                  </span>
                  {refreshing ? "A actualizar…" : "Actualizar"}
                </button>

                <button
                  onClick={() => router.push("/services/new")}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:12,border:"none",background:"#0E7A5F",color:"white",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
                >
                  <Plus size={16}/> Novo serviço
                </button>
              </div>
            </div>

            <div className="tabs">
              {TABS.map(t => (
                <button key={t.value} className={`tab${tab===t.value?" on":""}`} onClick={()=>setTab(t.value)}>
                  {t.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="error-box">
                <AlertCircle size={18} style={{color:"#DC2626",flexShrink:0}}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,color:"#B91C1C",marginBottom:6}}>{error}</p>
                  <button
                    onClick={() => router.push("/")}
                    style={{fontSize:12,color:"#B91C1C",background:"none",border:"1px solid #FCA5A5",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontFamily:"inherit"}}
                  >
                    Fazer login novamente
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:12}}>
                <span className="page-spinning">
                  <Loader2 size={24} style={{color:"#0E7A5F"}}/>
                </span>
                <span style={{fontSize:14,color:"#4B5563"}}>A carregar serviços...</span>
              </div>
            ) : !error && services.length === 0 ? (
              <div className="empty-state">
                <div style={{width:64,height:64,borderRadius:20,background:"#E2E8F0",border:"1px solid #CBD5E1",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Briefcase size={28} style={{color:"#94A3B8"}}/>
                </div>
                <p style={{fontSize:16,fontWeight:700,color:"#0F172A"}}>Sem pedidos ainda</p>
                <p style={{fontSize:13,color:"#4B5563",lineHeight:1.6,maxWidth:320}}>
                  Os teus pedidos vão aparecer aqui. Cria o primeiro para começar.
                </p>
                <button
                  onClick={() => router.push("/services/new")}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:12,border:"none",background:"#0E7A5F",color:"white",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
                >
                  <Plus size={16}/> Criar primeiro pedido
                </button>
              </div>
            ) : (
              <div>
                {services.map(s => {
                  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.requested;
                  const Icon = cfg.icon;
                  const step = STATUS_STEP[s.status] ?? 1;
                  return (
                    <div className="scard" key={s.id} onClick={() => router.push(`/services/${s.id}`)}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                            <h3 style={{fontSize:15,fontWeight:700,color:"#0F172A"}}>{s.title}</h3>
                            <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:cfg.bg,color:cfg.color,display:"flex",alignItems:"center",gap:4}}>
                              <Icon size={11}/> {cfg.label}
                            </span>
                          </div>
                          <p style={{fontSize:13,color:"#4B5563",marginBottom:4}}>
                            {s.provider?.fullName ?? "Sem prestador"} · {s.category}
                          </p>
                          <p style={{fontSize:12,color:"#6B7280"}}>
                            {new Date(s.createdAt).toLocaleDateString("pt-PT")}
                          </p>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <p style={{fontSize:16,fontWeight:700,color:"#0E7A5F"}}>
                            {Number(s.agreedPrice||s.budget).toLocaleString("pt-PT")} Kz
                          </p>
                          <ChevronRight size={16} style={{color:"#94A3B8",marginTop:8}}/>
                        </div>
                      </div>
                      <div className="timeline">
                        {TIMELINE_STEPS.map((st,i) => (
                          <div key={i} style={{display:"flex",alignItems:"center",flex:i<TIMELINE_STEPS.length-1?1:"none"}}>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                              <div className="tl-dot" style={{background:i<step?"#0E7A5F":"#FFFFFF",color:i<step?"white":"#94A3B8",border:i<step?"1px solid #0E7A5F":"1px solid #CBD5E1"}}>
                                {i<step?"✓":i+1}
                              </div>
                              <span className="tl-label">{st}</span>
                            </div>
                            {i<TIMELINE_STEPS.length-1&&(
                              <div className="tl-line" style={{background:i<step-1?"#0E7A5F":"#CBD5E1"}}/>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
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

const TABS = [
  { label:"Todos", value:"" },
  { label:"Pendente", value:"pending" },
  { label:"Em execução", value:"in_progress" },
  { label:"Concluído", value:"completed" },
  { label:"Cancelado", value:"cancelled" },
];

const STATUS_CONFIG: Record<string, { label:string; color:string; bg:string; icon:any }> = {
  pending:     { label:"Pendente",    color:"#6a7a8a", bg:"#1a2535",   icon:Clock },
  accepted:    { label:"Aceite",      color:"#378ADD", bg:"#378ADD20", icon:CheckCircle },
  paid:        { label:"Pago",        color:"#8B5CF6", bg:"#8B5CF620", icon:CheckCircle },
  in_progress: { label:"Em execução", color:"#EF9F27", bg:"#EF9F2720", icon:Clock },
  completed:   { label:"Concluído",   color:"#1D9E75", bg:"#1d9e7520", icon:CheckCircle },
  cancelled:   { label:"Cancelado",   color:"#E24B4A", bg:"#E24B4A20", icon:AlertCircle },
  disputed:    { label:"Disputado",   color:"#D4537E", bg:"#D4537E20", icon:AlertCircle },
};

const TIMELINE_STEPS = ["Solicitado","Aceite","Pago","Em execução","Concluído"];
const STATUS_STEP: Record<string, number> = {
  pending:1, accepted:2, paid:3, in_progress:4, completed:5,
};

type PageStatus = "initial-loading" | "refreshing" | "idle";

export default function ServicesPage() {
  const router = useRouter();
  const [tab, setTab] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [pageStatus, setPageStatus] = useState<PageStatus>("initial-loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const isRefreshRef = useRef(false);

  // Derive both flags from a single source of truth — can never be out of sync
  const loading = pageStatus !== "idle";
  const refreshing = pageStatus === "refreshing";

  useEffect(() => {
    const user = getSession();
    if (!getToken()) { router.push("/"); return; }
    if (user?.role === "provider" || user?.role === "company") {
      router.replace("/provider/services");
    }
  }, []);

  const load = useCallback(async () => {
    const token = getToken();
    const user = getSession();
    if (!token || user?.role !== "client") { setPageStatus("idle"); return; }

    // Single state update sets both loading and refreshing correctly
    setPageStatus(isRefreshRef.current ? "refreshing" : "initial-loading");
    setError("");
    try {
      const [data] = await Promise.all([
        servicesApi.getMyServices(tab || undefined),
        new Promise(res => setTimeout(res, 2000)),
      ]);
      setServices(data);
    } catch (e: any) {
      setError(
        e.message?.includes("Forbidden")
          ? "Sem permissão. Certifica-te que estás logado como cliente."
          : e.message || "Erro ao carregar serviços."
      );
    } finally {
      // Single call clears both loading and refreshing at the exact same time
      setPageStatus("idle");
      isRefreshRef.current = false;
    }
  }, [tab, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => {
    isRefreshRef.current = true;
    setPageStatus("refreshing"); // immediate feedback before load() fires
    setRefreshKey(k => k + 1);
  };

  return (
    <>
      <style>{`
        .sv-wrap{display:flex;min-height:100vh;background:#0d1117}
        .sv-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .sv-inner{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:20px}
        .tabs{display:flex;gap:4px;background:#131b27;border-radius:12px;padding:4px;border:1px solid #1a2535;width:fit-content;flex-wrap:wrap}
        .tab{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;color:#6a7a8a;transition:all 0.15s;font-family:inherit}
        .tab.on{background:#1D9E75;color:white}
        .scard{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px;cursor:pointer;transition:all 0.2s;margin-bottom:12px}
        .scard:hover{border-color:#1D9E75}
        .timeline{display:flex;align-items:center;margin-top:16px}
        .tl-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
        .tl-line{flex:1;height:2px;margin-bottom:16px}
        .tl-label{font-size:9px;color:#4a5a6a;text-align:center;margin-top:4px;max-width:60px}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;text-align:center}
        .error-box{background:#E24B4A15;border:1px solid #E24B4A30;border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px}

        @keyframes do-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning      { display:inline-flex; animation:do-spin 0.7s linear infinite; }
        .not-spinning  { display:inline-flex; }
        .page-spinning { display:inline-flex; animation:do-spin 1s linear infinite; }

        .refresh-btn {
          display:flex;align-items:center;gap:6px;padding:10px 16px;
          border-radius:12px;border:1px solid #1a2535;background:#131b27;
          color:#6a7a8a;font-size:13px;font-family:inherit;
          min-width:128px;justify-content:center;
          transition:color 0.15s, border-color 0.15s;
        }
        .refresh-btn:not(:disabled) { cursor:pointer; }
        .refresh-btn:not(:disabled):hover { border-color:#1D9E7560; color:#1D9E75; }
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
                <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Os meus serviços</h1>
                <p style={{fontSize:13,color:"#4a6a6a"}}>
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
                  style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:12,border:"none",background:"#1D9E75",color:"white",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
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
                <AlertCircle size={18} style={{color:"#E24B4A",flexShrink:0}}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,color:"#E24B4A",marginBottom:6}}>{error}</p>
                  <button
                    onClick={() => router.push("/")}
                    style={{fontSize:12,color:"#E24B4A",background:"none",border:"1px solid #E24B4A40",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontFamily:"inherit"}}
                  >
                    Fazer login novamente
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:12}}>
                <span className="page-spinning">
                  <Loader2 size={24} style={{color:"#1D9E75"}}/>
                </span>
                <span style={{fontSize:14,color:"#4a6a6a"}}>A carregar serviços...</span>
              </div>
            ) : !error && services.length === 0 ? (
              <div className="empty-state">
                <div style={{width:64,height:64,borderRadius:20,background:"#131b27",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Briefcase size={28} style={{color:"#2a3a4a"}}/>
                </div>
                <p style={{fontSize:16,fontWeight:700,color:"#c0d0e0"}}>Sem pedidos ainda</p>
                <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:320}}>
                  Os teus pedidos vão aparecer aqui. Cria o primeiro para começar.
                </p>
                <button
                  onClick={() => router.push("/services/new")}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:12,border:"none",background:"#1D9E75",color:"white",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}
                >
                  <Plus size={16}/> Criar primeiro pedido
                </button>
              </div>
            ) : (
              <div>
                {services.map(s => {
                  const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  const step = STATUS_STEP[s.status] ?? 1;
                  return (
                    <div className="scard" key={s.id} onClick={() => router.push(`/services/${s.id}`)}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                            <h3 style={{fontSize:15,fontWeight:700,color:"#e2e8f0"}}>{s.title}</h3>
                            <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:99,background:cfg.bg,color:cfg.color,display:"flex",alignItems:"center",gap:4}}>
                              <Icon size={11}/> {cfg.label}
                            </span>
                          </div>
                          <p style={{fontSize:13,color:"#4a6a6a",marginBottom:4}}>
                            {s.provider?.fullName ?? "Sem prestador"} · {s.category}
                          </p>
                          <p style={{fontSize:12,color:"#3a4a5a"}}>
                            {new Date(s.createdAt).toLocaleDateString("pt-PT")}
                          </p>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <p style={{fontSize:16,fontWeight:700,color:"#1D9E75"}}>
                            {Number(s.agreedPrice||s.budget).toLocaleString("pt-PT")} Kz
                          </p>
                          <ChevronRight size={16} style={{color:"#2a3a4a",marginTop:8}}/>
                        </div>
                      </div>
                      <div className="timeline">
                        {TIMELINE_STEPS.map((st,i) => (
                          <div key={i} style={{display:"flex",alignItems:"center",flex:i<TIMELINE_STEPS.length-1?1:"none"}}>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                              <div className="tl-dot" style={{background:i<step?"#1D9E75":"#1a2535",color:i<step?"white":"#3a4a5a"}}>
                                {i<step?"✓":i+1}
                              </div>
                              <span className="tl-label">{st}</span>
                            </div>
                            {i<TIMELINE_STEPS.length-1&&(
                              <div className="tl-line" style={{background:i<step-1?"#1D9E75":"#1a2535"}}/>
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
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase, Wallet, Star, Clock, Plus, ArrowRight,
  Shield, Zap, Users, TrendingUp, CheckCircle, AlertCircle, Loader2,
} from "lucide-react";
import { servicesApi, ProviderStats } from "@/lib/services.api";
import { chatApi } from "@/lib/chat.api";
import { getSession } from "@/lib/auth.api";

const steps = [
  { icon:<CheckCircle size={20} style={{color:"#1D9E75"}}/>, bg:"#0b2a2a", title:"Completa o KYC", desc:"Verifica a tua identidade para activar o perfil e receber pedidos.", action:"Verificar agora", href:"/kyc?role=provider" },
  { icon:<Star size={20} style={{color:"#EF9F27"}}/>, bg:"#2a1e08", title:"Cria o teu portfólio", desc:"Adiciona fotos e descrição dos serviços que ofereces.", action:"Editar perfil", href:"/provider/profile" },
  { icon:<Zap size={20} style={{color:"#378ADD"}}/>, bg:"#0a1a2e", title:"Recebe o primeiro pedido", desc:"Quando o perfil estiver activo, os clientes vão encontrar-te.", action:"Ver pedidos", href:"/provider/services" },
];

const features = [
  { icon:<Wallet size={20} style={{color:"#1D9E75"}}/>, bg:"#0b2a2a", border:"#1d9e7525", title:"Wallet integrada", desc:"Recebe pagamentos directamente na tua wallet. Levanta quando quiseres." },
  { icon:<Shield size={20} style={{color:"#378ADD"}}/>, bg:"#0a1a2e", border:"#378ADD25", title:"Pagamento garantido", desc:"O escrow protege-te — o valor é retido até confirmares a conclusão." },
  { icon:<Users size={20} style={{color:"#EF9F27"}}/>, bg:"#2a1e08", border:"#EF9F2725", title:"Gestão de equipa", desc:"Tens uma empresa? Adiciona funcionários e distribui os serviços." },
  { icon:<TrendingUp size={20} style={{color:"#D4537E"}}/>, bg:"#2a0a1e", border:"#D4537E25", title:"Sistema de ranking", desc:"Quanto mais serviços via app, maior a tua visibilidade e ranking." },
];

export default function ProviderHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  useEffect(() => { setUser(getSession()); }, []);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const [providerStats, chatUnread] = await Promise.allSettled([
          servicesApi.getProviderStats(),
          chatApi.getUnread(),
        ]);
        if (cancelled) return;
        if (providerStats.status === "fulfilled") setStats(providerStats.value);
        if (chatUnread.status === "fulfilled") setUnreadMessages(chatUnread.value.count);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const heroStats = [
    { value: loadingStats ? "…" : stats ? String(stats.totalOrders) : "0", label:"Pedidos", color:"#EF9F27" },
    { value: loadingStats ? "…" : stats ? `${stats.totalEarnings.toLocaleString("pt-PT")} Kz` : "0 Kz", label:"Ganhos", color:"#1D9E75" },
    { value: loadingStats ? "…" : stats?.averageRating != null ? stats.averageRating.toFixed(1) : "—", label:"Avaliação", color:"#378ADD" },
  ];

  const dashStats = [
    { label:"Pedidos recebidos", value: loadingStats?"…":stats?String(stats.totalOrders):"0", sub: stats&&stats.totalOrders>0?`${stats.activeOrders} activo${stats.activeOrders!==1?"s":""}`:"Nenhum ainda", color:"#EF9F27", icon:Briefcase, href:"/provider/services" },
    { label:"Ganhos totais", value: loadingStats?"…":stats?`${stats.totalEarnings.toLocaleString("pt-PT")} Kz`:"0 Kz", sub:"Serviços concluídos", color:"#1D9E75", icon:Wallet, href:"/provider/wallet" },
    { label:"Avaliação média", value: loadingStats?"…":stats?.averageRating!=null?`${stats.averageRating.toFixed(1)} ★`:"—", sub:stats?.averageRating!=null?"Baseado em reviews":"Sem avaliações", color:"#378ADD", icon:Star, href:"/provider/reviews" },
    { label:"Mensagens", value: loadingStats?"…":String(unreadMessages), sub:unreadMessages>0?`${unreadMessages} não lida${unreadMessages!==1?"s":""}`:"Sem mensagens novas", color:"#D4537E", icon:Clock, href:"/provider/chat" },
  ];

  return (
    <>
      <style>{`
        .ph-inner{padding:32px;display:flex;flex-direction:column;gap:28px}
        .ph-hero{border-radius:20px;padding:48px;background:#1a1205;border:1px solid #EF9F2730;display:flex;align-items:center;justify-content:space-between;gap:32px}
        .ph-stats{display:flex;gap:16px;flex-shrink:0}
        .ph-stat{display:flex;flex-direction:column;align-items:center;padding:20px 24px;border-radius:16px;background:#0d0c05;border:1px solid #2a1e08;min-width:100px}
        .ph-grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px}
        .ph-card{border-radius:20px;padding:28px;background:#131b27;border:1px solid #1a2535}
        .step-card{display:flex;align-items:flex-start;gap:16px;padding:16px;border-radius:14px;background:#0d1117;border:1px solid #1a2535;margin-bottom:12px}
        .step-card:last-child{margin-bottom:0}
        .feat-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .feat{padding:16px;border-radius:14px}
        .ph-btn-amber{display:flex;align-items:center;gap:8px;padding:14px 24px;border-radius:12px;border:none;background:#EF9F27;color:#0d1117;font-size:15px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit}
        .ph-btn-ghost{display:flex;align-items:center;gap:8px;padding:14px 24px;border-radius:12px;background:transparent;color:#8a9ab0;border:1px solid #1a2535;font-size:15px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .stat-card{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px;cursor:pointer;transition:border-color 0.15s}
        .stat-card:hover{border-color:#EF9F2760}
        .action-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:none;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap}
        @media(max-width:1024px){.ph-hero{flex-direction:column;padding:32px 24px}.ph-stats{justify-content:center}.ph-grid2{grid-template-columns:1fr}.stats-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.ph-inner{padding:16px;gap:20px}.ph-hero{padding:24px 16px}.ph-stats{gap:10px}.ph-stat{min-width:80px;padding:14px 16px}.feat-grid{grid-template-columns:1fr}.stats-grid{grid-template-columns:1fr 1fr}}
      `}</style>
      <div className="ph-inner">
        <div className="ph-hero">
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#EF9F27"}}/>
              <span style={{fontSize:12,fontWeight:600,color:"#EF9F27",letterSpacing:"0.1em",textTransform:"uppercase"}}>Serviapp · Painel Prestador</span>
            </div>
            <h1 style={{fontSize:36,fontWeight:700,color:"#e2e8f0",lineHeight:1.15,marginBottom:16}}>
              {user?.fullName?`Olá, ${user.fullName.split(" ")[0]}`:"O teu negócio"},<br/>
              <span style={{color:"#EF9F27"}}>digitalizado e protegido.</span>
            </h1>
            <p style={{fontSize:15,color:"#6a5a3a",lineHeight:1.75,marginBottom:28,maxWidth:480}}>
              Recebe pedidos, gere a tua equipa, acompanha os pagamentos e cresce com a plataforma mais segura de Angola.
            </p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <button className="ph-btn-amber" onClick={()=>router.push("/provider/services")}>
                <Briefcase size={16}/> Ver pedidos
              </button>
              <button className="ph-btn-ghost" onClick={()=>router.push("/provider/profile")}>
                Ver perfil <ArrowRight size={16}/>
              </button>
            </div>
          </div>
          <div className="ph-stats">
            {heroStats.map((s,i)=>(
              <div className="ph-stat" key={i}>
                {loadingStats
                  ? <Loader2 size={18} style={{color:s.color,animation:"spin 1s linear infinite"}}/>
                  : <span style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</span>
                }
                <span style={{fontSize:12,color:"#4a6a6a",marginTop:6}}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderRadius:14,background:"#2a1e08",border:"1px solid #EF9F2730"}}>
          <AlertCircle size={20} style={{color:"#EF9F27",flexShrink:0}}/>
          <div style={{flex:1}}>
            <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:3}}>Perfil inactivo — verificação pendente</p>
            <p style={{fontSize:13,color:"#6a5a3a"}}>Completa o KYC para que os clientes possam encontrar-te na plataforma.</p>
          </div>
          <button className="action-btn" style={{background:"#EF9F27",color:"#0d1117"}} onClick={()=>router.push("/kyc?role=provider")}>
            Verificar agora
          </button>
        </div>

        <div className="stats-grid">
          {dashStats.map((s,i)=>{
            const Icon=s.icon;
            return (
              <div className="stat-card" key={i} onClick={()=>router.push(s.href)}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <p style={{fontSize:13,color:"#4a6a6a"}}>{s.label}</p>
                  <div style={{width:34,height:34,borderRadius:10,background:`${s.color}20`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Icon size={16} style={{color:s.color}}/>
                  </div>
                </div>
                {loadingStats
                  ? <div style={{height:28,display:"flex",alignItems:"center"}}><Loader2 size={16} style={{color:s.color,animation:"spin 1s linear infinite"}}/></div>
                  : <p style={{fontSize:22,fontWeight:700,color:s.color,marginBottom:4}}>{s.value}</p>
                }
                <p style={{fontSize:12,color:"#3a4a5a"}}>{s.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="ph-grid2">
          <div className="ph-card">
            <h2 style={{fontSize:18,fontWeight:700,color:"#c0d0e0",marginBottom:6}}>Primeiros passos</h2>
            <p style={{fontSize:13,color:"#4a6a6a",marginBottom:20}}>Completa estes passos para activar o teu perfil</p>
            {steps.map((s,i)=>(
              <div className="step-card" key={i}>
                <div style={{width:44,height:44,borderRadius:12,flexShrink:0,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:4}}>{s.title}</p>
                  <p style={{fontSize:12,color:"#4a6a6a",lineHeight:1.5,marginBottom:8}}>{s.desc}</p>
                  <button className="action-btn" style={{background:"#EF9F2720",color:"#EF9F27",border:"1px solid #EF9F2740"}} onClick={()=>router.push(s.href)}>
                    {s.action} <ArrowRight size={12}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="ph-card">
            <h2 style={{fontSize:18,fontWeight:700,color:"#c0d0e0",marginBottom:6}}>Vantagens da plataforma</h2>
            <p style={{fontSize:13,color:"#4a6a6a",marginBottom:20}}>Tudo o que precisas para gerir o teu negócio</p>
            <div className="feat-grid">
              {features.map((f,i)=>(
                <div className="feat" key={i} style={{background:f.bg,border:`1px solid ${f.border}`}}>
                  <div style={{width:38,height:38,borderRadius:10,marginBottom:10,background:"#00000020",display:"flex",alignItems:"center",justifyContent:"center"}}>{f.icon}</div>
                  <p style={{fontSize:13,fontWeight:600,color:"#c0d0e0",marginBottom:4}}>{f.title}</p>
                  <p style={{fontSize:12,color:"#4a6a6a",lineHeight:1.6}}>{f.desc}</p>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,padding:16,borderRadius:14,background:"#0d1117",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
              <div>
                <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:4,display:"flex",alignItems:"center",gap:6}}>
                  <Users size={14} style={{color:"#378ADD"}}/> Tens uma empresa?
                </p>
                <p style={{fontSize:12,color:"#4a6a6a"}}>Activa o perfil de empresa e gere toda a equipa.</p>
              </div>
              <button className="action-btn" style={{background:"#378ADD20",color:"#378ADD",border:"1px solid #378ADD40"}} onClick={()=>router.push("/provider/company")}>
                Activar <ArrowRight size={12}/>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
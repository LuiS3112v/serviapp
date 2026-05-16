"use client";
import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp, Wallet, Star, Briefcase, Clock, ArrowRight } from "lucide-react";

const metrics = [
  { label:"Serviços concluídos", value:"0", sub:"Nenhum ainda", color:"#1D9E75", icon:Briefcase },
  { label:"Total ganho", value:"0 Kz", sub:"Este mês", color:"#EF9F27", icon:Wallet },
  { label:"Avaliação média", value:"—", sub:"Sem avaliações", color:"#378ADD", icon:Star },
  { label:"Tempo médio resposta", value:"—", sub:"Sem dados", color:"#D4537E", icon:Clock },
];

const periods = ["Esta semana","Este mês","Este ano","Total"];

export default function ProviderStatsPage() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .ps-inner{padding:28px 32px;display:flex;flex-direction:column;gap:24px}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .stat-card{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px}
        .periods{display:flex;gap:4px;background:#131b27;border-radius:12px;padding:4px;border:1px solid #1a2535;width:fit-content}
        .period{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;color:#6a7a8a;transition:all 0.15s;font-family:inherit}
        .period.on{background:#EF9F27;color:#0d1117}
        .chart-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:28px}
        .chart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:48px;text-align:center}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .info-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:24px}
        .rank-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1a2535}
        .rank-item:last-child{border-bottom:none}
        .tip-item{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #1a2535}
        .tip-item:last-child{border-bottom:none}
        @media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)}.grid2{grid-template-columns:1fr}}
        @media(max-width:640px){.ps-inner{padding:16px}.stats-grid{grid-template-columns:1fr 1fr}}
      `}</style>

      <div className="ps-inner">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Estatísticas</h1>
            <p style={{fontSize:13,color:"#4a6a6a"}}>Acompanha o desempenho do teu negócio</p>
          </div>
          <div className="periods">
            {periods.map((p,i)=>(
              <button key={p} className={`period${i===1?" on":""}`}>{p}</button>
            ))}
          </div>
        </div>

        <div className="stats-grid">
          {metrics.map((m,i)=>{
            const Icon=m.icon;
            return (
              <div className="stat-card" key={i}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                  <p style={{fontSize:13,color:"#4a6a6a"}}>{m.label}</p>
                  <div style={{width:36,height:36,borderRadius:10,background:`${m.color}20`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <Icon size={16} style={{color:m.color}}/>
                  </div>
                </div>
                <p style={{fontSize:26,fontWeight:700,color:m.color,marginBottom:4}}>{m.value}</p>
                <p style={{fontSize:12,color:"#3a4a5a"}}>{m.sub}</p>
              </div>
            );
          })}
        </div>

        <div className="chart-card">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div>
              <h2 style={{fontSize:16,fontWeight:700,color:"#c0d0e0",marginBottom:4}}>Evolução de ganhos</h2>
              <p style={{fontSize:13,color:"#4a6a6a"}}>O gráfico aparece quando tiveres serviços concluídos</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,background:"#EF9F2720",border:"1px solid #EF9F2740"}}>
              <TrendingUp size={14} style={{color:"#EF9F27"}}/>
              <span style={{fontSize:12,fontWeight:600,color:"#EF9F27"}}>0 Kz este mês</span>
            </div>
          </div>
          <div className="chart-empty">
            <div style={{width:64,height:64,borderRadius:20,background:"#0d1117",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <BarChart3 size={28} style={{color:"#2a3a4a"}}/>
            </div>
            <p style={{fontSize:15,fontWeight:600,color:"#c0d0e0"}}>Sem dados ainda</p>
            <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:320}}>
              Completa o primeiro serviço para começar a ver a evolução dos teus ganhos.
            </p>
            <button onClick={()=>router.push("/provider/services/new")} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:12,border:"none",background:"#EF9F27",color:"#0d1117",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Criar primeiro serviço <ArrowRight size={15}/>
            </button>
          </div>
        </div>

        <div className="grid2">
          <div className="info-card">
            <h2 style={{fontSize:16,fontWeight:700,color:"#c0d0e0",marginBottom:4}}>Factores de ranking</h2>
            <p style={{fontSize:13,color:"#4a6a6a",marginBottom:16}}>O que influencia a tua posição na plataforma</p>
            {[
              {label:"Avaliação média",desc:"Peso: 40%",color:"#1D9E75"},
              {label:"Volume de serviços via app",desc:"Peso: 30%",color:"#EF9F27"},
              {label:"Velocidade de resposta",desc:"Peso: 20%",color:"#378ADD"},
              {label:"Perfil completo e verificado",desc:"Peso: 10%",color:"#D4537E"},
            ].map((r,i)=>(
              <div className="rank-item" key={i}>
                <div style={{width:10,height:10,borderRadius:"50%",background:r.color,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:13,fontWeight:600,color:"#c0d0e0"}}>{r.label}</p>
                  <p style={{fontSize:11,color:"#4a5a6a",marginTop:2}}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="info-card">
            <h2 style={{fontSize:16,fontWeight:700,color:"#c0d0e0",marginBottom:4}}>Dicas para crescer</h2>
            <p style={{fontSize:13,color:"#4a6a6a",marginBottom:16}}>Como aumentar a tua visibilidade</p>
            {[
              {icon:"✅",title:"Completa o KYC",desc:"Perfis verificados aparecem primeiro nos resultados."},
              {icon:"📸",title:"Adiciona fotos ao portfólio",desc:"Prestadores com portfólio têm mais contactos."},
              {icon:"⚡",title:"Responde rápido",desc:"Responde em menos de 30 min para subir no ranking."},
              {icon:"💳",title:"Usa pagamentos via app",desc:"Serviços pagos pela plataforma aumentam o score."},
            ].map((t,i)=>(
              <div className="tip-item" key={i}>
                <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
                <div>
                  <p style={{fontSize:13,fontWeight:600,color:"#c0d0e0",marginBottom:3}}>{t.title}</p>
                  <p style={{fontSize:12,color:"#4a5a6a",lineHeight:1.5}}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
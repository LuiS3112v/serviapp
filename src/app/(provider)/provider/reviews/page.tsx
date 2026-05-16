"use client";
import { useRouter } from "next/navigation";
import { Star, ArrowRight, TrendingUp, Shield } from "lucide-react";

export default function ProviderReviewsPage() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .rv-inner{padding:28px 32px;display:flex;flex-direction:column;gap:24px;max-width:900px}
        .rv-grid{display:grid;grid-template-columns:300px 1fr;gap:20px}
        .rv-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:24px}
        .bar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
        .bar-track{flex:1;height:6px;border-radius:99px;background:#1a2535;overflow:hidden}
        .bar-fill{height:100%;border-radius:99px;background:#EF9F27}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:16px;text-align:center}
        .tip-row{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid #1a2535}
        .tip-row:last-child{border-bottom:none}
        @media(max-width:1024px){.rv-grid{grid-template-columns:1fr}}
        @media(max-width:640px){.rv-inner{padding:16px}}
      `}</style>

      <div className="rv-inner">
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>As minhas avaliações</h1>
          <p style={{fontSize:13,color:"#4a6a6a"}}>A reputação que os clientes constroem sobre o teu serviço</p>
        </div>

        <div className="rv-grid">
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="rv-card" style={{textAlign:"center"}}>
              <p style={{fontSize:13,color:"#4a6a6a",marginBottom:12}}>Avaliação média</p>
              <p style={{fontSize:52,fontWeight:700,color:"#EF9F27",lineHeight:1}}>—</p>
              <div style={{display:"flex",justifyContent:"center",gap:4,margin:"12px 0"}}>
                {[1,2,3,4,5].map(i=>(
                  <Star key={i} size={18} style={{color:"#2a3a4a"}}/>
                ))}
              </div>
              <p style={{fontSize:13,color:"#4a5a6a"}}>0 avaliações</p>
            </div>
            <div className="rv-card">
              <p style={{fontSize:13,fontWeight:600,color:"#c0d0e0",marginBottom:16}}>Distribuição</p>
              {[5,4,3,2,1].map(n=>(
                <div className="bar-row" key={n}>
                  <span style={{fontSize:12,color:"#6a7a8a",width:8,textAlign:"right"}}>{n}</span>
                  <Star size={12} style={{color:"#EF9F27",flexShrink:0}}/>
                  <div className="bar-track"><div className="bar-fill" style={{width:"0%"}}/></div>
                  <span style={{fontSize:12,color:"#4a5a6a",width:20,textAlign:"right"}}>0</span>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",borderRadius:14,background:"#0b2424",border:"1px solid #1d9e7525"}}>
              <Shield size={16} style={{color:"#1D9E75",flexShrink:0,marginTop:2}}/>
              <p style={{fontSize:12,color:"#4a7a7a",lineHeight:1.6}}>
                Só clientes que completaram um serviço contigo podem deixar avaliação.
              </p>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div className="rv-card">
              <div className="empty-state">
                <div style={{width:64,height:64,borderRadius:20,background:"#0d1117",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Star size={28} style={{color:"#2a3a4a"}}/>
                </div>
                <p style={{fontSize:16,fontWeight:700,color:"#c0d0e0"}}>Sem avaliações ainda</p>
                <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:300}}>
                  As avaliações dos clientes aparecem aqui após completares os primeiros serviços.
                </p>
                <button onClick={()=>router.push("/provider/services/new")} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:12,border:"none",background:"#EF9F27",color:"#0d1117",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  Criar primeiro serviço <ArrowRight size={15}/>
                </button>
              </div>
            </div>
            <div className="rv-card">
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                <TrendingUp size={16} style={{color:"#EF9F27"}}/>
                <h2 style={{fontSize:15,fontWeight:700,color:"#c0d0e0"}}>Como melhorar a avaliação</h2>
              </div>
              {[
                {icon:"⚡",title:"Responde rapidamente",desc:"Clientes valorizam prestadores que respondem em menos de 30 minutos."},
                {icon:"🎯",title:"Cumpre o que prometes",desc:"Chega na hora combinada e faz exactamente o que foi acordado."},
                {icon:"💬",title:"Comunica pelo chat",desc:"Usa sempre o chat da app para negociar — transmite mais confiança."},
                {icon:"✅",title:"Pede feedback",desc:"Após o serviço, pede ao cliente que deixe uma avaliação honesta."},
              ].map((t,i)=>(
                <div className="tip-row" key={i}>
                  <span style={{fontSize:20,flexShrink:0}}>{t.icon}</span>
                  <div>
                    <p style={{fontSize:13,fontWeight:600,color:"#c0d0e0",marginBottom:3}}>{t.title}</p>
                    <p style={{fontSize:12,color:"#4a6a6a",lineHeight:1.5}}>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
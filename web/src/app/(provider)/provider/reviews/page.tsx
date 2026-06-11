"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, ArrowRight, TrendingUp, Shield, Loader2, AlertCircle } from "lucide-react";
import { servicesApi, ProviderReviewsData } from "@/lib/services.api";
import { getToken } from "@/lib/auth.api";

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div style={{ display:"flex", gap:3 }}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={16}
          fill={i < Math.round(rating) ? "#EF9F27" : "none"}
          color={i < Math.round(rating) ? "#EF9F27" : "#2a3a4a"}
        />
      ))}
    </div>
  );
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  if (days < 365) return `há ${Math.floor(days / 30)} meses`;
  return `há ${Math.floor(days / 365)} anos`;
}

export default function ProviderReviewsPage() {
  const router = useRouter();
  const [data, setData] = useState<ProviderReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    servicesApi.getProviderReviews()
      .then(setData)
      .catch(e => setError(e.message || "Erro ao carregar avaliações."))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const reviews = data?.reviews ?? [];
  const maxDist = stats
    ? Math.max(...Object.values(stats.distribution), 1)
    : 1;

  return (
    <>
      <style>{`
        .rv-inner{padding:28px 32px;display:flex;flex-direction:column;gap:24px;max-width:900px}
        .rv-grid{display:grid;grid-template-columns:300px 1fr;gap:20px}
        .rv-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:24px}
        .bar-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
        .bar-track{flex:1;height:6px;border-radius:99px;background:#1a2535;overflow:hidden}
        .bar-fill{height:100%;border-radius:99px;background:#EF9F27;transition:width 0.6s ease}
        .review-card{background:#0d1117;border:1px solid #1a2535;border-radius:14px;padding:18px;margin-bottom:12px;transition:border-color 0.15s}
        .review-card:hover{border-color:#EF9F2740}
        .review-card:last-child{margin-bottom:0}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:16px;text-align:center}
        .tip-row{display:flex;align-items:flex-start;gap:12px;padding:14px 0;border-bottom:1px solid #1a2535}
        .tip-row:last-child{border-bottom:none}
        .skeleton{background:#1a2535;border-radius:8px;animation:sk 1.5s infinite}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}
        @media(max-width:1024px){.rv-grid{grid-template-columns:1fr}}
        @media(max-width:640px){.rv-inner{padding:16px}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div className="rv-inner">
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>As minhas avaliações</h1>
          <p style={{ fontSize:13, color:"#4a6a6a" }}>A reputação que os clientes constroem sobre o teu serviço</p>
        </div>

        {error && (
          <div style={{ background:"#E24B4A15", border:"1px solid #E24B4A30", borderRadius:12, padding:16, display:"flex", gap:12 }}>
            <AlertCircle size={18} style={{ color:"#E24B4A", flexShrink:0 }}/>
            <p style={{ fontSize:13, color:"#E24B4A" }}>{error}</p>
          </div>
        )}

        <div className="rv-grid">

          {/* LEFT COLUMN — Stats */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div className="rv-card" style={{ textAlign:"center" }}>
              <p style={{ fontSize:13, color:"#4a6a6a", marginBottom:12 }}>Avaliação média</p>
              {loading ? (
                <div className="skeleton" style={{ width:80, height:52, margin:"0 auto 12px" }}/>
              ) : (
                <p style={{ fontSize:52, fontWeight:700, color:"#EF9F27", lineHeight:1, marginBottom:12 }}>
                  {stats?.average != null ? stats.average : "—"}
                </p>
              )}
              <div style={{ display:"flex", justifyContent:"center", gap:4, marginBottom:10 }}>
                {loading
                  ? Array.from({ length:5 }, (_,i) => <div key={i} className="skeleton" style={{ width:18, height:18, borderRadius:4 }}/>)
                  : <StarRow rating={stats?.average ?? 0}/>
                }
              </div>
              <p style={{ fontSize:13, color:"#4a5a6a" }}>
                {loading ? <span className="skeleton" style={{ display:"inline-block", width:80, height:12 }}/> : `${stats?.total ?? 0} avaliações`}
              </p>
            </div>

            <div className="rv-card">
              <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0", marginBottom:16 }}>Distribuição</p>
              {loading
                ? [5,4,3,2,1].map(n => (
                    <div className="bar-row" key={n}>
                      <span style={{ fontSize:12, color:"#6a7a8a", width:8 }}>{n}</span>
                      <Star size={12} style={{ color:"#EF9F27", flexShrink:0 }}/>
                      <div className="bar-track"><div className="skeleton" style={{ width:"100%", height:"100%" }}/></div>
                    </div>
                  ))
                : [5,4,3,2,1].map(n => {
                    const count = stats?.distribution[String(n)] ?? 0;
                    const pct = maxDist > 0 ? (count / maxDist) * 100 : 0;
                    return (
                      <div className="bar-row" key={n}>
                        <span style={{ fontSize:12, color:"#6a7a8a", width:8, textAlign:"right" }}>{n}</span>
                        <Star size={12} style={{ color:"#EF9F27", flexShrink:0 }}/>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width:`${pct}%` }}/>
                        </div>
                        <span style={{ fontSize:12, color:"#4a5a6a", width:20, textAlign:"right" }}>{count}</span>
                      </div>
                    );
                  })
              }
            </div>

            <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px", borderRadius:14, background:"#0b2424", border:"1px solid #1d9e7525" }}>
              <Shield size={16} style={{ color:"#1D9E75", flexShrink:0, marginTop:2 }}/>
              <p style={{ fontSize:12, color:"#4a7a7a", lineHeight:1.6 }}>
                Só clientes que completaram um serviço contigo podem deixar avaliação.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN — Reviews + Tips */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Reviews list */}
            <div className="rv-card">
              {loading ? (
                [1,2].map(i => (
                  <div key={i} style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <div className="skeleton" style={{ width:120, height:13 }}/>
                      <div className="skeleton" style={{ width:70, height:11 }}/>
                    </div>
                    <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                      {[1,2,3,4,5].map(s => <div key={s} className="skeleton" style={{ width:16, height:16, borderRadius:3 }}/>)}
                    </div>
                    <div className="skeleton" style={{ width:"90%", height:11 }}/>
                  </div>
                ))
              ) : reviews.length === 0 ? (
                <div className="empty-state">
                  <div style={{ width:64, height:64, borderRadius:20, background:"#0d1117", border:"1px solid #1a2535", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Star size={28} style={{ color:"#2a3a4a" }}/>
                  </div>
                  <p style={{ fontSize:16, fontWeight:700, color:"#c0d0e0" }}>Sem avaliações ainda</p>
                  <p style={{ fontSize:13, color:"#4a6a6a", lineHeight:1.6, maxWidth:300 }}>
                    As avaliações dos clientes aparecem aqui após completares os primeiros serviços.
                  </p>
                  <button
                    onClick={() => router.push("/provider/services")}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 20px", borderRadius:12, border:"none", background:"#EF9F27", color:"#0d1117", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
                  >
                    Ver pedidos disponíveis <ArrowRight size={15}/>
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0", marginBottom:16 }}>
                    {reviews.length} avaliação{reviews.length !== 1 ? "ões" : ""}
                  </p>
                  {reviews.map(r => (
                    <div className="review-card" key={r.id}>
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:10 }}>
                        <div>
                          <p style={{ fontSize:14, fontWeight:600, color:"#e2e8f0", marginBottom:4 }}>{r.clientName}</p>
                          <p style={{ fontSize:12, color:"#4a6a6a" }}>{r.title}</p>
                        </div>
                        <span style={{ fontSize:11, color:"#3a4a5a", flexShrink:0 }}>{timeAgo(r.completedAt)}</span>
                      </div>
                      <div style={{ marginBottom: r.review ? 10 : 0 }}>
                        <StarRow rating={r.rating}/>
                      </div>
                      {r.review && (
                        <p style={{ fontSize:13, color:"#6a7a8a", lineHeight:1.6, fontStyle:"italic" }}>
                          "{r.review}"
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Tips */}
            <div className="rv-card">
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <TrendingUp size={16} style={{ color:"#EF9F27" }}/>
                <h2 style={{ fontSize:15, fontWeight:700, color:"#c0d0e0" }}>Como melhorar a avaliação</h2>
              </div>
              {[
                { icon:"⚡", title:"Responde rapidamente", desc:"Clientes valorizam prestadores que respondem em menos de 30 minutos." },
                { icon:"🎯", title:"Cumpre o que prometes", desc:"Chega na hora combinada e faz exactamente o que foi acordado." },
                { icon:"💬", title:"Comunica pelo chat", desc:"Usa sempre o chat da app para negociar — transmite mais confiança." },
                { icon:"✅", title:"Pede feedback", desc:"Após o serviço, pede ao cliente que deixe uma avaliação honesta." },
              ].map((t, i) => (
                <div className="tip-row" key={i}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{t.icon}</span>
                  <div>
                    <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0", marginBottom:3 }}>{t.title}</p>
                    <p style={{ fontSize:12, color:"#4a6a6a", lineHeight:1.5 }}>{t.desc}</p>
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
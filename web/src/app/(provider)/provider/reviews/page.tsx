"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Star, ArrowRight, TrendingUp, Shield, Loader2, AlertCircle,
  Zap, Target, MessageSquare, ThumbsUp,
} from "lucide-react";
import { servicesApi, ProviderReviewsData } from "@/lib/services.api";
import { getToken } from "@/lib/auth.api";

const fmtRating = (n: number) => n.toFixed(1);

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={16}
          fill={i < Math.round(rating) ? "#EF9F27" : "none"}
          color={i < Math.round(rating) ? "#EF9F27" : "#CBD5E1"}
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

  const tips = [
    {
      icon: Zap,
      title: "Responde rapidamente",
      desc: "Clientes valorizam prestadores que respondem em menos de 30 minutos.",
      color: "#92400E",
    },
    {
      icon: Target,
      title: "Cumpre o que prometes",
      desc: "Chega na hora combinada e faz exactamente o que foi acordado.",
      color: "#0F766E",
    },
    {
      icon: MessageSquare,
      title: "Comunica pelo chat",
      desc: "Usa sempre o chat da app para negociar — transmite mais confiança.",
      color: "#1D4ED8",
    },
    {
      icon: ThumbsUp,
      title: "Pede feedback",
      desc: "Após o serviço, pede ao cliente que deixe uma avaliação honesta.",
      color: "#6B7280",
    },
  ];

  return (
    <>
      <style>{`
        .rv-inner { padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; max-width: 900px; }
        .rv-grid { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
        .rv-card {
          background: #FFFFFF; border: 1px solid #E2E8F0;
          border-radius: 20px; padding: 24px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.05);
        }
        .rv-avg-num { font-size: 52px; font-weight: 700; color: #0F172A; line-height: 1; margin-bottom: 12px; }
        .rv-avg-skel { width: 80px; height: 52px; margin: 0 auto 12px; }
        .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .bar-track { flex: 1; height: 6px; border-radius: 99px; background: #F1F5F9; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 99px; background: #EF9F27; transition: width 0.6s ease; }
        .review-card {
          background: #F8FAFC; border: 1px solid #E2E8F0;
          border-radius: 14px; padding: 18px; margin-bottom: 12px;
          transition: border-color 0.15s;
        }
        .review-card:hover { border-color: rgba(239,159,39,0.4); }
        .review-card:last-child { margin-bottom: 0; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 16px; text-align: center; }
        .tip-row { display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-bottom: 1px solid #F1F5F9; }
        .tip-row:last-child { border-bottom: none; }
        .skeleton { background: #E2E8F0; border-radius: 8px; animation: sk 1.5s infinite; }
        @keyframes sk { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 1024px) { .rv-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .rv-inner { padding: 16px; } .rv-avg-num { font-size: 42px; } }
        @media (max-width: 400px) { .rv-avg-num { font-size: 36px; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="rv-inner">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>As minhas avaliações</h1>
          <p style={{ fontSize: 13, color: "#64748B" }}>A reputação que os clientes constroem sobre o teu serviço</p>
        </div>

        {error && (
          <div style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12, padding: 16, display: "flex", gap: 12 }}>
            <AlertCircle size={18} style={{ color: "#E11D48", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#9F1239" }}>{error}</p>
          </div>
        )}

        <div className="rv-grid">

          {/* LEFT COLUMN — Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Average score */}
            <div className="rv-card" style={{ textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>Avaliação média</p>
              {loading ? (
                <div className="skeleton rv-avg-skel" />
              ) : (
                <p className="rv-avg-num">
                  {stats?.average != null ? fmtRating(stats.average) : "—"}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 10 }}>
                {loading
                  ? Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="skeleton" style={{ width: 18, height: 18, borderRadius: 4 }} />
                    ))
                  : <StarRow rating={stats?.average ?? 0} />
                }
              </div>
              <p style={{ fontSize: 13, color: "#64748B" }}>
                {loading
                  ? <span className="skeleton" style={{ display: "inline-block", width: 80, height: 12 }} />
                  : `${stats?.total ?? 0} avaliações`}
              </p>
            </div>

            {/* Distribution */}
            <div className="rv-card">
              <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>Distribuição</p>
              {loading
                ? [5, 4, 3, 2, 1].map(n => (
                    <div className="bar-row" key={n}>
                      <span style={{ fontSize: 12, color: "#94A3B8", width: 8 }}>{n}</span>
                      <Star size={12} style={{ color: "#EF9F27", flexShrink: 0 }} />
                      <div className="bar-track">
                        <div className="skeleton" style={{ width: "100%", height: "100%" }} />
                      </div>
                    </div>
                  ))
                : [5, 4, 3, 2, 1].map(n => {
                    const count = stats?.distribution[String(n)] ?? 0;
                    const pct = maxDist > 0 ? (count / maxDist) * 100 : 0;
                    return (
                      <div className="bar-row" key={n}>
                        <span style={{ fontSize: 12, color: "#94A3B8", width: 8, textAlign: "right" }}>{n}</span>
                        <Star size={12} style={{ color: "#EF9F27", flexShrink: 0 }} />
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 12, color: "#64748B", width: 20, textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })
              }
            </div>

            {/* Trust note */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 14, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <Shield size={16} style={{ color: "#15803D", flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
                Só clientes que completaram um serviço contigo podem deixar avaliação.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN — Reviews + Tips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Reviews list */}
            <div className="rv-card">
              {loading ? (
                [1, 2].map(i => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div className="skeleton" style={{ width: 120, height: 13 }} />
                      <div className="skeleton" style={{ width: 70, height: 11 }} />
                    </div>
                    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className="skeleton" style={{ width: 16, height: 16, borderRadius: 3 }} />
                      ))}
                    </div>
                    <div className="skeleton" style={{ width: "90%", height: 11 }} />
                  </div>
                ))
              ) : reviews.length === 0 ? (
                <div className="empty-state">
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: "#F1F5F9", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Star size={28} style={{ color: "#CBD5E1" }} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Sem avaliações ainda</p>
                  <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, maxWidth: 300 }}>
                    As avaliações dos clientes aparecem aqui após completares os primeiros serviços.
                  </p>
                  <button
                    onClick={() => router.push("/provider/services")}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "12px 20px", borderRadius: 12, border: "none",
                      background: "#EF9F27", color: "#fff",
                      fontSize: 14, fontWeight: 600, cursor: "pointer",
                      fontFamily: "inherit", boxShadow: "0 4px 14px rgba(239,159,39,0.28)",
                    }}
                  >
                    Ver pedidos disponíveis <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>
                    {reviews.length} avaliação{reviews.length !== 1 ? "ões" : ""}
                  </p>
                  {reviews.map(r => (
                    <div className="review-card" key={r.id}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{r.clientName}</p>
                          <p style={{ fontSize: 12, color: "#64748B" }}>{r.title}</p>
                        </div>
                        <span style={{ fontSize: 11, color: "#94A3B8", flexShrink: 0 }}>{timeAgo(r.completedAt)}</span>
                      </div>
                      <div style={{ marginBottom: r.review ? 10 : 0 }}>
                        <StarRow rating={r.rating} />
                      </div>
                      {r.review && (
                        <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, fontStyle: "italic" }}>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <TrendingUp size={16} style={{ color: "#64748B" }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Como melhorar a avaliação</h2>
              </div>
              {tips.map((t, i) => {
                const Icon = t.icon;
                return (
                  <div className="tip-row" key={i}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: "#F8FAFC", border: "1px solid #E2E8F0",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Icon size={15} style={{ color: t.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3 }}>{t.title}</p>
                      <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{t.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
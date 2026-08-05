"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, TrendingUp, Wallet, Star,
  Briefcase, Clock, ArrowRight, Loader2, AlertCircle,
  ShieldCheck, Camera, Zap, CreditCard, CheckCircle2,
} from "lucide-react";
import { servicesApi, ProviderStatsByPeriod } from "@/lib/services.api";

const periods = ["Esta semana", "Este mês", "Este ano", "Total"];

const fmtRating = (n: number) => n.toFixed(1);

function BarChart({
  data, color, unit,
}: {
  data: { label: string; value: number }[];
  color: string;
  unit?: string;
}) {
  if (!data.length) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 20px", color: "#94A3B8" }}>
      <BarChart3 size={28} />
      <p style={{ fontSize: 13 }}>Sem dados para este período</p>
    </div>
  );

  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, width: "100%", overflowX: "auto", paddingBottom: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "1 0 auto", minWidth: 28 }}>
          <span style={{ fontSize: 9, color: "#94A3B8", whiteSpace: "nowrap" }}>
            {d.value > 0 ? (unit === "Kz" ? `${(d.value / 1000).toFixed(0)}k` : d.value) : ""}
          </span>
          <div style={{
            width: "100%",
            height: `${Math.max((d.value / max) * 90, d.value > 0 ? 6 : 2)}px`,
            background: d.value > 0 ? color : "#E2E8F0",
            borderRadius: "4px 4px 0 0",
            transition: "height 0.3s ease",
            minHeight: 2,
          }} />
          <span style={{ fontSize: 9, color: "#94A3B8", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProviderStatsPage() {
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState("Este mês");
  const [stats, setStats] = useState<ProviderStatsByPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await servicesApi.getProviderStatsByPeriod(activePeriod);
      setStats(data);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar estatísticas.");
    } finally {
      setLoading(false);
    }
  }, [activePeriod]);

  useEffect(() => { load(); }, [load]);

  const fmtResponseTime = (hours: number | null) => {
    if (hours === null) return "—";
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours.toFixed(1)} h`;
  };

  const metrics = stats ? [
    {
      label: "Serviços concluídos",
      value: String(stats.totalCompleted),
      sub: stats.totalCompleted > 0 ? `No período: ${activePeriod.toLowerCase()}` : "Nenhum ainda",
      iconColor: "#0F766E",
      iconBg: "#F0FDFA",
      iconBorder: "#CCFBF1",
      icon: Briefcase,
    },
    {
      label: "Total ganho",
      value: `${stats.totalEarnings.toLocaleString("pt-PT")} Kz`,
      sub: activePeriod,
      iconColor: "#92400E",
      iconBg: "#FFFBEB",
      iconBorder: "#FDE68A",
      icon: Wallet,
    },
    {
      label: "Avaliação média",
      value: stats.averageRating != null ? `${fmtRating(stats.averageRating)} ★` : "—",
      sub: stats.averageRating != null ? "Média histórica" : "Sem avaliações",
      iconColor: "#1D4ED8",
      iconBg: "#EFF6FF",
      iconBorder: "#BFDBFE",
      icon: Star,
    },
    {
      label: "Tempo médio resposta",
      value: fmtResponseTime(stats.avgResponseTimeHours),
      sub: stats.avgResponseTimeHours != null ? "Desde pedido até aceite" : "Sem dados",
      iconColor: "#9F1239",
      iconBg: "#FFF1F2",
      iconBorder: "#FECDD3",
      icon: Clock,
    },
  ] : [
    { label: "Serviços concluídos",  value: "…", sub: "A carregar", iconColor: "#0F766E", iconBg: "#F0FDFA", iconBorder: "#CCFBF1", icon: Briefcase },
    { label: "Total ganho",          value: "…", sub: "A carregar", iconColor: "#92400E", iconBg: "#FFFBEB", iconBorder: "#FDE68A", icon: Wallet },
    { label: "Avaliação média",      value: "…", sub: "A carregar", iconColor: "#1D4ED8", iconBg: "#EFF6FF", iconBorder: "#BFDBFE", icon: Star },
    { label: "Tempo médio resposta", value: "…", sub: "A carregar", iconColor: "#9F1239", iconBg: "#FFF1F2", iconBorder: "#FECDD3", icon: Clock },
  ];

  const rankingFactors = [
    { label: "Avaliação média",              desc: "Peso: 40%", dot: "#0F766E", value: stats?.averageRating != null ? `${fmtRating(stats.averageRating)}/5` : "—" },
    { label: "Volume de serviços via app",   desc: "Peso: 30%", dot: "#92400E", value: stats ? String(stats.totalCompleted) : "—" },
    { label: "Velocidade de resposta",       desc: "Peso: 20%", dot: "#1D4ED8", value: fmtResponseTime(stats?.avgResponseTimeHours ?? null) },
    { label: "Perfil completo e verificado", desc: "Peso: 10%", dot: "#6B7280", value: "KYC" },
  ];

  const tips = [
    { icon: ShieldCheck, title: "Completa o KYC",             desc: "Perfis verificados aparecem primeiro nos resultados.", color: "#0F766E" },
    { icon: Camera,      title: "Adiciona fotos ao portfólio", desc: "Prestadores com portfólio têm mais contactos.",       color: "#1D4ED8" },
    { icon: Zap,         title: "Responde rápido",             desc: "Responde em menos de 30 min para subir no ranking.",  color: "#92400E" },
    { icon: CreditCard,  title: "Usa pagamentos via app",      desc: "Serviços pagos pela plataforma aumentam o score.",    color: "#6B7280" },
  ];

  return (
    <>
      <style>{`
        .ps-inner { padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .stat-card {
          background: #FFFFFF; border: 1px solid #E2E8F0;
          border-radius: 16px; padding: 20px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.05);
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .stat-card:hover { box-shadow: 0 4px 12px rgba(15,23,42,0.08); transform: translateY(-1px); }
        .stat-value {
          font-size: 26px; font-weight: 700;
          color: #0F172A;
          margin-bottom: 4px; line-height: 1.15; word-break: break-word;
        }

        .periods {
          display: flex; gap: 4px;
          background: #F1F5F9; border-radius: 12px; padding: 4px;
          border: 1px solid #E2E8F0; flex-wrap: wrap;
        }
        .period-btn {
          padding: 8px 16px; border-radius: 9px;
          font-size: 13px; font-weight: 500; cursor: pointer;
          border: none; background: none; color: #64748B;
          transition: all 0.15s; font-family: inherit;
        }
        .period-btn.on {
          background: #FFFFFF; color: #0F172A; font-weight: 600;
          box-shadow: 0 1px 4px rgba(15,23,42,0.10);
        }

        .chart-card {
          background: #FFFFFF; border: 1px solid #E2E8F0;
          border-radius: 20px; padding: 28px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.05);
        }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-card {
          background: #FFFFFF; border: 1px solid #E2E8F0;
          border-radius: 20px; padding: 24px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.05);
        }
        .rank-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 0; border-bottom: 1px solid #F1F5F9;
        }
        .rank-item:last-child { border-bottom: none; }
        .tip-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px 0; border-bottom: 1px solid #F1F5F9;
        }
        .tip-item:last-child { border-bottom: none; }
        .ranking-bar { height: 8px; border-radius: 99px; background: #E2E8F0; overflow: hidden; margin-top: 8px; }
        .ranking-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #EF9F27, #0F766E); transition: width 0.6s ease; }

        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .grid2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .ps-inner { padding: 16px; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .periods { width: 100%; }
          .period-btn { flex: 1; text-align: center; }
          .stat-value { font-size: 22px; }
        }
        @media (max-width: 400px) { .stat-value { font-size: 19px; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="ps-inner">

        {/* ── Header + Períodos ───────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Estatísticas</h1>
            <p style={{ fontSize: 13, color: "#64748B" }}>Acompanha o desempenho do teu negócio</p>
          </div>
          <div className="periods">
            {periods.map(p => (
              <button key={p} className={`period-btn${activePeriod === p ? " on" : ""}`} onClick={() => setActivePeriod(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── Erro ────────────────────────────────────────────────────── */}
        {error && (
          <div style={{ background: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: 12, padding: 16, display: "flex", gap: 12 }}>
            <AlertCircle size={18} style={{ color: "#E11D48", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#9F1239" }}>{error}</p>
          </div>
        )}

        {/* ── 4 Métricas ──────────────────────────────────────────────── */}
        <div className="stats-grid">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div className="stat-card" key={i}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <p style={{ fontSize: 13, color: "#64748B" }}>{m.label}</p>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: m.iconBg, border: `1px solid ${m.iconBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={16} style={{ color: m.iconColor }} />
                  </div>
                </div>
                {loading
                  ? <Loader2 size={18} style={{ color: "#94A3B8", animation: "spin 1s linear infinite" }} />
                  : <p className="stat-value">{m.value}</p>
                }
                <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{m.sub}</p>
              </div>
            );
          })}
        </div>

        {/* ── Gráfico de ganhos ───────────────────────────────────────── */}
        <div className="chart-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Evolução de ganhos</h2>
              <p style={{ fontSize: 13, color: "#64748B" }}>
                Período: <span style={{ color: "#0F172A", fontWeight: 600 }}>{activePeriod}</span>
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <TrendingUp size={14} style={{ color: "#64748B" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>
                {loading ? "…" : `${stats?.totalEarnings.toLocaleString("pt-PT") ?? 0} Kz — ${activePeriod}`}
              </span>
            </div>
          </div>
          {loading
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 12 }}>
                <Loader2 size={20} style={{ color: "#94A3B8", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 13, color: "#64748B" }}>A carregar...</span>
              </div>
            : <BarChart data={stats?.earningsByPeriod ?? []} color="#EF9F27" unit="Kz" />
          }
        </div>

        {/* ── Gráfico de serviços concluídos ─────────────────────────── */}
        <div className="chart-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Serviços concluídos</h2>
              <p style={{ fontSize: 13, color: "#64748B" }}>
                Período: <span style={{ color: "#0F172A", fontWeight: 600 }}>{activePeriod}</span>
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <Briefcase size={14} style={{ color: "#64748B" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>
                {loading ? "…" : `${stats?.totalCompleted ?? 0} concluídos`}
              </span>
            </div>
          </div>
          {loading
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 12 }}>
                <Loader2 size={20} style={{ color: "#94A3B8", animation: "spin 1s linear infinite" }} />
              </div>
            : <BarChart data={stats?.completedByPeriod ?? []} color="#475569" />
          }
        </div>

        {/* ── Ranking score ───────────────────────────────────────────── */}
        {stats && (
          <div className="chart-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Ranking score</h2>
                <p style={{ fontSize: 13, color: "#64748B" }}>Baseado no teu desempenho real</p>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, padding: "8px 16px", borderRadius: 10, background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#0F172A" }}>{stats.rankingScore}</span>
                <span style={{ fontSize: 12, color: "#94A3B8" }}>/100</span>
              </div>
            </div>
            <div className="ranking-bar">
              <div className="ranking-fill" style={{ width: `${stats.rankingScore}%` }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
              <CheckCircle2
                size={15}
                style={{
                  color: stats.rankingScore >= 70 ? "#0F766E"
                       : stats.rankingScore >= 40 ? "#92400E"
                       : "#9F1239",
                  flexShrink: 0,
                }}
              />
              <p style={{ fontSize: 12, color: "#475569" }}>
                {stats.rankingScore >= 70
                  ? "Excelente — estás no top de prestadores"
                  : stats.rankingScore >= 40
                  ? "Bom — continua a melhorar para subir"
                  : "Começa a completar serviços para subir no ranking"}
              </p>
            </div>
          </div>
        )}

        {/* ── Grid: ranking factors + dicas ──────────────────────────── */}
        <div className="grid2">

          {/* Factores de ranking */}
          <div className="info-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Factores de ranking</h2>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>O que influencia a tua posição</p>
            {rankingFactors.map((r, i) => (
              <div className="rank-item" key={i}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.dot, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{r.label}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{r.desc}</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Dicas */}
          <div className="info-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Dicas para crescer</h2>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>Como aumentar a tua visibilidade</p>
            {tips.map((t, i) => {
              const Icon = t.icon;
              return (
                <div className="tip-item" key={i}>
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
            <button
              onClick={() => router.push("/provider/services")}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "12px 20px", borderRadius: 12, border: "none",
                background: "#EF9F27", color: "#fff",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", marginTop: 16, width: "100%",
                transition: "background 0.15s",
                boxShadow: "0 2px 8px rgba(239,159,39,0.25)",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#d97b10")}
              onMouseOut={e => (e.currentTarget.style.background = "#EF9F27")}
            >
              Ver pedidos disponíveis <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
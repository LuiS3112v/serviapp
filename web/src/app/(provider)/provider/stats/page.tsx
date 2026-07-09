"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, TrendingUp, Wallet, Star,
  Briefcase, Clock, ArrowRight, Loader2, AlertCircle,
} from "lucide-react";
import { servicesApi, ProviderStatsByPeriod } from "@/lib/services.api";

const periods = ["Esta semana", "Este mês", "Este ano", "Total"];

// Rating arredondado a 1 casa decimal — evita números tipo
// "4.666666666666667" que rebentam o layout, principalmente no telemóvel.
const fmtRating = (n: number) => n.toFixed(1);

// Gráfico de barras simples inline — sem biblioteca externa
function BarChart({
  data, color, unit,
}: {
  data: { label: string; value: number }[];
  color: string;
  unit?: string;
}) {
  if (!data.length) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 20px", color: "#3a4a5a" }}>
      <BarChart3 size={28} />
      <p style={{ fontSize: 13 }}>Sem dados para este período</p>
    </div>
  );

  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, width: "100%", overflowX: "auto", paddingBottom: 4 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: "1 0 auto", minWidth: 28 }}>
          <span style={{ fontSize: 9, color: "#4a6a6a", whiteSpace: "nowrap" }}>
            {d.value > 0 ? (unit === "Kz" ? `${(d.value / 1000).toFixed(0)}k` : d.value) : ""}
          </span>
          <div style={{
            width: "100%",
            height: `${Math.max((d.value / max) * 90, d.value > 0 ? 6 : 2)}px`,
            background: d.value > 0 ? color : "#1a2535",
            borderRadius: "4px 4px 0 0",
            transition: "height 0.3s ease",
            minHeight: 2,
          }} />
          <span style={{ fontSize: 9, color: "#4a6a6a", whiteSpace: "nowrap" }}>{d.label}</span>
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

  // Tempo médio formatado
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
      color: "#1D9E75",
      icon: Briefcase,
    },
    {
      label: "Total ganho",
      value: `${stats.totalEarnings.toLocaleString("pt-PT")} Kz`,
      sub: activePeriod,
      color: "#EF9F27",
      icon: Wallet,
    },
    {
      label: "Avaliação média",
      value: stats.averageRating != null ? `${fmtRating(stats.averageRating)} ★` : "—",
      sub: stats.averageRating != null ? "Média histórica" : "Sem avaliações",
      color: "#378ADD",
      icon: Star,
    },
    {
      label: "Tempo médio resposta",
      value: fmtResponseTime(stats.avgResponseTimeHours),
      sub: stats.avgResponseTimeHours != null ? "Desde pedido até aceite" : "Sem dados",
      color: "#D4537E",
      icon: Clock,
    },
  ] : [
    { label: "Serviços concluídos", value: "…", sub: "A carregar", color: "#1D9E75", icon: Briefcase },
    { label: "Total ganho",         value: "…", sub: "A carregar", color: "#EF9F27", icon: Wallet },
    { label: "Avaliação média",     value: "…", sub: "A carregar", color: "#378ADD", icon: Star },
    { label: "Tempo médio resposta",value: "…", sub: "A carregar", color: "#D4537E", icon: Clock },
  ];

  return (
    <>
      <style>{`
        .ps-inner{padding:28px 32px;display:flex;flex-direction:column;gap:24px}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .stat-card{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px}
        .stat-value{font-size:26px;font-weight:700;margin-bottom:4px;line-height:1.15;word-break:break-word}
        .periods{display:flex;gap:4px;background:#131b27;border-radius:12px;padding:4px;border:1px solid #1a2535;flex-wrap:wrap}
        .period-btn{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;color:#6a7a8a;transition:all 0.15s;font-family:inherit}
        .period-btn.on{background:#EF9F27;color:#0d1117}
        .chart-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:28px}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .info-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:24px}
        .rank-item{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1a2535}
        .rank-item:last-child{border-bottom:none}
        .tip-item{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #1a2535}
        .tip-item:last-child{border-bottom:none}
        .ranking-bar{height:8px;border-radius:99px;background:#1a2535;overflow:hidden;margin-top:8px}
        .ranking-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#EF9F27,#1D9E75);transition:width 0.6s ease}
        @media(max-width:1024px){.stats-grid{grid-template-columns:repeat(2,1fr)}.grid2{grid-template-columns:1fr}}
        @media(max-width:640px){.ps-inner{padding:16px}.stats-grid{grid-template-columns:1fr 1fr}.periods{width:100%}.period-btn{flex:1;text-align:center}.stat-value{font-size:22px}}
        @media(max-width:400px){.stat-value{font-size:19px}}
      `}</style>

      <div className="ps-inner">
        {/* ── Header + Períodos ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Estatísticas</h1>
            <p style={{ fontSize: 13, color: "#4a6a6a" }}>Acompanha o desempenho do teu negócio</p>
          </div>
          <div className="periods">
            {periods.map(p => (
              <button key={p} className={`period-btn${activePeriod === p ? " on" : ""}`} onClick={() => setActivePeriod(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── Erro ── */}
        {error && (
          <div style={{ background: "#E24B4A15", border: "1px solid #E24B4A30", borderRadius: 12, padding: 16, display: "flex", gap: 12 }}>
            <AlertCircle size={18} style={{ color: "#E24B4A", flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: "#E24B4A" }}>{error}</p>
          </div>
        )}

        {/* ── 4 Métricas ── */}
        <div className="stats-grid">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div className="stat-card" key={i}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <p style={{ fontSize: 13, color: "#4a6a6a" }}>{m.label}</p>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${m.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} style={{ color: m.color }} />
                  </div>
                </div>
                {loading
                  ? <Loader2 size={18} style={{ color: m.color, animation: "spin 1s linear infinite" }} />
                  : <p className="stat-value" style={{ color: m.color }}>{m.value}</p>
                }
                <p style={{ fontSize: 12, color: "#3a4a5a" }}>{m.sub}</p>
              </div>
            );
          })}
        </div>

        {/* ── Gráfico de ganhos ── */}
        <div className="chart-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0", marginBottom: 4 }}>Evolução de ganhos</h2>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Período: <span style={{ color: "#EF9F27", fontWeight: 600 }}>{activePeriod}</span></p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#EF9F2720", border: "1px solid #EF9F2740" }}>
              <TrendingUp size={14} style={{ color: "#EF9F27" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#EF9F27" }}>
                {loading ? "…" : `${stats?.totalEarnings.toLocaleString("pt-PT") ?? 0} Kz — ${activePeriod}`}
              </span>
            </div>
          </div>
          {loading
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 12 }}>
                <Loader2 size={20} style={{ color: "#EF9F27", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 13, color: "#4a6a6a" }}>A carregar...</span>
              </div>
            : <BarChart data={stats?.earningsByPeriod ?? []} color="#EF9F27" unit="Kz" />
          }
        </div>

        {/* ── Gráfico de serviços concluídos ── */}
        <div className="chart-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0", marginBottom: 4 }}>Serviços concluídos</h2>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Período: <span style={{ color: "#1D9E75", fontWeight: 600 }}>{activePeriod}</span></p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#1d9e7520", border: "1px solid #1d9e7540" }}>
              <Briefcase size={14} style={{ color: "#1D9E75" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#1D9E75" }}>
                {loading ? "…" : `${stats?.totalCompleted ?? 0} concluídos`}
              </span>
            </div>
          </div>
          {loading
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 12 }}>
                <Loader2 size={20} style={{ color: "#1D9E75", animation: "spin 1s linear infinite" }} />
              </div>
            : <BarChart data={stats?.completedByPeriod ?? []} color="#1D9E75" />
          }
        </div>

        {/* ── Ranking score ── */}
        {stats && (
          <div className="chart-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0", marginBottom: 4 }}>Ranking score</h2>
                <p style={{ fontSize: 13, color: "#4a6a6a" }}>Baseado no teu desempenho real</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, background: "#EF9F2720", border: "1px solid #EF9F2740" }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#EF9F27" }}>{stats.rankingScore}</span>
                <span style={{ fontSize: 12, color: "#EF9F27" }}>/100</span>
              </div>
            </div>
            <div className="ranking-bar">
              <div className="ranking-fill" style={{ width: `${stats.rankingScore}%` }} />
            </div>
            <p style={{ fontSize: 12, color: "#4a6a6a", marginTop: 8 }}>
              {stats.rankingScore >= 70
                ? "🟢 Excelente — estás no top de prestadores"
                : stats.rankingScore >= 40
                ? "🟡 Bom — continua a melhorar para subir"
                : "🔴 Começa a completar serviços para subir no ranking"}
            </p>
          </div>
        )}

        {/* ── Grid: ranking factors + dicas ── */}
        <div className="grid2">
          <div className="info-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0", marginBottom: 4 }}>Factores de ranking</h2>
            <p style={{ fontSize: 13, color: "#4a6a6a", marginBottom: 16 }}>O que influencia a tua posição</p>
            {[
              { label: "Avaliação média",             desc: "Peso: 40%", color: "#1D9E75", value: stats?.averageRating != null ? `${fmtRating(stats.averageRating)}/5` : "—" },
              { label: "Volume de serviços via app",  desc: "Peso: 30%", color: "#EF9F27", value: stats ? String(stats.totalCompleted) : "—" },
              { label: "Velocidade de resposta",      desc: "Peso: 20%", color: "#378ADD", value: fmtResponseTime(stats?.avgResponseTimeHours ?? null) },
              { label: "Perfil completo e verificado",desc: "Peso: 10%", color: "#D4537E", value: "KYC" },
            ].map((r, i) => (
              <div className="rank-item" key={i}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#c0d0e0" }}>{r.label}</p>
                  <p style={{ fontSize: 11, color: "#4a5a6a", marginTop: 2 }}>{r.desc}</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div className="info-card">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0", marginBottom: 4 }}>Dicas para crescer</h2>
            <p style={{ fontSize: 13, color: "#4a6a6a", marginBottom: 16 }}>Como aumentar a tua visibilidade</p>
            {[
              { icon: "✅", title: "Completa o KYC",           desc: "Perfis verificados aparecem primeiro nos resultados." },
              { icon: "📸", title: "Adiciona fotos ao portfólio", desc: "Prestadores com portfólio têm mais contactos." },
              { icon: "⚡", title: "Responde rápido",            desc: "Responde em menos de 30 min para subir no ranking." },
              { icon: "💳", title: "Usa pagamentos via app",     desc: "Serviços pagos pela plataforma aumentam o score." },
            ].map((t, i) => (
              <div className="tip-item" key={i}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{t.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#c0d0e0", marginBottom: 3 }}>{t.title}</p>
                  <p style={{ fontSize: 12, color: "#4a5a6a", lineHeight: 1.5 }}>{t.desc}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => router.push("/provider/services")}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, border: "none", background: "#EF9F27", color: "#0d1117", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 16, width: "100%" }}
            >
              Ver pedidos disponíveis <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
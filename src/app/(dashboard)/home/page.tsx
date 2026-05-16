"use client";

import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Shield, ChevronRight, ArrowRight, Zap, MapPin,
  Star, CheckCircle, MessageCircle, Search
} from "lucide-react";

const categories = [
  { icon: "🧹", label: "Limpeza", bg: "#0e2d2d" },
  { icon: "❄️", label: "Climatização", bg: "#0e2020" },
  { icon: "🔧", label: "Canalização", bg: "#1a2232" },
  { icon: "⚡", label: "Eletricista", bg: "#2a1e08" },
  { icon: "💻", label: "TI & Redes", bg: "#1a2232" },
  { icon: "🌿", label: "Jardinagem", bg: "#0e2d0e" },
  { icon: "📦", label: "Mudanças", bg: "#2a1808" },
  { icon: "💆", label: "Beleza", bg: "#1e1a2e" },
  { icon: "🚗", label: "Automóvel", bg: "#1a1a2e" },
  { icon: "🎨", label: "Pintura", bg: "#2a1a1a" },
  { icon: "🏗️", label: "Construção", bg: "#1a2020" },
  { icon: "🔐", label: "Segurança", bg: "#1a1a2a" },
];

const steps = [
  { icon: <Search size={22} style={{ color: "#1D9E75" }} />, bg: "#0b2a2a", title: "Pesquisa", desc: "Encontra prestadores verificados perto de ti por categoria ou localização." },
  { icon: <MessageCircle size={22} style={{ color: "#378ADD" }} />, bg: "#0a1a2e", title: "Contacta e paga", desc: "Fala pelo chat, acerta o orçamento e paga com total segurança." },
  { icon: <CheckCircle size={22} style={{ color: "#EF9F27" }} />, bg: "#2a1e08", title: "Confirma", desc: "Confirma o serviço concluído e o pagamento é libertado ao prestador." },
];

const features = [
  { icon: <Shield size={20} style={{ color: "#1D9E75" }} />, bg: "#0b2a2a", border: "#1d9e7525", title: "Pagamento protegido", desc: "Valor retido e só libertado quando confirmas a conclusão." },
  { icon: <Star size={20} style={{ color: "#EF9F27" }} />, bg: "#2a1e08", border: "#EF9F2725", title: "Prestadores verificados", desc: "Todos passam por verificação de identidade antes de serem aceites." },
  { icon: <MapPin size={20} style={{ color: "#378ADD" }} />, bg: "#0a1a2e", border: "#378ADD25", title: "Geolocalização", desc: "Prestadores no teu raio com tempo estimado de chegada." },
  { icon: <Zap size={20} style={{ color: "#D4537E" }} />, bg: "#2a0a1e", border: "#D4537E25", title: "Resposta rápida", desc: "Os melhores prestadores respondem em minutos pelo chat." },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        .home-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .home-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .home-inner { flex: 1; padding: 32px; display: flex; flex-direction: column; gap: 28px; }
        .hero { border-radius: 20px; padding: 48px; background: #0b2a2a; border: 1px solid #1d9e7530; display: flex; align-items: center; justify-content: space-between; gap: 32px; }
        .hero-stats { display: flex; gap: 16px; flex-shrink: 0; }
        .hero-stat { display: flex; flex-direction: column; align-items: center; padding: 20px 24px; border-radius: 16px; background: #091e1e; border: 1px solid #1a3535; min-width: 100px; }
        .cats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
        .cat-btn { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px 8px; border-radius: 14px; cursor: pointer; background: #0d1117; border: 1px solid #1a2535; transition: all 0.15s; }
        .cat-btn:hover { border-color: #1D9E75; transform: translateY(-2px); }
        .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .card { border-radius: 20px; padding: 28px; background: #131b27; border: 1px solid #1a2535; }
        .step { display: flex; align-items: flex-start; gap: 16px; padding: 16px; border-radius: 14px; background: #0d1117; border: 1px solid #1a2535; }
        .feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .feat { padding: 16px; border-radius: 14px; }
        .btn-primary { display: flex; align-items: center; gap: 8px; padding: 14px 24px; border-radius: 12px; border: none; background: #1D9E75; color: white; font-size: 15px; font-weight: 600; cursor: pointer; white-space: nowrap; font-family: inherit; }
        .btn-ghost { display: flex; align-items: center; gap: 8px; padding: 14px 24px; border-radius: 12px; background: transparent; color: #8a9ab0; border: 1px solid #1a2535; font-size: 15px; font-weight: 500; cursor: pointer; white-space: nowrap; font-family: inherit; }
        .btn-amber { padding: 10px 18px; border-radius: 10px; background: #EF9F2720; color: #EF9F27; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid #EF9F2740; white-space: nowrap; font-family: inherit; }
        @media (max-width: 1024px) {
          .home-main { margin-left: 0; }
          .hero { flex-direction: column; padding: 32px 24px; }
          .hero-stats { justify-content: center; }
          .cats-grid { grid-template-columns: repeat(4, 1fr); }
          .bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .home-inner { padding: 16px; gap: 20px; }
          .hero { padding: 24px 16px; }
          .hero-stats { gap: 10px; }
          .hero-stat { min-width: 80px; padding: 14px 16px; }
          .cats-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .feat-grid { grid-template-columns: 1fr; }
          .btn-primary, .btn-ghost { padding: 12px 18px; font-size: 14px; }
        }
      `}</style>

      <div className="home-wrap">
        <Sidebar />
        <div className="home-main">
          <Navbar />
          <main className="home-inner">

            <div className="hero">
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1D9E75", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Serviapp · Angola
                  </span>
                </div>
                <h1 style={{ fontSize: 40, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.15, marginBottom: 16 }}>
                  Encontra o serviço<br />
                  <span style={{ color: "#1D9E75" }}>certo, perto de ti.</span>
                </h1>
                <p style={{ fontSize: 15, color: "#4a7a7a", lineHeight: 1.75, marginBottom: 28, maxWidth: 480 }}>
                  Prestadores verificados com geolocalização, avaliações reais e pagamento 100% protegido.
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button className="btn-primary" onClick={() => router.push("/search")}>
                    <Search size={16} /> Encontrar prestador
                  </button>
                  <button className="btn-ghost" onClick={() => router.push("/register/provider")}>
                    Sou prestador <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <div className="hero-stats">
                {[
                  { value: "500+", label: "Prestadores", color: "#1D9E75" },
                  { value: "15+", label: "Categorias", color: "#EF9F27" },
                  { value: "4.9★", label: "Avaliação", color: "#378ADD" },
                ].map((s, i) => (
                  <div className="hero-stat" key={i}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</span>
                    <span style={{ fontSize: 12, color: "#4a6a6a", marginTop: 6 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#c0d0e0" }}>Categorias de serviço</h2>
                  <p style={{ fontSize: 13, color: "#4a6a6a", marginTop: 4 }}>Escolhe a categoria que precisas</p>
                </div>
                <button onClick={() => router.push("/categories")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#1D9E75", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  Ver todas <ChevronRight size={15} />
                </button>
              </div>
              <div className="cats-grid">
                {categories.map((c, i) => (
                  <button className="cat-btn" key={i} onClick={() => router.push(`/search?category=${encodeURIComponent(c.label)}`)}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: c.bg }}>{c.icon}</div>
                    <span style={{ fontSize: 12, color: "#8a9ab0", textAlign: "center" }}>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bottom-grid">
              <div className="card">
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#c0d0e0", marginBottom: 6 }}>Como funciona</h2>
                <p style={{ fontSize: 13, color: "#4a6a6a", marginBottom: 20 }}>3 passos simples para contratar</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {steps.map((s, i) => (
                    <div className="step" key={i}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#1D9E75", marginBottom: 4 }}>Passo {i + 1}</p>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#c0d0e0", marginBottom: 4 }}>{s.title}</p>
                        <p style={{ fontSize: 12, color: "#4a6a6a", lineHeight: 1.6 }}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#c0d0e0", marginBottom: 6 }}>Porquê a Serviapp?</h2>
                <p style={{ fontSize: 13, color: "#4a6a6a", marginBottom: 20 }}>A plataforma mais segura de Angola</p>
                <div className="feat-grid">
                  {features.map((f, i) => (
                    <div className="feat" key={i} style={{ background: f.bg, border: `1px solid ${f.border}` }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 12, background: "#00000020", display: "flex", alignItems: "center", justifyContent: "center" }}>{f.icon}</div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#c0d0e0", marginBottom: 6 }}>{f.title}</p>
                      <p style={{ fontSize: 12, color: "#4a6a6a", lineHeight: 1.6 }}>{f.desc}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: 16, borderRadius: 14, background: "#0d1117", border: "1px solid #1a2535", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#c0d0e0", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <Zap size={14} style={{ color: "#EF9F27" }} /> És prestador?
                    </p>
                    <p style={{ fontSize: 12, color: "#4a6a6a" }}>Regista-te e começa a receber clientes hoje.</p>
                  </div>
                  <button className="btn-amber" onClick={() => router.push("/register/provider")}>
                    Criar perfil
                  </button>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  );
}
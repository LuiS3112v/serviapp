"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { ChevronRight } from "lucide-react";

const categories = [
  { icon: "🧹", label: "Limpeza", desc: "Limpeza residencial e comercial", count: 48, bg: "#0e2d2d", color: "#1D9E75" },
  { icon: "❄️", label: "Climatização", desc: "Instalação e manutenção de AC", count: 32, bg: "#0e2020", color: "#378ADD" },
  { icon: "🔧", label: "Canalização", desc: "Fugas, instalações e reparações", count: 27, bg: "#1a2232", color: "#5a7aDD" },
  { icon: "⚡", label: "Eletricista", desc: "Instalações eléctricas e reparações", count: 41, bg: "#2a1e08", color: "#EF9F27" },
  { icon: "💻", label: "TI & Redes", desc: "Suporte técnico e redes", count: 19, bg: "#1a2232", color: "#8B5CF6" },
  { icon: "🌿", label: "Jardinagem", desc: "Poda, manutenção e paisagismo", count: 15, bg: "#0e2d0e", color: "#22C55E" },
  { icon: "📦", label: "Mudanças", desc: "Transporte e mudanças de casa", count: 22, bg: "#2a1808", color: "#F97316" },
  { icon: "💆", label: "Beleza", desc: "Cabeleireiro, manicure e estética", count: 35, bg: "#1e1a2e", color: "#D4537E" },
  { icon: "🚗", label: "Automóvel", desc: "Mecânica e manutenção auto", count: 29, bg: "#1a1a2e", color: "#60A5FA" },
  { icon: "🎨", label: "Pintura", desc: "Pintura de interiores e exteriores", count: 18, bg: "#2a1a1a", color: "#F87171" },
  { icon: "🏗️", label: "Construção", desc: "Obras, remodelações e acabamentos", count: 24, bg: "#1a2020", color: "#34D399" },
  { icon: "🔐", label: "Segurança", desc: "Vigilância e sistemas de segurança", count: 11, bg: "#1a1a2a", color: "#A78BFA" },
];

export default function CategoriesPage() {
  return (
    <>
      <style>{`
        .cats-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .cats-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .cats-inner { flex: 1; padding: 28px 32px; }
        .cats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 24px; }
        .cat-card { background: #131b27; border: 1px solid #1a2535; border-radius: 16px; padding: 20px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 16px; }
        .cat-card:hover { border-color: #1D9E75; transform: translateY(-2px); }
        .cat-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
        @media (max-width: 1024px) { .cats-main { margin-left: 0; } }
        @media (max-width: 640px) { .cats-inner { padding: 16px; } .cats-grid { grid-template-columns: 1fr; } }
      `}</style>
      <div className="cats-wrap">
        <Sidebar />
        <div className="cats-main">
          <Navbar />
          <div className="cats-inner">
            <div style={{ marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Todas as categorias</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>{categories.length} categorias disponíveis · {categories.reduce((a, c) => a + c.count, 0)} prestadores no total</p>
            </div>

            <div className="cats-grid">
              {categories.map((c, i) => (
                <div className="cat-card" key={i}>
                  <div className="cat-icon" style={{ background: c.bg }}>{c.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>{c.label}</p>
                    <p style={{ fontSize: 12, color: "#4a6a6a", marginBottom: 6 }}>{c.desc}</p>
                    <span style={{ fontSize: 11, fontWeight: 600, color: c.color, background: c.bg, padding: "2px 8px", borderRadius: 99 }}>
                      {c.count} prestadores
                    </span>
                  </div>
                  <ChevronRight size={16} style={{ color: "#2a3a4a", flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
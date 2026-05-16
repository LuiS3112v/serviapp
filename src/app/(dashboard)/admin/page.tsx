"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Users, Briefcase, Wallet, Shield, TrendingUp, AlertCircle } from "lucide-react";

const stats = [
  { label: "Utilizadores", value: "0", icon: Users, color: "#1D9E75", bg: "#1d9e7520" },
  { label: "Serviços activos", value: "0", icon: Briefcase, color: "#378ADD", bg: "#378ADD20" },
  { label: "Volume total", value: "0 Kz", icon: Wallet, color: "#EF9F27", bg: "#EF9F2720" },
  { label: "Pendentes KYC", value: "0", icon: Shield, color: "#D4537E", bg: "#D4537E20" },
];

export default function AdminPage() {
  return (
    <>
      <style>{`
        .adm-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .adm-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .adm-inner { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .stat-card { background: #131b27; border: 1px solid #1a2535; border-radius: 16px; padding: 20px; }
        .adm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .adm-card { background: #131b27; border: 1px solid #1a2535; border-radius: 16px; padding: 20px; }
        .empty-list { display: flex; flex-direction: column; align-items: center; padding: 32px; gap: 8px; text-align: center; }
        @media (max-width: 1024px) { .adm-main { margin-left: 0; } .stats-grid { grid-template-columns: repeat(2,1fr); } .adm-grid { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .adm-inner { padding: 16px; } .stats-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
      <div className="adm-wrap">
        <Sidebar />
        <div className="adm-main">
          <Navbar />
          <div className="adm-inner">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Painel de administração</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Visão geral da plataforma Serviapp</p>
            </div>

            <div className="stats-grid">
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div className="stat-card" key={i}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <p style={{ fontSize: 13, color: "#4a6a6a" }}>{s.label}</p>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={16} style={{ color: s.color }} />
                      </div>
                    </div>
                    <p style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="adm-grid">
              <div className="adm-card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <TrendingUp size={16} style={{ color: "#1D9E75" }} />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#c0d0e0" }}>Últimos registos</h2>
                </div>
                <div className="empty-list">
                  <Users size={28} style={{ color: "#2a3a4a" }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#c0d0e0" }}>Sem registos ainda</p>
                  <p style={{ fontSize: 12, color: "#4a6a6a" }}>Os novos utilizadores vão aparecer aqui.</p>
                </div>
              </div>

              <div className="adm-card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <AlertCircle size={16} style={{ color: "#EF9F27" }} />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "#c0d0e0" }}>KYC pendentes</h2>
                </div>
                <div className="empty-list">
                  <Shield size={28} style={{ color: "#2a3a4a" }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#c0d0e0" }}>Sem verificações pendentes</p>
                  <p style={{ fontSize: 12, color: "#4a6a6a" }}>Pedidos de KYC vão aparecer aqui.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
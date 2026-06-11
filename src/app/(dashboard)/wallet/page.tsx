"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, Shield } from "lucide-react";

export default function WalletPage() {
  return (
    <>
      <style>{`
        .w-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .w-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .w-inner { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; max-width: 800px; }
        .w-card { border-radius: 20px; padding: 28px; background: #0b2a2a; border: 1px solid #1d9e7530; }
        .w-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .w-stat { background: #131b27; border: 1px solid #1a2535; border-radius: 14px; padding: 16px; }
        .w-btn-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .w-btn { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; }
        .empty-tx { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 12px; text-align: center; }
        @media (max-width: 1024px) { .w-main { margin-left: 0; } }
        @media (max-width: 640px) { .w-inner { padding: 16px; } .w-grid { grid-template-columns: 1fr; } .w-btn-row { flex-direction: column; } .w-btn { justify-content: center; } }
      `}</style>
      <div className="w-wrap">
        <Sidebar />
        <div className="w-main">
          <Navbar />
          <div className="w-inner">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Wallet</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Gere os teus pagamentos e levantamentos</p>
            </div>

            <div className="w-card">
              <p style={{ fontSize: 12, fontWeight: 600, color: "#5DCAA5", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Saldo disponível</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>0 Kz</p>
              <p style={{ fontSize: 13, color: "#4a7a7a", marginBottom: 20 }}>O teu saldo vai aparecer aqui após o primeiro serviço</p>
              <div className="w-btn-row">
                <button className="w-btn" style={{ background: "#1D9E75", color: "white" }}>
                  <ArrowUpRight size={16} /> Levantar
                </button>
                <button className="w-btn" style={{ background: "#131b27", color: "#8a9ab0", border: "1px solid #1a2535" }}>
                  <Plus size={16} /> Adicionar saldo
                </button>
              </div>
            </div>

            <div className="w-grid">
              <div className="w-stat">
                <p style={{ fontSize: 12, color: "#4a6a6a", marginBottom: 6 }}>Saldo retido</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#EF9F27" }}>0 Kz</p>
                <p style={{ fontSize: 11, color: "#4a5a6a", marginTop: 4 }}>Aguarda confirmação de serviço</p>
              </div>
              <div className="w-stat">
                <p style={{ fontSize: 12, color: "#4a6a6a", marginBottom: 6 }}>Total recebido</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#1D9E75" }}>0 Kz</p>
                <p style={{ fontSize: 11, color: "#4a5a6a", marginTop: 4 }}>Este mês</p>
              </div>
            </div>

            <div style={{ borderRadius: 16, padding: "20px 24px", background: "#131b27", border: "1px solid #1a2535" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0" }}>Transacções recentes</h2>
              </div>
              <div className="empty-tx">
                <div style={{ width: 52, height: 52, borderRadius: 16, background: "#0d1117", border: "1px solid #1a2535", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wallet size={24} style={{ color: "#2a3a4a" }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: "#c0d0e0" }}>Sem transacções</p>
                <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.6, maxWidth: 280 }}>
                  As tuas transacções vão aparecer aqui após o primeiro pagamento.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 14, background: "#0b2424", border: "1px solid #1d9e7525" }}>
              <Shield size={18} style={{ color: "#1D9E75", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#c0d0e0", marginBottom: 2 }}>Pagamentos protegidos</p>
                <p style={{ fontSize: 12, color: "#4a7a7a" }}>Todos os pagamentos usam o sistema de escrow — o valor só é libertado após confirmação.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";

const tabs = ["Todos", "Recebidos", "Enviados", "Retidos"];

export default function TransactionsPage() {
  const [tab, setTab] = useState("Todos");

  return (
    <>
      <style>{`
        .tx-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .tx-main { flex: 1; display: flex; flex-direction: column; }
        .tx-inner { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; max-width: 800px; }
        .tabs { display: flex; gap: 4px; background: #131b27; border-radius: 12px; padding: 4px; border: 1px solid #1a2535; width: fit-content; flex-wrap: wrap; }
        .tab { padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: none; color: #6a7a8a; transition: all 0.15s; }
        .tab.on { background: #1D9E75; color: white; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 16px; text-align: center; background: #131b27; border: 1px solid #1a2535; border-radius: 16px; }
        @media (max-width: 1024px) {  }
        @media (max-width: 640px) { .tx-inner { padding: 16px; } .tabs { width: 100%; } .tab { flex: 1; text-align: center; } }
      `}</style>
      <div className="tx-wrap">
        <div className="tx-main">
          <div className="tx-inner">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Transacções</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Histórico completo dos teus movimentos</p>
            </div>
            <div className="tabs">
              {tabs.map(t => (
                <button key={t} className={`tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
            <div className="empty-state">
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "#0d1117", border: "1px solid #1a2535", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Receipt size={24} style={{ color: "#2a3a4a" }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#c0d0e0" }}>Sem {tab === "Todos" ? "transacções" : tab.toLowerCase()} ainda</p>
              <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.6, maxWidth: 280 }}>
                Os teus movimentos de {tab.toLowerCase()} vão aparecer aqui.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
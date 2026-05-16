"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Plus, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";

const tabs = ["Todos", "Pendente", "Em execução", "Concluído"];

export default function ServicesPage() {
  const router = useRouter();
  const [tab, setTab] = useState("Todos");

  return (
    <>
      <style>{`
        .sv-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .sv-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .sv-inner { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; }
        .tabs { display: flex; gap: 4px; background: #131b27; border-radius: 12px; padding: 4px; border: 1px solid #1a2535; width: fit-content; flex-wrap: wrap; }
        .tab { padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; background: none; color: #6a7a8a; transition: all 0.15s; }
        .tab.on { background: #1D9E75; color: white; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 16px; text-align: center; }
        @media (max-width: 1024px) { .sv-main { margin-left: 0; } }
        @media (max-width: 640px) { .sv-inner { padding: 16px; } }
      `}</style>
      <div className="sv-wrap">
        <Sidebar />
        <div className="sv-main">
          <Navbar />
          <div className="sv-inner">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Os meus serviços</h1>
                <p style={{ fontSize: 13, color: "#4a6a6a" }}>Acompanha todos os teus pedidos</p>
              </div>
              <button onClick={() => router.push("/services/new")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, border: "none", background: "#1D9E75", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={16} /> Novo serviço
              </button>
            </div>

            <div className="tabs">
              {tabs.map(t => (
                <button key={t} className={`tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>

            <div className="empty-state">
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "#131b27", border: "1px solid #1a2535", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Briefcase size={28} style={{ color: "#2a3a4a" }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0" }}>Sem serviços ainda</p>
              <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.6, maxWidth: 320 }}>
                Os teus pedidos de serviço vão aparecer aqui. Cria o primeiro pedido para começar.
              </p>
              <button onClick={() => router.push("/services/new")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, border: "none", background: "#1D9E75", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={16} /> Criar primeiro serviço
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
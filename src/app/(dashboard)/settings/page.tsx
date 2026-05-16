"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Bell, Shield, Globe, Moon, LogOut, ChevronRight, Smartphone } from "lucide-react";

const settingGroups = [
  {
    title: "Conta",
    items: [
      { icon: Shield, label: "Segurança e senha", desc: "Altera a tua senha e activa 2FA", color: "#1D9E75" },
      { icon: Smartphone, label: "Verificação de identidade", desc: "KYC — selfie e documento de identidade", color: "#378ADD" },
    ],
  },
  {
    title: "Preferências",
    items: [
      { icon: Bell, label: "Notificações", desc: "Gere as tuas preferências de notificação", color: "#EF9F27" },
      { icon: Globe, label: "Idioma e região", desc: "Português (Angola)", color: "#8B5CF6" },
      { icon: Moon, label: "Aparência", desc: "Modo escuro activo", color: "#D4537E" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <>
      <style>{`
        .set-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .set-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .set-inner { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; max-width: 680px; }
        .set-group { background: #131b27; border: 1px solid #1a2535; border-radius: 16px; overflow: hidden; }
        .set-item { display: flex; align-items: center; gap: 14px; padding: 16px 20px; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid #1a2535; }
        .set-item:last-child { border-bottom: none; }
        .set-item:hover { background: #0d1520; }
        @media (max-width: 1024px) { .set-main { margin-left: 0; } }
        @media (max-width: 640px) { .set-inner { padding: 16px; } }
      `}</style>
      <div className="set-wrap">
        <Sidebar />
        <div className="set-main">
          <Navbar />
          <div className="set-inner">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Definições</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Gere a tua conta e preferências</p>
            </div>

            {settingGroups.map((group, gi) => (
              <div key={gi}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#3a4a5a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{group.title}</p>
                <div className="set-group">
                  {group.items.map((item, ii) => {
                    const Icon = item.icon;
                    return (
                      <div className="set-item" key={ii}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={18} style={{ color: item.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#c0d0e0", marginBottom: 2 }}>{item.label}</p>
                          <p style={{ fontSize: 12, color: "#4a5a6a" }}>{item.desc}</p>
                        </div>
                        <ChevronRight size={16} style={{ color: "#2a3a4a" }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="set-group">
              <div className="set-item" style={{ cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#E24B4A15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <LogOut size={18} style={{ color: "#E24B4A" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#E24B4A" }}>Terminar sessão</p>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12, color: "#2a3a4a", textAlign: "center" }}>Serviapp v1.0.0 · Angola</p>
          </div>
        </div>
      </div>
    </>
  );
}
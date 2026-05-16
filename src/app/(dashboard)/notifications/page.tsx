"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { CheckCircle, MessageCircle, Wallet, AlertCircle, Bell } from "lucide-react";

const notifTypes = [
  { type: "message", icon: MessageCircle, color: "#1D9E75", bg: "#1d9e7520" },
  { type: "service", icon: CheckCircle, color: "#378ADD", bg: "#378ADD20" },
  { type: "wallet", icon: Wallet, color: "#EF9F27", bg: "#EF9F2720" },
  { type: "alert", icon: AlertCircle, color: "#E24B4A", bg: "#E24B4A20" },
];

export default function NotificationsPage() {
  return (
    <>
      <style>{`
        .notif-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .notif-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .notif-inner { flex: 1; padding: 28px 32px; max-width: 680px; display: flex; flex-direction: column; gap: 20px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 16px; }
        @media (max-width: 1024px) { .notif-main { margin-left: 0; } }
        @media (max-width: 640px) { .notif-inner { padding: 16px; } }
      `}</style>
      <div className="notif-wrap">
        <Sidebar />
        <div className="notif-main">
          <Navbar />
          <div className="notif-inner">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Notificações</h1>
                <p style={{ fontSize: 13, color: "#4a6a6a" }}>As tuas notificações vão aparecer aqui</p>
              </div>
            </div>

            <div className="empty-state">
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "#131b27", border: "1px solid #1a2535", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell size={28} style={{ color: "#2a3a4a" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0", marginBottom: 8 }}>Sem notificações</p>
                <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.6 }}>
                  Quando tiveres mensagens, actualizações<br />de serviços ou pagamentos, vão aparecer aqui.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
                {notifTypes.map((n, i) => {
                  const Icon = n.icon;
                  const labels = ["Mensagens dos prestadores", "Actualizações de serviços", "Movimentos da wallet", "Alertas importantes"];
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "#131b27", border: "1px solid #1a2535" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: n.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={16} style={{ color: n.color }} />
                      </div>
                      <span style={{ fontSize: 13, color: "#6a7a8a" }}>{labels[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { MessageCircle, Search } from "lucide-react";

export default function ChatPage() {
  return (
    <>
      <style>{`
        .chat-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .chat-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .chat-inner { flex: 1; padding: 28px 32px; max-width: 680px; display: flex; flex-direction: column; gap: 16px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 16px; text-align: center; }
        @media (max-width: 1024px) { .chat-main { margin-left: 0; } }
        @media (max-width: 640px) { .chat-inner { padding: 16px; } }
      `}</style>
      <div className="chat-wrap">
        <Sidebar />
        <div className="chat-main">
          <Navbar />
          <div className="chat-inner">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Mensagens</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Conversa com os teus prestadores</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "#131b27", border: "1px solid #1a2535" }}>
              <Search size={15} style={{ color: "#4a7070" }} />
              <input placeholder="Pesquisar conversa..." style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "#8a9ab0" }} />
            </div>
            <div className="empty-state">
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "#131b27", border: "1px solid #1a2535", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageCircle size={28} style={{ color: "#2a3a4a" }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0" }}>Sem mensagens ainda</p>
              <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.6, maxWidth: 320 }}>
                As tuas conversas com prestadores vão aparecer aqui após contratares um serviço.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
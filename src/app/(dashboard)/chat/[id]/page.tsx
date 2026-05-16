"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Image, FileText, AlertTriangle, Shield } from "lucide-react";

const messages = [
  { id: 1, from: "p", text: "Bom dia! Vi o seu pedido de limpeza. Posso ir amanhã às 9h.", time: "09:14" },
  { id: 2, from: "c", text: "Bom dia! Que bom. Tem materiais incluídos?", time: "09:16" },
  { id: 3, from: "p", text: "Sim, materiais incluídos no preço. Trabalho com produtos de qualidade.", time: "09:17" },
  { id: 4, from: "c", text: "Perfeito! Pode enviar uma proposta formal?", time: "09:18" },
  { id: 5, from: "p", text: "Claro! A enviar agora...", time: "09:19", blocked: true },
];

export default function ChatDetailPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [msgs, setMsgs] = useState(messages);

  const send = () => {
    if (!msg.trim()) return;
    setMsgs([...msgs, { id: msgs.length + 1, from: "c", text: msg, time: "agora" }]);
    setMsg("");
  };

  return (
    <>
      <style>{`
        .chatd-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .chatd-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; max-height: 100vh; }
        .chatd-header { padding: 16px 24px; background: #080e1a; border-bottom: 1px solid #1a2535; display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
        .chatd-msgs { flex: 1; padding: 20px 24px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
        .msg-bubble { max-width: 70%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; }
        .msg-p { background: #131b27; color: #c0d0e0; align-self: flex-start; border-bottom-left-radius: 4px; }
        .msg-c { background: #1D9E75; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
        .msg-time { font-size: 10px; opacity: 0.6; margin-top: 4px; }
        .blocked-msg { background: #E24B4A15; border: 1px solid #E24B4A30; border-radius: 10px; padding: 8px 12px; display: flex; align-items: center; gap: 8px; align-self: flex-start; max-width: 80%; }
        .chatd-input { padding: 16px 24px; background: #080e1a; border-top: 1px solid #1a2535; display: flex; gap: 10px; align-items: center; flex-shrink: 0; }
        .chat-input { flex: 1; padding: 12px 16px; border-radius: 12px; background: #131b27; border: 1px solid #1a2535; color: #e2e8f0; font-size: 14px; outline: none; }
        .chat-input::placeholder { color: #4a5a6a; }
        .send-btn { width: 42px; height: 42px; border-radius: 12px; background: #1D9E75; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .proposal-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; background: #131b27; border: 1px solid #1d9e7540; color: #1D9E75; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        @media (max-width: 1024px) { .chatd-main { margin-left: 0; } }
      `}</style>
      <div className="chatd-wrap">
        <Sidebar />
        <div className="chatd-main">
          <div className="chatd-header">
            <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "#4a6a6a", display: "flex" }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#1a3a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👩</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>Filomena Neto</p>
              <p style={{ fontSize: 12, color: "#1D9E75", display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", display: "inline-block" }} /> Online agora
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#0b2424", border: "1px solid #1d9e7525" }}>
              <Shield size={13} style={{ color: "#1D9E75" }} />
              <span style={{ fontSize: 11, color: "#1D9E75", fontWeight: 600 }}>Conversa protegida</span>
            </div>
          </div>

          <div className="chatd-msgs">
            {msgs.map(m => (
              m.blocked ? (
                <div className="blocked-msg" key={m.id}>
                  <AlertTriangle size={14} style={{ color: "#E24B4A", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#E24B4A" }}>Contacto bloqueado</p>
                    <p style={{ fontSize: 11, color: "#6a3a3a" }}>Por segurança, partilha de contactos externos não é permitida.</p>
                  </div>
                </div>
              ) : (
                <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.from === "c" ? "flex-end" : "flex-start" }}>
                  <div className={`msg-bubble ${m.from === "p" ? "msg-p" : "msg-c"}`}>{m.text}</div>
                  <span className="msg-time" style={{ alignSelf: m.from === "c" ? "flex-end" : "flex-start" }}>{m.time}</span>
                </div>
              )
            ))}
          </div>

          <div style={{ padding: "8px 24px 0", display: "flex", gap: 8 }}>
            <button className="proposal-btn"><FileText size={13} /> Propor orçamento</button>
            <button className="proposal-btn"><Image size={13} /> Enviar foto</button>
          </div>

          <div className="chatd-input">
            <input className="chat-input" placeholder="Escreve uma mensagem..." value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
            <button className="send-btn" onClick={send}><Send size={16} color="white" /></button>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Send, Shield, AlertTriangle, Loader2, MessageCircle } from "lucide-react";
import { chatApi, ChatMessage, ChatRoom } from "@/lib/chat.api";
import { getToken } from "@/lib/auth.api";
import { connectSocket } from "@/lib/socket";
import { useChatUserId } from "@/hooks/useChatUserId";

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

const OPT_PREFIX = "__opt__";

export default function ProviderChatDetailPage() {
  const router         = useRouter();
  const { id: roomId } = useParams() as { id: string };

  // ═══════════════════════════════════════════════════════════════════════════
  // OWNERSHIP — exact same hook as client chat, exact same logic
  // Reads JWT payload.sub synchronously → never null on first render
  // ═══════════════════════════════════════════════════════════════════════════
  const userId = useChatUserId();

  const [room, setRoom]         = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msg, setMsg]           = useState("");
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [typing, setTyping]     = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const typingTimer             = useRef<NodeJS.Timeout | null>(null);

  const loadMessages = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await chatApi.getMessages(roomId);
      setMessages(Array.isArray(data) ? data : (data as any).messages ?? []);
    } catch {}
  }, [roomId]);

  const loadRoom = useCallback(async () => {
    try {
      const rooms = await chatApi.getRooms();
      const found = rooms.find(r => r.id === roomId);
      if (found) setRoom(found);
    } catch {}
  }, [roomId]);

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    Promise.all([loadRoom(), loadMessages()]).finally(() => setLoading(false));
  }, [loadRoom, loadMessages]);

  useEffect(() => {
    if (!getToken()) return;

    const socket = connectSocket();
    socket.emit("join_room", roomId);

    const onNewMessage = (m: ChatMessage) => {
      setMessages(prev => {
        if (prev.some(p => p.id === m.id)) return prev;

        const optIdx = prev.findIndex(
          p =>
            p.id.startsWith(OPT_PREFIX) &&
            p.senderId === m.senderId &&
            p.content  === m.content
        );
        if (optIdx !== -1) {
          const next = [...prev];
          next[optIdx] = m;
          return next;
        }

        return [...prev, m];
      });
    };

    const onTyping = (d: { userId: string; isTyping: boolean }) => {
      if (d.userId !== userId) setTyping(d.isTyping);
    };

    socket.on("new_message", onNewMessage);
    socket.on("typing",      onTyping);

    return () => {
      socket.emit("leave_room", roomId);
      socket.off("new_message", onNewMessage);
      socket.off("typing",      onTyping);
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async () => {
    const content = msg.trim();
    if (!content || sending) return;
    setSending(true);
    setMsg("");

    if (userId) {
      const optimistic: ChatMessage = {
        id:        `${OPT_PREFIX}${Date.now()}_${Math.random()}`,
        roomId,
        senderId:  userId,
        content,
        createdAt: new Date().toISOString(),
        read:      false,
      };
      setMessages(prev => [...prev, optimistic]);
    }

    try {
      connectSocket().emit("send_message", { roomId, content, type: "text" });
    } catch {}

    setSending(false);
  };

  const handleTyping = () => {
    const s = connectSocket();
    s.emit("typing", { roomId, isTyping: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => s.emit("typing", { roomId, isTyping: false }),
      1500
    );
  };

  const other = room?.participants?.find(p => p.id !== userId);

  return (
    <>
      <style>{`
        *,*::before,*::after { box-sizing: border-box }

        /* ── Shell: ocupa o espaço restante abaixo da Navbar (64px) ── */
        .pcd-wrap {
          display: flex; flex-direction: column;
          height: calc(100vh - 64px);
          background: #f8fafc; overflow: hidden;
        }

        /* ── Header ── */
        .pcd-header {
          flex-shrink: 0; display: flex; align-items: center; gap: 14px;
          padding: 0 24px; height: 65px;
          background: #ffffff; border-bottom: 1px solid #eef1f5;
        }

        /* ── Messages area ── */
        .pcd-msgs {
          flex: 1; display: flex; flex-direction: column; gap: 10px;
          padding: 20px 24px; overflow-y: auto; scroll-behavior: smooth;
          /* fundo ligeiramente estriado para distinguir do branco dos cards */
          background: #f8fafc;
        }
        .pcd-msgs::-webkit-scrollbar { width: 4px; }
        .pcd-msgs::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

        /* ── Input bar ── */
        .pcd-input-area {
          flex-shrink: 0; display: flex; align-items: center; gap: 10px;
          padding: 14px 24px;
          background: #ffffff; border-top: 1px solid #eef1f5;
        }

        /* ── Bolhas ── */

        /* Provider (eu): direita, âmbar sólido, texto escuro */
        .pcd-me {
          max-width: 68%; padding: 10px 14px; border-radius: 14px;
          font-size: 14px; line-height: 1.55; word-break: break-word;
          background: #EF9F27; color: #0f172a;
          align-self: flex-end; border-bottom-right-radius: 4px;
        }
        /* Optimistic */
        .pcd-me-opt { opacity: 0.72; }

        /* Cliente (outro): esquerda, cinza claro — igual ao cliente mas invertido */
        .pcd-other {
          max-width: 68%; padding: 10px 14px; border-radius: 14px;
          font-size: 14px; line-height: 1.55; word-break: break-word;
          background: #e4e9f0; color: #1e293b;
          align-self: flex-start; border-bottom-left-radius: 4px;
        }

        .pcd-time { font-size: 10px; opacity: 0.55; margin-top: 4px; }

        /* ── Mensagem bloqueada ── */
        .pcd-blocked {
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 10px; padding: 8px 12px;
          display: flex; align-items: center; gap: 8px;
          align-self: flex-start; max-width: 80%;
        }

        /* ── Typing indicator ── */
        .pcd-typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #94a3b8; animation: pcdtdot 1.2s infinite;
        }

        /* ── Input ── */
        .pcd-input {
          flex: 1; padding: 12px 16px; border-radius: 12px;
          background: #f8fafc; border: 1.5px solid #e2e8f0;
          color: #0f172a; font-size: 14px; outline: none;
          font-family: inherit; transition: border 0.2s, background 0.2s;
        }
        .pcd-input:focus { border-color: #EF9F27; background: #ffffff; }
        .pcd-input::placeholder { color: #94a3b8; }

        /* ── Send button — âmbar, ícone escuro (legível sobre fundo claro) ── */
        .pcd-send {
          flex-shrink: 0; width: 42px; height: 42px; border-radius: 12px;
          background: #EF9F27; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.2s, transform 0.15s;
        }
        .pcd-send:hover:not(:disabled) { transform: scale(1.05); }
        .pcd-send:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Skeleton ── */
        .pcd-sk { background: #e2e8f0; border-radius: 8px; animation: pcdsk 1.5s infinite; }
        @keyframes pcdsk   { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes pcdtdot { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        @keyframes pcdspin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }

        @media (max-width: 1024px) { .pcd-header { padding-left: 72px; } }
        @media (max-width: 640px) {
          .pcd-msgs        { padding: 12px 14px; }
          .pcd-input-area  { padding: 10px 14px; }
          .pcd-me, .pcd-other { max-width: 84%; }
        }
      `}</style>

      <div className="pcd-wrap">

        {/* ── Header ── */}
        <div className="pcd-header">
          <button
            onClick={() => router.back()}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#64748b", display:"flex", padding:4 }}
          >
            <ArrowLeft size={20}/>
          </button>

          {/* Avatar */}
          {loading
            ? <div className="pcd-sk" style={{ width:40, height:40, borderRadius:"50%", flexShrink:0 }}/>
            : (
              <div style={{
                width:40, height:40, borderRadius:"50%",
                background:"#fef3e2", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:16, fontWeight:700,
                color:"#b96f0f", flexShrink:0, overflow:"hidden",
              }}>
                {other?.avatarUrl
                  ? <img src={other.avatarUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt=""/>
                  : other?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )
          }

          {/* Name */}
          <div style={{ flex:1, minWidth:0 }}>
            {loading
              ? <div className="pcd-sk" style={{ width:120, height:14, marginBottom:4 }}/>
              : <p style={{ fontSize:15, fontWeight:700, color:"#0f172a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {other?.fullName ?? "—"}
                </p>
            }
            <p style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Cliente</p>
          </div>

          {/* Badge "Protegida" — âmbar suave, distinto do verde do cliente */}
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"6px 12px", borderRadius:8,
            background:"#fef3e2", border:"1px solid #fcd9a1", flexShrink:0,
          }}>
            <Shield size={13} style={{ color:"#EF9F27" }}/>
            <span style={{ fontSize:11, color:"#b96f0f", fontWeight:600 }}>Protegida</span>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="pcd-msgs">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="pcd-sk" style={{
                height:40, borderRadius:14,
                width: i%2===0 ? "55%" : "42%",
                alignSelf: i%2===0 ? "flex-start" : "flex-end",
              }}/>
            ))
          ) : messages.length === 0 ? (
            <div style={{
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", flex:1, gap:14, textAlign:"center",
            }}>
              <div style={{
                width:56, height:56, borderRadius:16,
                background:"#ffffff", border:"1px solid #eef1f5",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <MessageCircle size={26} style={{ color:"#94a3b8" }}/>
              </div>
              <p style={{ fontSize:14, fontWeight:600, color:"#334155" }}>
                {other ? `Inicia uma conversa com ${other.fullName}` : "Inicia a conversa"}
              </p>
              <p style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>
                Escreve uma mensagem para começar.
              </p>
            </div>
          ) : messages.map(m => {
            // ═══════════════════════════════════════════════════════════════
            // IDENTICAL OWNERSHIP LOGIC TO CLIENT CHAT — no special cases
            // message.senderId === currentUser.id  (from JWT, never from room)
            // ═══════════════════════════════════════════════════════════════
            const isMe         = userId !== null && m.senderId === userId;
            const isOptimistic = m.id.startsWith(OPT_PREFIX);

            if (m.isBlocked) return (
              <div className="pcd-blocked" key={m.id}>
                <AlertTriangle size={14} style={{ color:"#dc2626", flexShrink:0 }}/>
                <div>
                  <p style={{ fontSize:12, fontWeight:600, color:"#dc2626" }}>Mensagem bloqueada</p>
                  <p style={{ fontSize:11, color:"#b91c1c" }}>Partilha de contactos externos não é permitida.</p>
                </div>
              </div>
            );

            return (
              <div key={m.id} style={{
                display:"flex", flexDirection:"column",
                alignItems: isMe ? "flex-end" : "flex-start",
              }}>
                <div className={`${isMe ? "pcd-me" : "pcd-other"}${isOptimistic ? " pcd-me-opt" : ""}`}>
                  {m.content}
                </div>
                <span className="pcd-time" style={{ alignSelf: isMe ? "flex-end" : "flex-start" }}>
                  {isOptimistic ? "A enviar..." : formatTime(m.createdAt)}
                </span>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typing && (
            <div style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"8px 14px", background:"#e4e9f0",
              borderRadius:14, alignSelf:"flex-start", borderBottomLeftRadius:4,
            }}>
              {[0,1,2].map(i => (
                <div key={i} className="pcd-typing-dot" style={{ animationDelay:`${i*0.2}s` }}/>
              ))}
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* ── Input ── */}
        <div className="pcd-input-area">
          <input
            className="pcd-input"
            placeholder={other ? `Mensagem para ${other.fullName}...` : "Escreve uma mensagem..."}
            value={msg}
            onChange={e => { setMsg(e.target.value); handleTyping(); }}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button className="pcd-send" disabled={!msg.trim() || sending} onClick={handleSend}>
            {sending
              ? <Loader2 size={16} color="#0f172a" style={{ animation:"pcdspin 1s linear infinite" }}/>
              : <Send size={16} color="#0f172a"/>
            }
          </button>
        </div>

      </div>
    </>
  );
}
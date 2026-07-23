"use client";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { ArrowLeft, Send, Shield, AlertTriangle, Loader2, MessageCircle } from "lucide-react";
import { chatApi, ChatMessage, ChatRoom } from "@/lib/chat.api";
import { getToken } from "@/lib/auth.api";
import { connectSocket } from "@/lib/socket";
import { useChatUserId } from "@/hooks/useChatUserId";

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

// Unique prefix so we never confuse optimistic IDs with real UUIDs
const OPT_PREFIX = "__opt__";

function ChatInner() {
  const router               = useRouter();
  const { id: roomId }       = useParams() as { id: string };
  const searchParams         = useSearchParams();
  const autoMessage          = searchParams.get("message");

  // ═══════════════════════════════════════════════════════════════════════════
  // OWNERSHIP — Single source of truth
  // Read synchronously from JWT → correct on first render, no race condition.
  // Never use room.clientId / room.providerId / role-based logic.
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
  const sentAuto                = useRef(false);

  // ── Load messages from REST ──────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!getToken()) return;
    try {
      const data = await chatApi.getMessages(roomId);
      setMessages(Array.isArray(data) ? data : (data as any).messages ?? []);
    } catch {}
  }, [roomId]);

  // ── Load room to resolve the "other" participant ─────────────────────────
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

  // ── Socket: join room + listen ───────────────────────────────────────────
  // connectSocket() detects token changes and reconnects automatically,
  // so client.data.userId on the server is always correct.
  useEffect(() => {
    if (!getToken()) return;

    const socket = connectSocket();
    socket.emit("join_room", roomId);

    const onNewMessage = (m: ChatMessage) => {
      setMessages(prev => {
        // Exact duplicate → skip
        if (prev.some(p => p.id === m.id)) return prev;

        // Replace a matching optimistic message with the confirmed real one.
        // Matching criteria: same senderId + same content + optimistic ID prefix.
        const optIdx = prev.findIndex(
          p =>
            p.id.startsWith(OPT_PREFIX) &&
            p.senderId === m.senderId &&
            p.content  === m.content
        );
        if (optIdx !== -1) {
          const next = [...prev];
          next[optIdx] = m; // swap optimistic → real
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
  }, [roomId]);  // userId is synchronous and never changes — no need in deps

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ── Auto-send from query param ───────────────────────────────────────────
  useEffect(() => {
    if (autoMessage && !loading && !sentAuto.current) {
      sentAuto.current = true;
      handleSend(autoMessage);
    }
  }, [autoMessage, loading]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async (text?: string) => {
    const content = (text ?? msg).trim();
    if (!content || sending) return;
    setSending(true);
    if (!text) setMsg("");

    // ── Optimistic update ──────────────────────────────────────────────────
    // Add the message immediately with the correct senderId so it appears on
    // the right side before the socket confirmation arrives.
    // Uses userId from useChatUserId (JWT payload.sub) — always correct.
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
      // connectSocket() checks if the token changed and reconnects if needed,
      // ensuring the server's client.data.userId is always up to date.
      connectSocket().emit("send_message", { roomId, content, type: "text" });
    } catch {}

    setSending(false);
  };

  // ── Typing indicator ─────────────────────────────────────────────────────
  const handleTyping = () => {
    const s = connectSocket();
    s.emit("typing", { roomId, isTyping: true });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => s.emit("typing", { roomId, isTyping: false }),
      1500
    );
  };

  // Resolve the OTHER participant (never the current user)
  const other = room?.participants?.find(p => p.id !== userId);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .chatd-wrap{display:flex;min-height:100vh;background:#f8fafc}
        .chatd-main{flex:1;margin-left:240px;display:flex;flex-direction:column;max-height:100vh}
        .chatd-header{
          flex-shrink:0;display:flex;align-items:center;gap:14px;
          padding:0 24px;height:65px;
          background:#ffffff;border-bottom:1px solid #eef1f5;
        }
        .chatd-msgs{
          flex:1;padding:20px 24px;
          display:flex;flex-direction:column;gap:10px;
          overflow-y:auto;scroll-behavior:smooth;
        }
        .chatd-msgs::-webkit-scrollbar{width:4px}
        .chatd-msgs::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:4px}
        .chatd-input-area{
          flex-shrink:0;display:flex;align-items:center;gap:10px;
          padding:14px 24px;background:#ffffff;border-top:1px solid #eef1f5;
        }
        /* Own message: right side, blue */
        .msg-me{
          max-width:68%;padding:10px 14px;border-radius:14px;
          font-size:14px;line-height:1.55;word-break:break-word;
          background:#2563eb;color:white;
          align-self:flex-end;border-bottom-right-radius:4px;
        }
        /* Other's message: left side, light gray (contraste reforçado, estilo Insta) */
        .msg-other{
          max-width:68%;padding:10px 14px;border-radius:14px;
          font-size:14px;line-height:1.55;word-break:break-word;
          background:#e4e9f0;color:#1e293b;
          align-self:flex-start;border-bottom-left-radius:4px;
        }
        /* Optimistic: slightly translucent until confirmed */
        .msg-me-opt{ opacity:0.75; }
        .msg-time{font-size:10px;opacity:0.55;margin-top:4px}
        .blocked-msg{
          background:#fef2f2;border:1px solid #fecaca;
          border-radius:10px;padding:8px 12px;
          display:flex;align-items:center;gap:8px;
          align-self:flex-start;max-width:80%;
        }
        .c-input{
          flex:1;padding:12px 16px;border-radius:12px;
          background:#f8fafc;border:1.5px solid #e2e8f0;
          color:#0f172a;font-size:14px;outline:none;
          font-family:inherit;transition:border 0.2s, background 0.2s;
        }
        .c-input:focus{border-color:#2563eb; background:#fff}
        .c-input::placeholder{color:#94a3b8}
        .c-send{
          flex-shrink:0;width:42px;height:42px;border-radius:12px;
          background:#2563eb;border:none;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          transition:opacity 0.2s;
        }
        .c-send:disabled{opacity:0.5;cursor:not-allowed}
        .typing-dot{width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:tdot 1.2s infinite}
        .sk{background:#e2e8f0;border-radius:8px;animation:sk 1.5s infinite}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes tdot{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:1024px){
          .chatd-main{margin-left:0}
          .chatd-header{padding-left:72px}
        }
        @media(max-width:640px){
          .chatd-msgs{padding:12px 14px}
          .chatd-input-area{padding:10px 14px}
          .msg-me,.msg-other{max-width:84%}
        }
      `}</style>

      <div className="chatd-wrap">
        <Sidebar/>
        <div className="chatd-main">

          {/* Header */}
          <div className="chatd-header">
            <button
              onClick={() => router.back()}
              style={{ background:"none",border:"none",cursor:"pointer",color:"#64748b",display:"flex",padding:4 }}
            >
              <ArrowLeft size={20}/>
            </button>

            {loading
              ? <div className="sk" style={{ width:40,height:40,borderRadius:"50%",flexShrink:0 }}/>
              : (
                <div style={{
                  width:40,height:40,borderRadius:"50%",background:"#eff6ff",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:16,fontWeight:700,color:"#2563eb",flexShrink:0,overflow:"hidden",
                }}>
                  {other?.avatarUrl
                    ? <img src={other.avatarUrl} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""/>
                    : other?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
              )
            }

            <div style={{ flex:1,minWidth:0 }}>
              {loading
                ? <div className="sk" style={{ width:120,height:14,marginBottom:4 }}/>
                : <p style={{ fontSize:15,fontWeight:700,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                    {other?.fullName ?? "—"}
                  </p>
              }
              <p style={{ fontSize:11,color:"#94a3b8",marginTop:2 }}>Prestador</p>
            </div>

            <div style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"6px 12px",borderRadius:8,
              background:"#f0faf6",border:"1px solid #bbf7e8",flexShrink:0,
            }}>
              <Shield size={13} style={{ color:"#1D9E75" }}/>
              <span style={{ fontSize:11,color:"#0f766e",fontWeight:600 }}>Protegida</span>
            </div>
          </div>

          {/* Messages */}
          <div className="chatd-msgs">
            {loading ? (
              [1,2,3].map(i => (
                <div key={i} className="sk" style={{
                  height:40,borderRadius:14,
                  width: i%2===0 ? "55%" : "42%",
                  alignSelf: i%2===0 ? "flex-start" : "flex-end",
                }}/>
              ))
            ) : messages.length === 0 ? (
              <div style={{
                display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",flex:1,gap:14,textAlign:"center",
              }}>
                <div style={{
                  width:56,height:56,borderRadius:16,background:"#ffffff",
                  border:"1px solid #eef1f5",display:"flex",alignItems:"center",
                  justifyContent:"center",
                }}>
                  <MessageCircle size={26} style={{ color:"#94a3b8" }}/>
                </div>
                <p style={{ fontSize:14,fontWeight:600,color:"#334155" }}>
                  {other ? `Inicia uma conversa com ${other.fullName}` : "Inicia a conversa"}
                </p>
                <p style={{ fontSize:12,color:"#64748b",lineHeight:1.6 }}>
                  Escreve uma mensagem para começar.
                </p>
              </div>
            ) : messages.map(m => {
              // ═══════════════════════════════════════════════════════════════
              // THE ONLY OWNERSHIP CHECK IN THE ENTIRE CODEBASE:
              //   isMe = message.senderId === currentUser.id
              // Never depends on room.clientId, room.providerId, or role.
              // ═══════════════════════════════════════════════════════════════
              const isMe       = userId !== null && m.senderId === userId;
              const isOptimistic = m.id.startsWith(OPT_PREFIX);

              if (m.isBlocked) return (
                <div className="blocked-msg" key={m.id}>
                  <AlertTriangle size={14} style={{ color:"#dc2626",flexShrink:0 }}/>
                  <div>
                    <p style={{ fontSize:12,fontWeight:600,color:"#dc2626" }}>Mensagem bloqueada</p>
                    <p style={{ fontSize:11,color:"#b91c1c" }}>Partilha de contactos externos não é permitida.</p>
                  </div>
                </div>
              );

              return (
                <div key={m.id} style={{
                  display:"flex",flexDirection:"column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                }}>
                  <div className={`${isMe ? "msg-me" : "msg-other"}${isOptimistic ? " msg-me-opt" : ""}`}>
                    {m.content}
                  </div>
                  <span className="msg-time" style={{ alignSelf: isMe ? "flex-end" : "flex-start" }}>
                    {isOptimistic ? "A enviar..." : formatTime(m.createdAt)}
                  </span>
                </div>
              );
            })}

            {typing && (
              <div style={{
                display:"flex",alignItems:"center",gap:6,
                padding:"8px 14px",background:"#f1f5f9",
                borderRadius:14,alignSelf:"flex-start",borderBottomLeftRadius:4,
              }}>
                {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay:`${i*0.2}s` }}/>)}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div className="chatd-input-area">
            <input
              className="c-input"
              placeholder={other ? `Mensagem para ${other.fullName}...` : "Escreve uma mensagem..."}
              value={msg}
              onChange={e => { setMsg(e.target.value); handleTyping(); }}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            />
            <button className="c-send" disabled={!msg.trim() || sending} onClick={() => handleSend()}>
              {sending
                ? <Loader2 size={16} color="white" style={{ animation:"spin 1s linear infinite" }}/>
                : <Send size={16} color="white"/>
              }
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ChatDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f8fafc",gap:12 }}>
        <Loader2 size={24} style={{ color:"#2563eb",animation:"spin 1s linear infinite" }}/>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ChatInner/>
    </Suspense>
  );
}
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Send, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { chatApi, ChatMessage, ChatRoom } from "@/lib/chat.api";
import { getToken } from "@/lib/auth.api";
import { connectSocket } from "@/lib/socket";
import { useChatUserId } from "@/hooks/useChatUserId";

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

const OPT_PREFIX = "__opt__";

export default function ProviderChatDetailPage() {
  const router           = useRouter();
  const { id: roomId }   = useParams() as { id: string };

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

  // Socket: connectSocket() detects token changes and reconnects automatically
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
  }, [roomId]);  // userId never changes with synchronous hook

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async () => {
    const content = msg.trim();
    if (!content || sending) return;
    setSending(true);
    setMsg("");

    // Optimistic update — appears immediately on the correct side
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
      // connectSocket() ensures the server has the correct user identity
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
        .pc-wrap{
          display:flex;flex-direction:column;
          height:calc(100vh - 64px);
          background:#0d1117;overflow:hidden;
        }
        .pc-header{
          flex-shrink:0;display:flex;align-items:center;gap:14px;
          padding:0 24px;height:65px;
          background:#080e1a;border-bottom:1px solid #1a2535;
        }
        .pc-msgs{
          flex:1;display:flex;flex-direction:column;gap:10px;
          padding:20px 24px;overflow-y:auto;scroll-behavior:smooth;
        }
        .pc-msgs::-webkit-scrollbar{width:4px}
        .pc-msgs::-webkit-scrollbar-thumb{background:#1a2535;border-radius:4px}
        .pc-input-area{
          flex-shrink:0;display:flex;align-items:center;gap:10px;
          padding:14px 24px;background:#080e1a;border-top:1px solid #1a2535;
        }
        /* Provider's own messages: right, amber */
        .pc-bubble-me{
          max-width:68%;padding:10px 14px;border-radius:14px;
          font-size:14px;line-height:1.55;word-break:break-word;
          background:#EF9F27;color:#0d1117;
          align-self:flex-end;border-bottom-right-radius:4px;
        }
        /* Client's messages: left, dark */
        .pc-bubble-other{
          max-width:68%;padding:10px 14px;border-radius:14px;
          font-size:14px;line-height:1.55;word-break:break-word;
          background:#131b27;color:#c0d0e0;
          align-self:flex-start;border-bottom-left-radius:4px;
        }
        /* Optimistic: slightly translucent */
        .pc-bubble-me-opt{ opacity:0.75; }
        .pc-time{font-size:10px;opacity:0.55;margin-top:4px}
        .pc-blocked{
          background:#E24B4A15;border:1px solid #E24B4A30;
          border-radius:10px;padding:8px 12px;
          display:flex;align-items:center;gap:8px;
          align-self:flex-start;max-width:80%;
        }
        .pc-text-input{
          flex:1;padding:12px 16px;border-radius:12px;
          background:#131b27;border:1px solid #1a2535;
          color:#e2e8f0;font-size:14px;outline:none;
          font-family:inherit;transition:border 0.2s;
        }
        .pc-text-input:focus{border-color:#EF9F27}
        .pc-text-input::placeholder{color:#4a5a6a}
        .pc-send{
          flex-shrink:0;width:42px;height:42px;border-radius:12px;
          background:#EF9F27;border:none;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          transition:opacity 0.2s;
        }
        .pc-send:disabled{opacity:0.5;cursor:not-allowed}
        .typing-dot{width:6px;height:6px;border-radius:50%;background:#4a6a6a;animation:tdot 1.2s infinite}
        .sk{background:#1a2535;border-radius:8px;animation:sk 1.5s infinite}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes tdot{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:1024px){.pc-header{padding-left:72px}}
        @media(max-width:640px){
          .pc-msgs{padding:12px 14px}
          .pc-input-area{padding:10px 14px}
          .pc-bubble-me,.pc-bubble-other{max-width:84%}
        }
      `}</style>

      <div className="pc-wrap">

        {/* Header */}
        <div className="pc-header">
          <button
            onClick={() => router.back()}
            style={{ background:"none",border:"none",cursor:"pointer",color:"#6a7a8a",display:"flex",padding:4 }}
          >
            <ArrowLeft size={20}/>
          </button>

          {loading
            ? <div className="sk" style={{ width:40,height:40,borderRadius:"50%",flexShrink:0 }}/>
            : (
              <div style={{
                width:40,height:40,borderRadius:"50%",background:"#2a1e08",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:16,fontWeight:700,color:"#EF9F27",flexShrink:0,
              }}>
                {other?.fullName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )
          }

          <div style={{ flex:1,minWidth:0 }}>
            {loading
              ? <div className="sk" style={{ width:120,height:14,marginBottom:4 }}/>
              : <p style={{ fontSize:15,fontWeight:700,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                  {other?.fullName ?? "—"}
                </p>
            }
            <p style={{ fontSize:11,color:"#4a6a6a",marginTop:2 }}>Cliente</p>
          </div>

          <div style={{
            display:"flex",alignItems:"center",gap:6,
            padding:"6px 12px",borderRadius:8,
            background:"#2a1e08",border:"1px solid #EF9F2725",flexShrink:0,
          }}>
            <Shield size={13} style={{ color:"#EF9F27" }}/>
            <span style={{ fontSize:11,color:"#EF9F27",fontWeight:600 }}>Protegida</span>
          </div>
        </div>

        {/* Messages */}
        <div className="pc-msgs">
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
                width:56,height:56,borderRadius:16,background:"#131b27",
                border:"1px solid #1a2535",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:26,
              }}>💬</div>
              <p style={{ fontSize:14,fontWeight:600,color:"#c0d0e0" }}>
                {other ? `Inicia uma conversa com ${other.fullName}` : "Inicia a conversa"}
              </p>
              <p style={{ fontSize:12,color:"#4a6a6a",lineHeight:1.6 }}>
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
              <div className="pc-blocked" key={m.id}>
                <AlertTriangle size={14} style={{ color:"#E24B4A",flexShrink:0 }}/>
                <div>
                  <p style={{ fontSize:12,fontWeight:600,color:"#E24B4A" }}>Mensagem bloqueada</p>
                  <p style={{ fontSize:11,color:"#6a3a3a" }}>Partilha de contactos externos não é permitida.</p>
                </div>
              </div>
            );

            return (
              <div key={m.id} style={{
                display:"flex",flexDirection:"column",
                alignItems: isMe ? "flex-end" : "flex-start",
              }}>
                <div className={`${isMe ? "pc-bubble-me" : "pc-bubble-other"}${isOptimistic ? " pc-bubble-me-opt" : ""}`}>
                  {m.content}
                </div>
                <span className="pc-time" style={{ alignSelf: isMe ? "flex-end" : "flex-start" }}>
                  {isOptimistic ? "A enviar..." : formatTime(m.createdAt)}
                </span>
              </div>
            );
          })}

          {typing && (
            <div style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"8px 14px",background:"#131b27",
              borderRadius:14,alignSelf:"flex-start",borderBottomLeftRadius:4,
            }}>
              {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ animationDelay:`${i*0.2}s` }}/>)}
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="pc-input-area">
          <input
            className="pc-text-input"
            placeholder={other ? `Mensagem para ${other.fullName}...` : "Escreve uma mensagem..."}
            value={msg}
            onChange={e => { setMsg(e.target.value); handleTyping(); }}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <button className="pc-send" disabled={!msg.trim() || sending} onClick={handleSend}>
            {sending
              ? <Loader2 size={16} color="#0d1117" style={{ animation:"spin 1s linear infinite" }}/>
              : <Send size={16} color="#0d1117"/>
            }
          </button>
        </div>

      </div>
    </>
  );
}
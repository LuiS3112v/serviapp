"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search, Loader2 } from "lucide-react";
import { chatApi, ChatRoom } from "@/lib/chat.api";
import { getToken, getSession } from "@/lib/auth.api";

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return new Date(date).toLocaleDateString("pt-PT");
}

export default function ProviderChatPage() {
  const router = useRouter();
  const [rooms, setRooms]   = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]   = useState("");
  const user = getSession();

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    chatApi.getRooms()
      .then(setRooms)
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rooms.filter(r => {
    const other = user?.id === r.clientId ? r.provider : r.client;
    return !query || other?.fullName?.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <>
      <style>{`
        *,*::before,*::after { box-sizing: border-box }

        .pc-inner {
          padding: 28px 32px 40px;
          display: flex; flex-direction: column; gap: 16px;
          max-width: 680px;
        }

        /* ── Room card ── */
        .pc-room-card {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px;
          background: #ffffff; border: 1px solid #eef1f5;
          border-radius: 14px; cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
          -webkit-tap-highlight-color: transparent;
        }
        /* hover âmbar — distinto do hover azul do cliente */
        .pc-room-card:hover { border-color: #EF9F27; box-shadow: 0 4px 14px rgba(239,159,39,0.10); }
        .pc-room-card:active { background: #fffbf3; }

        /* ── Search ── */
        .pc-search {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 12px;
          background: #ffffff; border: 1px solid #eef1f5;
          transition: border-color 0.15s;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
        }
        .pc-search:focus-within { border-color: #EF9F27; }
        .pc-search-input {
          flex: 1; min-width: 0;
          background: none; border: none; outline: none;
          font-size: max(14px, 16px); color: #0f172a; font-family: inherit;
        }
        .pc-search-input::placeholder { color: #94a3b8; }
        @supports (-webkit-touch-callout: none) {
          .pc-search-input { font-size: 16px; }
        }

        /* ── Skeleton ── */
        .pc-skeleton { background: #e2e8f0; border-radius: 8px; animation: pcsk 1.5s infinite; }
        @keyframes pcsk { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }

        @media (max-width: 768px) { .pc-inner { padding: 24px 20px 32px; gap: 12px; } }
        @media (max-width: 640px) { .pc-inner { padding: 72px 14px 24px; gap: 10px; } }
        @media (max-width: 360px) { .pc-inner { padding: 68px 10px 20px; } }
      `}</style>

      <div className="pc-inner">

        {/* Header */}
        <div>
          <h1 style={{ fontSize:"clamp(18px,4vw,22px)", fontWeight:700, color:"#0f172a", marginBottom:4 }}>
            Mensagens
          </h1>
          <p style={{ fontSize:13, color:"#64748b" }}>
            {loading ? "A carregar..." : `${rooms.length} conversa${rooms.length!==1?"s":""}`}
          </p>
        </div>

        {/* Search */}
        <div className="pc-search">
          <Search size={15} style={{ color:"#94a3b8", flexShrink:0 }}/>
          <input
            className="pc-search-input"
            placeholder="Pesquisar conversa..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          />
        </div>

        {/* Content */}
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} style={{ display:"flex", gap:14, padding:14, background:"#ffffff", border:"1px solid #eef1f5", borderRadius:14 }}>
              <div className="pc-skeleton" style={{ width:46, height:46, borderRadius:"50%", flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div className="pc-skeleton" style={{ width:"50%", height:13, marginBottom:8 }}/>
                <div className="pc-skeleton" style={{ width:"75%", height:11 }}/>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div style={{
            display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", padding:"80px 20px", gap:16, textAlign:"center",
            background:"#ffffff", border:"1px solid #eef1f5", borderRadius:16,
          }}>
            <div style={{
              width:64, height:64, borderRadius:20,
              background:"#f8fafc", border:"1px solid #eef1f5",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <MessageCircle size={28} style={{ color:"#cbd5e1" }}/>
            </div>
            <p style={{ fontSize:16, fontWeight:700, color:"#334155" }}>Sem mensagens ainda</p>
            <p style={{ fontSize:13, color:"#64748b", lineHeight:1.6, maxWidth:300 }}>
              {query
                ? "Nenhuma conversa encontrada."
                : "As conversas com os teus clientes vão aparecer aqui."}
            </p>
          </div>
        ) : (
          filtered.map(room => {
            const other = user?.id === room.providerId ? room.client : room.provider;
            const unread = (user?.id === room.providerId ? room.providerUnread : room.clientUnread) ?? 0;
            const lastMessageText = typeof room.lastMessage === "string"
              ? room.lastMessage
              : room.lastMessage?.content ?? "Conversa iniciada";
            const initials = other?.fullName?.charAt(0)?.toUpperCase() ?? "?";

            return (
              <div
                key={room.id}
                className="pc-room-card"
                onClick={() => router.push(`/provider/chat/${room.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && router.push(`/provider/chat/${room.id}`)}
                aria-label={`Conversa com ${other?.fullName ?? "utilizador"}`}
              >
                {/* Avatar — fundo âmbar suave, inicial âmbar */}
                <div style={{
                  width:46, height:46, borderRadius:"50%",
                  background:"#fef3e2", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:18, fontWeight:700,
                  color:"#b96f0f", flexShrink:0, overflow:"hidden",
                }}>
                  {other?.avatarUrl
                    ? <img src={other.avatarUrl} style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }} alt=""/>
                    : initials}
                </div>

                {/* Text */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
                    <p style={{
                      fontSize:14, fontWeight:unread>0?700:500, color:"#0f172a",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      flex:1, minWidth:0, marginRight:8,
                    }}>
                      {other?.fullName ?? "—"}
                    </p>
                    <span style={{ fontSize:11, color:"#94a3b8", flexShrink:0, whiteSpace:"nowrap" }}>
                      {room.lastMessageAt ? timeAgo(room.lastMessageAt) : ""}
                    </span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                    <p style={{
                      fontSize:13, color:"#64748b",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1,
                    }}>
                      {lastMessageText}
                    </p>
                    {unread > 0 && (
                      <span style={{
                        background:"#EF9F27", color:"#ffffff",
                        fontSize:10, fontWeight:700, padding:"2px 7px",
                        borderRadius:99, flexShrink:0,
                      }}>
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

      </div>
    </>
  );
}
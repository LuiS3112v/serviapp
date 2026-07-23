"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
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

export default function ChatPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
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
        /* ── Reset / Base ── */
        *,*::before,*::after{box-sizing:border-box}

        /* ── Layout shell ── */
        .chat-wrap{
          display:flex;
          min-height:100vh;
          min-height:100dvh;           /* dynamic viewport height – iOS Safari */
          background:#f8fafc;
        }

        /* ── Main content area ── */
        .chat-main{
          flex:1;
          display:flex;
          flex-direction:column;
          /* Desktop: sidebar is 240px fixed */
          margin-left:240px;
          min-width:0;                 /* prevents flex blowout */
          overflow-x:hidden;
        }

        /* ── Inner scroll container ── */
        .chat-inner{
          flex:1;
          padding:28px 32px 40px;
          width:100%;
          max-width:680px;
          display:flex;
          flex-direction:column;
          gap:16px;
        }

        /* ── Room card ── */
        .room-card{
          display:flex;
          align-items:center;
          gap:14px;
          padding:14px 16px;
          background:#ffffff;
          border:1px solid #eef1f5;
          border-radius:14px;
          cursor:pointer;
          transition:border-color 0.15s, background 0.15s, box-shadow 0.15s;
          -webkit-tap-highlight-color:transparent; /* remove iOS tap flash */
          touch-action:manipulation;
          box-shadow:0 1px 3px rgba(15,23,42,0.03);
        }
        .room-card:hover{border-color:#2563eb; box-shadow:0 4px 14px rgba(15,23,42,0.06)}
        .room-card:active{background:#f8fafc}  /* tactile feedback on mobile */

        /* ── Skeleton ── */
        .skeleton{
          background:#e2e8f0;
          border-radius:8px;
          animation:sk 1.5s infinite;
        }
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}

        /* ── Avatar image ── */
        .avatar-img{
          width:100%;
          height:100%;
          border-radius:50%;
          object-fit:cover;
        }

        /* ── Search input ── */
        .search-box{
          display:flex;
          align-items:center;
          gap:10px;
          padding:12px 16px;
          border-radius:12px;
          background:#ffffff;
          border:1px solid #eef1f5;
          transition:border-color 0.15s;
          box-shadow:0 1px 3px rgba(15,23,42,0.03);
        }
        .search-box:focus-within{border-color:#2563eb}
        .search-input{
          flex:1;
          min-width:0;
          background:none;
          border:none;
          outline:none;
          font-size:14px;
          color:#0f172a;
          font-family:inherit;
          /* Prevent iOS auto-zoom (font must be ≥16px on focus, or set directly) */
          font-size:max(14px, 16px);
        }
        /* Revert visual to 14px while keeping the iOS no-zoom behaviour */
        @supports (-webkit-touch-callout: none){
          .search-input{font-size:16px}
        }

        /* ────────────────────────────────────
           RESPONSIVE BREAKPOINTS
        ──────────────────────────────────── */

        /* Tablet landscape / small desktop (≤1024px) – sidebar collapses */
        @media(max-width:1024px){
          .chat-main{margin-left:0}
        }

        /* Tablet portrait (≤768px) */
        @media(max-width:768px){
          .chat-inner{
            padding:24px 20px 32px;
            gap:12px;
          }
        }

        /* Mobile (≤640px) – Navbar is fixed at top */
        @media(max-width:640px){
          .chat-inner{
            padding:72px 14px 24px; /* top clears fixed Navbar */
            gap:10px;
          }
          .room-card{
            padding:12px 12px;
            gap:12px;
            border-radius:12px;
          }
        }

        /* Very small screens (≤360px) */
        @media(max-width:360px){
          .chat-inner{padding:68px 10px 20px}
          .room-card{padding:10px}
        }

        /* ── Landscape on short phones (height ≤ 500px) ── */
        @media(max-height:500px) and (orientation:landscape){
          .chat-inner{padding-top:60px}
        }

        /* ── High-DPI / Retina: crisper borders ── */
        @media(-webkit-min-device-pixel-ratio:2),(min-resolution:192dpi){
          .room-card{border-width:0.5px}
          .search-box{border-width:0.5px}
        }
      `}</style>

      <div className="chat-wrap">
        <Sidebar/>
        <div className="chat-main">
          <Navbar/>
          <div className="chat-inner">

            {/* ── Header ── */}
            <div>
              <h1 style={{fontSize:"clamp(18px,4vw,22px)",fontWeight:700,color:"#0f172a",marginBottom:4}}>
                Mensagens
              </h1>
              <p style={{fontSize:13,color:"#64748b"}}>
                {loading ? "A carregar..." : `${rooms.length} conversa${rooms.length!==1?"s":""}`}
              </p>
            </div>

            {/* ── Search ── */}
            <div className="search-box">
              <Search size={15} style={{color:"#94a3b8",flexShrink:0}}/>
              <input
                className="search-input"
                placeholder="Pesquisar conversa..."
                value={query}
                onChange={e=>setQuery(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>

            {/* ── Content ── */}
            {loading ? (
              [1,2,3].map(i=>(
                <div key={i} style={{display:"flex",gap:14,padding:14,background:"#ffffff",border:"1px solid #eef1f5",borderRadius:14}}>
                  <div className="skeleton" style={{width:46,height:46,borderRadius:"50%",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="skeleton" style={{width:"50%",height:13,marginBottom:8}}/>
                    <div className="skeleton" style={{width:"75%",height:11}}/>
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                padding:"80px 20px",gap:16,textAlign:"center"
              }}>
                <div style={{
                  width:64,height:64,borderRadius:20,background:"#ffffff",
                  border:"1px solid #eef1f5",display:"flex",alignItems:"center",justifyContent:"center"
                }}>
                  <MessageCircle size={28} style={{color:"#cbd5e1"}}/>
                </div>
                <p style={{fontSize:16,fontWeight:700,color:"#334155"}}>Sem mensagens ainda</p>
                <p style={{fontSize:13,color:"#64748b",lineHeight:1.6,maxWidth:320}}>
                  {query
                    ? "Nenhuma conversa encontrada."
                    : "As tuas conversas aparecem aqui quando iniciares um chat com um prestador."}
                </p>
              </div>
            ) : (
              filtered.map(room => {
                const other = user?.id === room.clientId ? room.provider : room.client;
                const unread = (user?.id === room.clientId ? room.clientUnread : room.providerUnread) ?? 0;
                const lastMessageText = typeof room.lastMessage === "string"
                  ? room.lastMessage
                  : room.lastMessage?.content ?? "Conversa iniciada";
                const initials = other?.fullName?.charAt(0)?.toUpperCase() ?? "?";

                return (
                  <div
                    key={room.id}
                    className="room-card"
                    onClick={() => router.push(`/chat/${room.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && router.push(`/chat/${room.id}`)}
                    aria-label={`Conversa com ${other?.fullName ?? "utilizador"}`}
                  >
                    {/* Avatar */}
                    <div style={{position:"relative",flexShrink:0}}>
                      <div style={{
                        width:46,height:46,borderRadius:"50%",
                        background:"#eff6ff",display:"flex",alignItems:"center",
                        justifyContent:"center",fontSize:18,fontWeight:700,color:"#2563eb",
                        overflow:"hidden"
                      }}>
                        {other?.avatarUrl
                          ? <img className="avatar-img" src={other.avatarUrl} alt={other.fullName ?? ""}/>
                          : initials}
                      </div>
                    </div>

                    {/* Text */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                        <p style={{
                          fontSize:14,fontWeight:unread>0?700:500,color:"#0f172a",
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                          flex:1,minWidth:0,marginRight:8
                        }}>
                          {other?.fullName ?? "—"}
                        </p>
                        <span style={{fontSize:11,color:"#94a3b8",flexShrink:0,whiteSpace:"nowrap"}}>
                          {room.lastMessageAt ? timeAgo(room.lastMessageAt) : ""}
                        </span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                        <p style={{
                          fontSize:13,color:"#64748b",
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                          flex:1,minWidth:0
                        }}>
                          {lastMessageText}
                        </p>
                        {unread > 0 && (
                          <span style={{
                            background:"#2563eb",color:"white",fontSize:10,fontWeight:700,
                            padding:"2px 7px",borderRadius:99,flexShrink:0
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
        </div>
      </div>
    </>
  );
}
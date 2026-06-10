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
        .chat-wrap{display:flex;min-height:100vh;background:#0d1117}
        .chat-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .chat-inner{flex:1;padding:28px 32px;max-width:680px;display:flex;flex-direction:column;gap:16px}
        .room-card{display:flex;align-items:center;gap:14px;padding:14px 16px;background:#131b27;border:1px solid #1a2535;border-radius:14px;cursor:pointer;transition:all 0.15s}
        .room-card:hover{border-color:#1D9E75}
        .skeleton{background:#1a2535;border-radius:8px;animation:sk 1.5s infinite}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}
        @media(max-width:1024px){.chat-main{margin-left:0}}
        @media(max-width:640px){.chat-inner{padding:70px 16px 20px}}
      `}</style>

      <div className="chat-wrap">
        <Sidebar/>
        <div className="chat-main">
          <Navbar/>
          <div className="chat-inner">
            <div>
              <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Mensagens</h1>
              <p style={{fontSize:13,color:"#4a6a6a"}}>
                {loading ? "A carregar..." : `${rooms.length} conversa${rooms.length!==1?"s":""}`}
              </p>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,background:"#131b27",border:"1px solid #1a2535"}}>
              <Search size={15} style={{color:"#4a7070"}}/>
              <input
                placeholder="Pesquisar conversa..."
                value={query}
                onChange={e=>setQuery(e.target.value)}
                style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"#8a9ab0",fontFamily:"inherit"}}
              />
            </div>

            {loading ? (
              [1,2,3].map(i=>(
                <div key={i} style={{display:"flex",gap:14,padding:14,background:"#131b27",border:"1px solid #1a2535",borderRadius:14}}>
                  <div className="skeleton" style={{width:46,height:46,borderRadius:"50%",flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div className="skeleton" style={{width:"50%",height:13,marginBottom:8}}/>
                    <div className="skeleton" style={{width:"75%",height:11}}/>
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 20px",gap:16,textAlign:"center"}}>
                <div style={{width:64,height:64,borderRadius:20,background:"#131b27",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <MessageCircle size={28} style={{color:"#2a3a4a"}}/>
                </div>
                <p style={{fontSize:16,fontWeight:700,color:"#c0d0e0"}}>Sem mensagens ainda</p>
                <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:320}}>
                  {query ? "Nenhuma conversa encontrada." : "As tuas conversas aparecem aqui quando iniciares um chat com um prestador."}
                </p>
              </div>
            ) : (
              filtered.map(room => {
                const other = user?.id === room.clientId ? room.provider : room.client;
                const unread = user?.id === room.clientId ? room.clientUnread : room.providerUnread;
                const initials = other?.fullName?.charAt(0)?.toUpperCase() ?? "?";
                return (
                  <div
                    key={room.id}
                    className="room-card"
                    onClick={() => router.push(`/chat/${room.id}`)}
                  >
                    <div style={{position:"relative",flexShrink:0}}>
                      <div style={{width:46,height:46,borderRadius:"50%",background:"#1a3a2a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#1D9E75"}}>
                        {other?.avatarUrl
                          ? <img src={other.avatarUrl} style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover"}} alt={other.fullName}/>
                          : initials}
                      </div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                        <p style={{fontSize:14,fontWeight:unread>0?700:500,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{other?.fullName ?? "—"}</p>
                        <span style={{fontSize:11,color:"#3a4a5a",flexShrink:0,marginLeft:8}}>{room.lastMessageAt ? timeAgo(room.lastMessageAt) : ""}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <p style={{fontSize:13,color:"#4a6a6a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{room.lastMessage ?? "Conversa iniciada"}</p>
                        {unread > 0 && (
                          <span style={{marginLeft:8,background:"#1D9E75",color:"white",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99,flexShrink:0}}>{unread}</span>
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
"use client";
import { Search, MessageCircle } from "lucide-react";

export default function ProviderChatPage() {
  return (
    <>
      <style>{`
        .pc-inner{padding:28px 32px;display:flex;flex-direction:column;gap:16px;max-width:680px}
        .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;text-align:center;background:#131b27;border:1px solid #1a2535;border-radius:16px}
        @media(max-width:640px){.pc-inner{padding:16px}}
      `}</style>
      <div className="pc-inner">
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Mensagens</h1>
          <p style={{fontSize:13,color:"#4a6a6a"}}>Conversa com os teus clientes</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,background:"#131b27",border:"1px solid #1a2535"}}>
          <Search size={15} style={{color:"#4a7070"}}/>
          <input placeholder="Pesquisar conversa..." style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"#8a9ab0",fontFamily:"inherit"}}/>
        </div>
        <div className="empty">
          <div style={{width:64,height:64,borderRadius:20,background:"#0d1117",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <MessageCircle size={28} style={{color:"#2a3a4a"}}/>
          </div>
          <p style={{fontSize:16,fontWeight:700,color:"#c0d0e0"}}>Sem mensagens ainda</p>
          <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:300}}>As conversas com os teus clientes vão aparecer aqui.</p>
        </div>
      </div>
    </>
  );
}
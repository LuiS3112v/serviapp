"use client";
import { Bell } from "lucide-react";

export default function ProviderNotificationsPage() {
  return (
    <>
      <style>{`
        .pn-inner{padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:680px}
        .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;text-align:center}
        @media(max-width:640px){.pn-inner{padding:16px}}
      `}</style>
      <div className="pn-inner">
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Notificações</h1>
          <p style={{fontSize:13,color:"#4a6a6a"}}>As tuas notificações vão aparecer aqui</p>
        </div>
        <div className="empty">
          <div style={{width:64,height:64,borderRadius:20,background:"#131b27",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Bell size={28} style={{color:"#2a3a4a"}}/>
          </div>
          <p style={{fontSize:16,fontWeight:700,color:"#c0d0e0"}}>Sem notificações</p>
          <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:300}}>Mensagens, pedidos e actualizações vão aparecer aqui.</p>
        </div>
      </div>
    </>
  );
}
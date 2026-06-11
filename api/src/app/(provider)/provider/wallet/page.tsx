"use client";
import { Wallet, ArrowUpRight, Plus, Shield } from "lucide-react";

export default function ProviderWalletPage() {
  return (
    <>
      <style>{`
        .pw-inner{padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:800px}
        .w-card{border-radius:20px;padding:28px;background:#1a1205;border:1px solid #EF9F2730}
        .w-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .w-stat{background:#131b27;border:1px solid #1a2535;border-radius:14px;padding:16px}
        .w-btn-row{display:flex;gap:12px;flex-wrap:wrap}
        .w-btn{display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;border:none;font-family:inherit}
        .empty-tx{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:12px;text-align:center}
        @media(max-width:640px){.pw-inner{padding:16px}.w-grid{grid-template-columns:1fr}.w-btn-row{flex-direction:column}}
      `}</style>
      <div className="pw-inner">
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Wallet</h1>
          <p style={{fontSize:13,color:"#4a6a6a"}}>Gere os teus pagamentos e levantamentos</p>
        </div>
        <div className="w-card">
          <p style={{fontSize:12,fontWeight:600,color:"#EF9F27",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Saldo disponível</p>
          <p style={{fontSize:36,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>0 Kz</p>
          <p style={{fontSize:13,color:"#6a5a3a",marginBottom:20}}>O teu saldo vai aparecer aqui após o primeiro serviço concluído</p>
          <div className="w-btn-row">
            <button className="w-btn" style={{background:"#EF9F27",color:"#0d1117"}}>
              <ArrowUpRight size={16}/> Levantar
            </button>
            <button className="w-btn" style={{background:"#131b27",color:"#8a9ab0",border:"1px solid #1a2535"}}>
              <Plus size={16}/> Adicionar saldo
            </button>
          </div>
        </div>
        <div className="w-grid">
          <div className="w-stat">
            <p style={{fontSize:12,color:"#4a6a6a",marginBottom:6}}>Saldo retido</p>
            <p style={{fontSize:22,fontWeight:700,color:"#EF9F27"}}>0 Kz</p>
            <p style={{fontSize:11,color:"#4a5a6a",marginTop:4}}>Aguarda confirmação</p>
          </div>
          <div className="w-stat">
            <p style={{fontSize:12,color:"#4a6a6a",marginBottom:6}}>Total recebido</p>
            <p style={{fontSize:22,fontWeight:700,color:"#1D9E75"}}>0 Kz</p>
            <p style={{fontSize:11,color:"#4a5a6a",marginTop:4}}>Este mês</p>
          </div>
        </div>
        <div style={{borderRadius:16,padding:"20px 24px",background:"#131b27",border:"1px solid #1a2535"}}>
          <h2 style={{fontSize:16,fontWeight:700,color:"#c0d0e0",marginBottom:16}}>Transacções recentes</h2>
          <div className="empty-tx">
            <div style={{width:52,height:52,borderRadius:16,background:"#0d1117",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Wallet size={24} style={{color:"#2a3a4a"}}/>
            </div>
            <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0"}}>Sem transacções</p>
            <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:280}}>As tuas transacções vão aparecer aqui após o primeiro pagamento.</p>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:14,background:"#0b2a2a",border:"1px solid #1d9e7525"}}>
          <Shield size={18} style={{color:"#1D9E75",flexShrink:0}}/>
          <p style={{fontSize:13,color:"#4a7a7a"}}>Pagamentos protegidos com escrow — o valor só é libertado após confirmação do serviço.</p>
        </div>
      </div>
    </>
  );
}
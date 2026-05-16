"use client";

import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { User, Mail, Phone, MapPin, Edit, Shield, Star } from "lucide-react";

export default function ClientProfilePage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        .prof-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .prof-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .prof-inner { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; max-width: 700px; }
        .prof-card { background: #131b27; border: 1px solid #1a2535; border-radius: 20px; padding: 24px; }
        .info-row { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid #1a2535; }
        .info-row:last-child { border-bottom: none; }
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .stat-card { background: #0d1117; border: 1px solid #1a2535; border-radius: 12px; padding: 16px; text-align: center; }
        .edit-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; border: 1px solid #1a2535; background: #131b27; color: #8a9ab0; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .edit-btn:hover { border-color: #1D9E75; color: #1D9E75; }
        .verify-btn { padding: 8px 14px; border-radius: 10px; background: #EF9F2720; color: #EF9F27; border: 1px solid #EF9F2740; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; margin-left: auto; font-family: inherit; transition: all 0.15s; }
        .verify-btn:hover { background: #EF9F27; color: #0d1117; }
        @media (max-width: 1024px) { .prof-main { margin-left: 0; } }
        @media (max-width: 640px) { .prof-inner { padding: 16px; } .stat-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <div className="prof-wrap">
        <Sidebar />
        <div className="prof-main">
          <Navbar />
          <div className="prof-inner">

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>O meu perfil</h1>
                <p style={{ fontSize:13, color:"#4a6a6a" }}>Gere as tuas informações pessoais</p>
              </div>
              <button className="edit-btn">
                <Edit size={14} /> Editar
              </button>
            </div>

            <div className="prof-card">
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, paddingBottom:24, borderBottom:"1px solid #1a2535" }}>
                <div style={{ width:72, height:72, borderRadius:"50%", background:"#1a3a2a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <User size={32} style={{ color:"#1D9E75" }} />
                </div>
                <div>
                  <p style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>O teu nome</p>
                  <span style={{ fontSize:12, fontWeight:600, padding:"3px 10px", borderRadius:99, background:"#1d9e7520", color:"#1D9E75", border:"1px solid #1d9e7540" }}>Cliente</span>
                </div>
              </div>

              {[
                { icon:Mail, label:"Email", value:"O teu email", color:"#1D9E75" },
                { icon:Phone, label:"Telemóvel", value:"+244 —", color:"#378ADD" },
                { icon:MapPin, label:"Localização", value:"Luanda, Angola", color:"#EF9F27" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div className="info-row" key={i}>
                    <div style={{ width:38, height:38, borderRadius:10, background:`${item.color}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon size={16} style={{ color:item.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize:11, color:"#4a5a6a", marginBottom:2 }}>{item.label}</p>
                      <p style={{ fontSize:14, color:"#c0d0e0" }}>{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="stat-grid">
              {[
                { label:"Serviços", value:"0", color:"#1D9E75" },
                { label:"Avaliações dadas", value:"0", color:"#EF9F27" },
                { label:"Total gasto", value:"0 Kz", color:"#378ADD" },
              ].map((s, i) => (
                <div className="stat-card" key={i}>
                  <p style={{ fontSize:22, fontWeight:700, color:s.color, marginBottom:4 }}>{s.value}</p>
                  <p style={{ fontSize:12, color:"#4a6a6a" }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", borderRadius:14, background:"#2a1e08", border:"1px solid #EF9F2725" }}>
              <Shield size={18} style={{ color:"#EF9F27", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0", marginBottom:2 }}>Verificação de identidade</p>
                <p style={{ fontSize:12, color:"#6a5a3a" }}>Completa a verificação para aumentar a confiança dos prestadores.</p>
              </div>
              <button className="verify-btn" onClick={() => router.push("/kyc")}>
                Verificar
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
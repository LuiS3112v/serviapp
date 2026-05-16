"use client";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Edit, Shield, Star, Briefcase, Wallet } from "lucide-react";

export default function ProviderProfilePage() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .pp-inner{padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:700px}
        .pp-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:24px}
        .info-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #1a2535}
        .info-row:last-child{border-bottom:none}
        .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
        .stat{background:#0d1117;border:1px solid #1a2535;border-radius:12px;padding:14px;text-align:center}
        .edit-btn{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;border:1px solid #1a2535;background:#131b27;color:#8a9ab0;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .edit-btn:hover{border-color:#EF9F27;color:#EF9F27}
        .kyc-btn{padding:10px 18px;border-radius:10px;background:#EF9F27;color:#0d1117;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
        @media(max-width:1024px){.stat-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:640px){.pp-inner{padding:16px}}
      `}</style>
      <div className="pp-inner">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Perfil de prestador</h1>
            <p style={{fontSize:13,color:"#4a6a6a"}}>Gere o teu perfil profissional</p>
          </div>
          <button className="edit-btn"><Edit size={14}/> Editar</button>
        </div>

        <div className="pp-card">
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,paddingBottom:20,borderBottom:"1px solid #1a2535"}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:"#2a1e08",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <User size={32} style={{color:"#EF9F27"}}/>
            </div>
            <div>
              <p style={{fontSize:18,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>O teu nome</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:"#EF9F2720",color:"#EF9F27",border:"1px solid #EF9F2740"}}>Prestador</span>
                <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:"#E24B4A20",color:"#E24B4A",border:"1px solid #E24B4A40"}}>Verificação pendente</span>
              </div>
            </div>
          </div>
          {[
            {icon:Mail,label:"Email",value:"O teu email",color:"#1D9E75"},
            {icon:Phone,label:"Telemóvel",value:"+244 —",color:"#378ADD"},
            {icon:MapPin,label:"Localização",value:"Luanda, Angola",color:"#EF9F27"},
            {icon:Briefcase,label:"Categoria",value:"Não definida",color:"#8B5CF6"},
          ].map((item,i)=>{
            const Icon=item.icon;
            return (
              <div className="info-row" key={i}>
                <div style={{width:38,height:38,borderRadius:10,background:`${item.color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon size={16} style={{color:item.color}}/>
                </div>
                <div>
                  <p style={{fontSize:11,color:"#4a5a6a",marginBottom:2}}>{item.label}</p>
                  <p style={{fontSize:14,color:"#c0d0e0"}}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="stat-grid">
          {[
            {label:"Serviços",value:"0",color:"#EF9F27",icon:Briefcase},
            {label:"Avaliação",value:"—",color:"#1D9E75",icon:Star},
            {label:"Ganhos",value:"0 Kz",color:"#378ADD",icon:Wallet},
            {label:"Ranking",value:"—",color:"#D4537E",icon:Star},
          ].map((s,i)=>{
            const Icon=s.icon;
            return (
              <div className="stat" key={i}>
                <Icon size={16} style={{color:s.color,margin:"0 auto 8px"}}/>
                <p style={{fontSize:20,fontWeight:700,color:s.color,marginBottom:4}}>{s.value}</p>
                <p style={{fontSize:11,color:"#4a6a6a"}}>{s.label}</p>
              </div>
            );
          })}
        </div>

        <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"16px 20px",borderRadius:14,background:"#2a1e08",border:"1px solid #EF9F2725"}}>
          <Shield size={18} style={{color:"#EF9F27",flexShrink:0,marginTop:2}}/>
          <div style={{flex:1}}>
            <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:6}}>Verificação de identidade pendente</p>
            <p style={{fontSize:13,color:"#6a5a3a",marginBottom:12,lineHeight:1.6}}>Completa o KYC para activar o teu perfil e começar a receber clientes.</p>
            <button className="kyc-btn" onClick={()=>router.push("/kyc")}>Completar verificação →</button>
          </div>
        </div>
      </div>
    </>
  );
}
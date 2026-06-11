"use client";
import { useRouter } from "next/navigation";
import { Edit, Users, Briefcase, Wallet, Phone, Mail, MapPin, Plus } from "lucide-react";

export default function CompanyProfilePage() {
  const router = useRouter();
  return (
    <>
      <style>{`
        .cp-inner{padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:700px}
        .cp-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:24px}
        .info-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #1a2535}
        .info-row:last-child{border-bottom:none}
        .stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .stat{background:#0d1117;border:1px solid #1a2535;border-radius:12px;padding:14px;text-align:center}
        .team-empty{display:flex;flex-direction:column;align-items:center;padding:32px;gap:10px;text-align:center}
        .edit-btn{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;border:1px solid #1a2535;background:#131b27;color:#8a9ab0;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
        .add-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;background:#1d9e7520;color:#1D9E75;border:1px solid #1d9e7540;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
        @media(max-width:640px){.cp-inner{padding:16px}.stat-grid{grid-template-columns:1fr 1fr}}
      `}</style>
      <div className="cp-inner">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Perfil da empresa</h1>
            <p style={{fontSize:13,color:"#4a6a6a"}}>Gere a tua empresa e equipa</p>
          </div>
          <button className="edit-btn"><Edit size={14}/> Editar</button>
        </div>

        <div className="cp-card">
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,paddingBottom:20,borderBottom:"1px solid #1a2535"}}>
            <div style={{width:72,height:72,borderRadius:16,background:"#1a2232",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,flexShrink:0}}>🏢</div>
            <div>
              <p style={{fontSize:18,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>Nome da empresa</p>
              <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:"#378ADD20",color:"#378ADD",border:"1px solid #378ADD40"}}>Empresa</span>
            </div>
          </div>
          {[
            {icon:Mail,label:"Email",value:"email@empresa.ao",color:"#1D9E75"},
            {icon:Phone,label:"Telefone",value:"+244 —",color:"#378ADD"},
            {icon:MapPin,label:"Sede",value:"Luanda, Angola",color:"#EF9F27"},
            {icon:Briefcase,label:"Sector",value:"Não definido",color:"#8B5CF6"},
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
            {label:"Funcionários",value:"0",color:"#1D9E75"},
            {label:"Serviços activos",value:"0",color:"#378ADD"},
            {label:"Total ganho",value:"0 Kz",color:"#EF9F27"},
          ].map((s,i)=>(
            <div className="stat" key={i}>
              <p style={{fontSize:22,fontWeight:700,color:s.color,marginBottom:4}}>{s.value}</p>
              <p style={{fontSize:12,color:"#4a6a6a"}}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="cp-card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Users size={16} style={{color:"#1D9E75"}}/>
              <h2 style={{fontSize:15,fontWeight:700,color:"#c0d0e0"}}>Equipa</h2>
            </div>
            <button className="add-btn"><Plus size={13}/> Adicionar</button>
          </div>
          <div className="team-empty">
            <Users size={28} style={{color:"#2a3a4a"}}/>
            <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0"}}>Sem funcionários ainda</p>
            <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:280}}>Adiciona funcionários para distribuir serviços pela equipa.</p>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";
import { useRouter } from "next/navigation";
import { Shield, Globe, Moon, LogOut, ChevronRight, FileText, Lock } from "lucide-react";
import { clearAllSessions } from "@/lib/auth.api";

const groups = [
  { title:"Conta", items:[
    { icon:Shield, label:"Segurança e senha", desc:"Altera a tua senha e activa 2FA", color:"#1D9E75", href:"/security", clickable:true },
  ]},
  { title:"Preferências", items:[
    { icon:Globe, label:"Idioma e região", desc:"Português (Angola)", color:"#8B5CF6", href:"", clickable:false },
    { icon:Moon, label:"Aparência", desc:"Modo escuro activo", color:"#D4537E", href:"", clickable:false },
  ]},
  { title:"Legal", items:[
    { icon:FileText, label:"Termos de Serviço", desc:"Regras e condições da plataforma", color:"#4a7a7a", href:"/provider/terms", clickable:true },
    { icon:Lock, label:"Política de Privacidade", desc:"Como usamos os teus dados", color:"#4a6a9a", href:"/provider/privacy", clickable:true },
  ]},
];

export default function ProviderSettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    clearAllSessions();
    router.push("/");
  };

  return (
    <>
      <style>{`
        .pset-inner{padding:28px 32px;display:flex;flex-direction:column;gap:24px;max-width:680px}
        .set-group{background:#131b27;border:1px solid #1a2535;border-radius:16px;overflow:hidden}
        .set-item{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid #1a2535;width:100%;background:none;border-left:none;border-right:none;border-top:none;text-align:left}
        .set-item:last-child{border-bottom:none}
        .set-item.clickable{cursor:pointer;transition:background 0.15s}
        .set-item.clickable:hover{background:#0d1520}
        .set-item.disabled{cursor:default;opacity:0.45}
        @media(max-width:640px){.pset-inner{padding:16px}}
      `}</style>
      <div className="pset-inner">
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Definições</h1>
          <p style={{fontSize:13,color:"#4a6a6a"}}>Gere a tua conta e preferências</p>
        </div>
        {groups.map((group,gi)=>(
          <div key={gi}>
            <p style={{fontSize:11,fontWeight:600,color:"#3a4a5a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{group.title}</p>
            <div className="set-group">
              {groups[gi].items.map((item,ii)=>{
                const Icon=item.icon;
                return (
                  <button
                    className={`set-item ${item.clickable ? "clickable" : "disabled"}`}
                    key={ii}
                    onClick={()=>{ if(item.clickable && item.href) router.push(item.href); }}
                    disabled={!item.clickable}
                  >
                    <div style={{width:40,height:40,borderRadius:12,background:`${item.color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Icon size={18} style={{color:item.color}}/>
                    </div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:2}}>{item.label}</p>
                      <p style={{fontSize:12,color:"#4a5a6a"}}>{item.desc}</p>
                    </div>
                    {item.clickable && <ChevronRight size={16} style={{color:"#2a3a4a"}}/>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="set-group">
          <button className="set-item clickable" onClick={handleLogout}>
            <div style={{width:40,height:40,borderRadius:12,background:"#E24B4A15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <LogOut size={18} style={{color:"#E24B4A"}}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:14,fontWeight:600,color:"#E24B4A"}}>Terminar sessão</p>
            </div>
          </button>
        </div>
        <p style={{fontSize:12,color:"#2a3a4a",textAlign:"center"}}>Serviapp v1.0.0 · Angola</p>
      </div>
    </>
  );
}
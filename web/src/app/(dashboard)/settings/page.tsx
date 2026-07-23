"use client";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Shield, Globe, Sun, LogOut, ChevronRight, FileText, Lock } from "lucide-react";
import { clearAllSessions } from "@/lib/auth.api";

const settingGroups = [
  { title:"Conta", items:[
    { icon:Shield, label:"Segurança e senha", desc:"Altera a tua senha e activa 2FA", color:"#1D9E75", href:"/security", clickable:true },
  ]},
  { title:"Preferências", items:[
    { icon:Globe, label:"Idioma e região", desc:"Português (Angola)", color:"#8B5CF6", href:"", clickable:false },
    { icon:Sun, label:"Aparência", desc:"Modo claro activo", color:"#EF9F27", href:"", clickable:false },
  ]},
  { title:"Legal", items:[
    { icon:FileText, label:"Termos de Serviço", desc:"Regras e condições da plataforma", color:"#64748b", href:"/terms", clickable:true },
    { icon:Lock, label:"Política de Privacidade", desc:"Como usamos os teus dados", color:"#2563eb", href:"/privacy", clickable:true },
  ]},
];

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    clearAllSessions();
    router.push("/");
  };

  return (
    <>
      <style>{`
        .set-wrap{display:flex;min-height:100vh;background:#f8fafc}
        .set-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .set-inner{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:24px;max-width:680px}
        .set-group{background:#ffffff;border:1px solid #eef1f5;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.04)}
        .set-item{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid #eef1f5;width:100%;background:none;border-left:none;border-right:none;border-top:none;text-align:left}
        .set-item:last-child{border-bottom:none}
        .set-item.clickable{cursor:pointer;transition:background 0.15s}
        .set-item.clickable:hover{background:#f8fafc}
        .set-item.disabled{cursor:default;opacity:0.5}
        @media(max-width:1024px){.set-main{margin-left:0}}
        @media(max-width:640px){.set-inner{padding:70px 16px 20px}}
      `}</style>
      <div className="set-wrap">
        <Sidebar/>
        <div className="set-main">
          <Navbar/>
          <div className="set-inner">
            <div>
              <h1 style={{fontSize:22,fontWeight:700,color:"#0f172a",marginBottom:4}}>Definições</h1>
              <p style={{fontSize:13,color:"#64748b"}}>Gere a tua conta e preferências</p>
            </div>
            {settingGroups.map((group,gi)=>(
              <div key={gi}>
                <p style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{group.title}</p>
                <div className="set-group">
                  {group.items.map((item,ii)=>{
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
                          <p style={{fontSize:14,fontWeight:600,color:"#334155",marginBottom:2}}>{item.label}</p>
                          <p style={{fontSize:12,color:"#94a3b8"}}>{item.desc}</p>
                        </div>
                        {item.clickable && <ChevronRight size={16} style={{color:"#cbd5e1"}}/>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="set-group">
              <button className="set-item clickable" onClick={handleLogout}>
                <div style={{width:40,height:40,borderRadius:12,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <LogOut size={18} style={{color:"#dc2626"}}/>
                </div>
                <div style={{flex:1}}>
                  <p style={{fontSize:14,fontWeight:600,color:"#dc2626"}}>Terminar sessão</p>
                </div>
              </button>
            </div>
            <p style={{fontSize:12,color:"#cbd5e1",textAlign:"center"}}>Serviapp v1.0.0 · Angola</p>
          </div>
        </div>
      </div>
    </>
  );
}
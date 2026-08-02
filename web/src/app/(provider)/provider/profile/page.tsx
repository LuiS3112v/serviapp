"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, MapPin, Edit, Shield, Star, Briefcase, CheckCircle, X, Loader2, Camera } from "lucide-react";
import { userApi, getCurrentUser, refreshUserInStorage } from "@/lib/user.api";
import { servicesApi, ProviderStats } from "@/lib/services.api";
import { AuthUser } from "@/lib/auth.api";
import { getToken } from "@/lib/auth.api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const CATEGORIES = ["Limpeza","Climatização","Canalização","Eletricista","TI & Redes","Jardinagem","Mudanças","Beleza","Automóvel","Pintura","Construção","Segurança"];

// Rating arredondado a 1 casa decimal — evita números tipo
// "4.666666666666667" que rebentam o layout, principalmente no telemóvel.
const fmtRating = (n: number) => n.toFixed(1);

export default function ProviderProfilePage() {
  const router = useRouter();
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [stats, setStats]     = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm]       = useState({ fullName:"", phone:"", category:"" });

  // ── Upload de foto de perfil ──────────────────────────────────────────
  // A wrapper genérica `api.ts` do projeto força sempre
  // Content-Type: application/json, o que não serve para multipart. Por
  // isso este upload usa fetch directo com FormData + Authorization,
  // exactamente como já é feito noutros pontos do projeto (ex: pesquisa
  // de utilizadores dentro do InviteModal da página de empresa) quando
  // o pedido não cabe na wrapper JSON.
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    const cached = getCurrentUser();
    if (cached) { setUser(cached as AuthUser); setLoading(false); }
    Promise.all([
      userApi.getMe(),
      servicesApi.getProviderStats().catch(() => null),
    ]).then(([u, s]) => {
      setUser(u as AuthUser);
      refreshUserInStorage(u as AuthUser);
      if (s) setStats(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openEdit = () => {
    setForm({ fullName:user?.fullName??"", phone:user?.phone??"", category:(user as any)?.category??"" });
    setEditing(true); setError(""); setSuccess(false); setAvatarError("");
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) { setError("O nome não pode estar vazio."); return; }
    setSaving(true); setError("");
    try {
      const updated = await userApi.updateMe({ fullName:form.fullName, phone:form.phone, category:form.category });
      setUser(updated as AuthUser);
      refreshUserInStorage(updated as AuthUser);
      setSuccess(true);
      setTimeout(() => { setEditing(false); setSuccess(false); }, 1200);
    } catch (e: any) {
      setError(e.message || "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError("");
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          Array.isArray(err.message) ? err.message[0] : err.message || "Erro ao enviar foto."
        );
      }

      const updated = await res.json();
      setUser(updated as AuthUser);
      refreshUserInStorage(updated as AuthUser);
    } catch (e: any) {
      setAvatarError(e.message || "Erro ao enviar foto.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("pt-PT").format(n);
  const userAny = user as any;

  return (
    <>
      <style>{`
        .pp-inner{padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:700px}
        .pp-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:24px}
        .info-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #1a2535}
        .info-row:last-child{border-bottom:none}
        .stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .stat{background:#0d1117;border:1px solid #1a2535;border-radius:12px;padding:14px;text-align:center}
        .stat-value{font-size:20px;font-weight:700;margin-bottom:4px;line-height:1.15;word-break:break-word}
        .edit-btn{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;border:1px solid #1a2535;background:#131b27;color:#8a9ab0;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .edit-btn:hover{border-color:#EF9F27;color:#EF9F27}
        .kyc-btn{padding:10px 18px;border-radius:10px;background:#EF9F27;color:#0d1117;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px}
        .modal-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:28px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto}
        .modal-input{width:100%;padding:13px 16px;border-radius:12px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:14px;outline:none;transition:border 0.2s;margin-bottom:14px;font-family:inherit}
        .modal-input:focus{border-color:#EF9F27}
        .modal-input::placeholder{color:#4a5a6a}
        .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px}
        .cat-opt{padding:8px 4px;border-radius:8px;font-size:11px;cursor:pointer;text-align:center;border:1px solid #1a2535;background:#0d1117;color:#6a7a8a;transition:all 0.15s;font-family:inherit}
        .cat-opt.sel{border-color:#EF9F27;background:#EF9F2715;color:#EF9F27}
        .save-btn{width:100%;padding:14px;border-radius:12px;border:none;background:#EF9F27;color:#0d1117;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px}
        .save-btn:disabled{opacity:0.6;cursor:not-allowed}
        .skeleton{background:#1a2535;border-radius:8px;animation:pulse 1.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .avatar-frame{width:72px;height:72px;border-radius:50%;background:#2a1e08;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;position:relative}
        .avatar-frame img{width:100%;height:100%;object-fit:cover}
        .avatar-upload-wrap{display:flex;align-items:center;gap:14px;margin-bottom:16px}
        .avatar-upload-frame{width:64px;height:64px;border-radius:50%;background:#0d1117;border:1px solid #1a2535;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;position:relative}
        .avatar-upload-frame img{width:100%;height:100%;object-fit:cover}
        .avatar-upload-btn{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:10px;border:1px solid #1a2535;background:#0d1117;color:#8a9ab0;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .avatar-upload-btn:hover{border-color:#EF9F27;color:#EF9F27}
        .avatar-upload-btn:disabled{opacity:0.6;cursor:not-allowed}
        @media(max-width:640px){.pp-inner{padding:70px 16px 20px}.cat-grid{grid-template-columns:repeat(2,1fr)}.stat-grid{grid-template-columns:1fr 1fr}.stat-value{font-size:17px}}
        @media(max-width:360px){.stat-value{font-size:16px}}
      `}</style>

      <div className="pp-inner">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Perfil de prestador</h1>
            <p style={{fontSize:13,color:"#4a6a6a"}}>Gere o teu perfil profissional</p>
          </div>
          <button className="edit-btn" onClick={openEdit}><Edit size={14}/> Editar</button>
        </div>

        <div className="pp-card">
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,paddingBottom:20,borderBottom:"1px solid #1a2535"}}>
            <div className="avatar-frame">
              {userAny?.avatarUrl
                ? <img src={userAny.avatarUrl} alt={user?.fullName ?? ""} />
                : <User size={32} style={{color:"#EF9F27"}}/>}
            </div>
            <div>
              {loading ? <div className="skeleton" style={{width:160,height:20,marginBottom:8}}/> :
                <p style={{fontSize:18,fontWeight:700,color:"#e2e8f0",marginBottom:6}}>{user?.fullName ?? "—"}</p>}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:"#EF9F2720",color:"#EF9F27",border:"1px solid #EF9F2740"}}>Prestador</span>
                <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:user?.isVerified?"#1d9e7520":"#E24B4A20",color:user?.isVerified?"#1D9E75":"#E24B4A",border:`1px solid ${user?.isVerified?"#1d9e7540":"#E24B4A40"}`}}>
                  {user?.isVerified ? "Verificado ✓" : "Verificação pendente"}
                </span>
              </div>
            </div>
          </div>
          {[
            {icon:Mail,     label:"Email",      value:user?.email,              color:"#1D9E75"},
            {icon:Phone,    label:"Telemóvel",  value:user?.phone||"+244 —",    color:"#378ADD"},
            {icon:MapPin,   label:"Localização",value:"Luanda, Angola",          color:"#EF9F27"},
            {icon:Briefcase,label:"Categoria",  value:userAny?.category||"Não definida", color:"#8B5CF6"},
          ].map((item,i)=>{
            const Icon=item.icon;
            return (
              <div className="info-row" key={i}>
                <div style={{width:38,height:38,borderRadius:10,background:`${item.color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon size={16} style={{color:item.color}}/>
                </div>
                <div>
                  <p style={{fontSize:11,color:"#4a5a6a",marginBottom:2}}>{item.label}</p>
                  {loading ? <div className="skeleton" style={{width:130,height:14}}/> :
                    <p style={{fontSize:14,color:"#c0d0e0"}}>{item.value ?? "—"}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Stats — campos correctos: totalOrders, totalCompleted, averageRating ─── */}
        <div className="stat-grid">
          {[
            {label:"Pedidos recebidos", value:loading?"...":fmt(stats?.totalOrders??0),                                              color:"#EF9F27", icon:Briefcase},
            {label:"Concluídos",        value:loading?"...":fmt(stats?.totalCompleted??0),                                            color:"#1D9E75", icon:CheckCircle},
            {label:"Avaliação média",   value:loading?"...":stats?.averageRating!=null?`${fmtRating(stats.averageRating)}★`:"Sem dados",   color:"#378ADD", icon:Star},
          ].map((s,i)=>{
            const Icon=s.icon;
            return (
              <div className="stat" key={i}>
                <Icon size={16} style={{color:s.color,margin:"0 auto 8px"}}/>
                <p className="stat-value" style={{color:s.color}}>{s.value}</p>
                <p style={{fontSize:11,color:"#4a6a6a"}}>{s.label}</p>
              </div>
            );
          })}
        </div>

        {!user?.isVerified && (
          <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"16px 20px",borderRadius:14,background:"#2a1e08",border:"1px solid #EF9F2725"}}>
            <Shield size={18} style={{color:"#EF9F27",flexShrink:0,marginTop:2}}/>
            <div style={{flex:1}}>
              <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:6}}>Verificação de identidade pendente</p>
              <p style={{fontSize:13,color:"#6a5a3a",marginBottom:12,lineHeight:1.6}}>
                Completa o KYC para activar o teu perfil. Após verificação, a tua conta aparece nas categorias e no mapa.
              </p>
              <button className="kyc-btn" onClick={()=>router.push("/kyc?role=provider")}>Completar verificação →</button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={()=>setEditing(false)}>
          <div className="modal-card" onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"#e2e8f0"}}>Editar perfil</h2>
              <button onClick={()=>setEditing(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#4a6a6a"}}><X size={20}/></button>
            </div>
            {error && <div style={{background:"#E24B4A15",border:"1px solid #E24B4A30",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#E24B4A",marginBottom:14}}>{error}</div>}
            {success && <div style={{background:"#EF9F2720",border:"1px solid #EF9F2740",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#EF9F27",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><CheckCircle size={14}/> Guardado!</div>}

            {/* ── Foto de perfil ── */}
            <label style={{fontSize:13,fontWeight:600,color:"#6a7a8a",display:"block",marginBottom:8}}>Foto de perfil</label>
            {avatarError && <div style={{background:"#E24B4A15",border:"1px solid #E24B4A30",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#E24B4A",marginBottom:10}}>{avatarError}</div>}
            <div className="avatar-upload-wrap">
              <div className="avatar-upload-frame">
                {userAny?.avatarUrl
                  ? <img src={userAny.avatarUrl} alt="" />
                  : <User size={26} style={{color:"#4a5a6a"}}/>}
              </div>
              <label className="avatar-upload-btn">
                {avatarUploading
                  ? <><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> A enviar...</>
                  : <><Camera size={13}/> {userAny?.avatarUrl ? "Trocar foto" : "Escolher foto"}</>}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={avatarUploading}
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    handleAvatarChange(file);
                  }}
                />
              </label>
            </div>

            <label style={{fontSize:13,fontWeight:600,color:"#6a7a8a",display:"block",marginBottom:6}}>Nome completo</label>
            <input className="modal-input" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} placeholder="O teu nome"/>
            <label style={{fontSize:13,fontWeight:600,color:"#6a7a8a",display:"block",marginBottom:6}}>Telemóvel</label>
            <input className="modal-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+244 9XX XXX XXX"/>
            <label style={{fontSize:13,fontWeight:600,color:"#6a7a8a",display:"block",marginBottom:8}}>Categoria</label>
            <div className="cat-grid">
              {CATEGORIES.map((c,i)=>(
                <button key={i} className={`cat-opt${form.category===c?" sel":""}`} onClick={()=>setForm({...form,category:c})}>{c}</button>
              ))}
            </div>
            <button className="save-btn" disabled={saving} onClick={handleSave}>
              {saving?<><Loader2 size={15}/>A guardar...</>:"Guardar alterações"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
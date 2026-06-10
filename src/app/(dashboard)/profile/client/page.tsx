"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { User, Mail, Phone, MapPin, Edit, X, Loader2, CheckCircle } from "lucide-react";
import { userApi, getCurrentUser, refreshUserInStorage } from "@/lib/user.api";
import { servicesApi, ClientStats } from "@/lib/services.api";
import { AuthUser } from "@/lib/auth.api";

export default function ClientProfilePage() {
  const router = useRouter();
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [stats, setStats]     = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm]       = useState({ fullName: "", phone: "" });

  useEffect(() => {
    const cached = getCurrentUser();
    if (cached) { setUser(cached as AuthUser); setLoading(false); }
    Promise.all([
      userApi.getMe(),
      servicesApi.getClientStats().catch(() => null),
    ]).then(([u, s]) => {
      setUser(u as AuthUser);
      refreshUserInStorage(u as AuthUser);
      if (s) setStats(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const openEdit = () => {
    setForm({ fullName: user?.fullName ?? "", phone: user?.phone ?? "" });
    setEditing(true); setError(""); setSuccess(false);
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) { setError("O nome não pode estar vazio."); return; }
    setSaving(true); setError("");
    try {
      const updated = await userApi.updateMe({ fullName: form.fullName, phone: form.phone });
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

  const fmt = (n: number) => new Intl.NumberFormat("pt-PT").format(n);

  return (
    <>
      <style>{`
        .prof-wrap{display:flex;min-height:100vh;background:#0d1117}
        .prof-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .prof-inner{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:700px}
        .prof-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:24px}
        .info-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #1a2535}
        .info-row:last-child{border-bottom:none}
        .stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .stat-card{background:#0d1117;border:1px solid #1a2535;border-radius:12px;padding:16px;text-align:center}
        .edit-btn{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;border:1px solid #1a2535;background:#131b27;color:#8a9ab0;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .edit-btn:hover{border-color:#1D9E75;color:#1D9E75}
        .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px}
        .modal-card{background:#131b27;border:1px solid #1a2535;border-radius:20px;padding:28px;width:100%;max-width:440px}
        .modal-input{width:100%;padding:13px 16px;border-radius:12px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:14px;outline:none;transition:border 0.2s;margin-bottom:14px;font-family:inherit}
        .modal-input:focus{border-color:#1D9E75}
        .modal-input::placeholder{color:#4a5a6a}
        .save-btn{width:100%;padding:14px;border-radius:12px;border:none;background:#1D9E75;color:white;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px}
        .save-btn:disabled{opacity:0.6;cursor:not-allowed}
        .skeleton{background:#1a2535;border-radius:8px;animation:pulse 1.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @media(max-width:1024px){.prof-main{margin-left:0}}
        @media(max-width:640px){.prof-inner{padding:70px 16px 20px}.stat-grid{grid-template-columns:1fr 1fr}}
      `}</style>

      <div className="prof-wrap">
        <Sidebar/>
        <div className="prof-main">
          <Navbar/>
          <div className="prof-inner">

            {/* Título */}
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <h1 style={{ fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4 }}>O meu perfil</h1>
                <p style={{ fontSize:13,color:"#4a6a6a" }}>Gere as tuas informações pessoais</p>
              </div>
              <button className="edit-btn" onClick={openEdit}><Edit size={14}/> Editar</button>
            </div>

            {/* Card com info */}
            <div className="prof-card">
              <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:24,paddingBottom:24,borderBottom:"1px solid #1a2535" }}>
                <div style={{ width:72,height:72,borderRadius:"50%",background:"#1a3a2a",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <User size={32} style={{ color:"#1D9E75" }}/>
                </div>
                <div>
                  {loading
                    ? <div className="skeleton" style={{ width:160,height:20,marginBottom:8 }}/>
                    : <p style={{ fontSize:18,fontWeight:700,color:"#e2e8f0",marginBottom:4 }}>{user?.fullName ?? "—"}</p>}
                  <span style={{ fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:"#1d9e7520",color:"#1D9E75",border:"1px solid #1d9e7540" }}>
                    Cliente
                  </span>
                </div>
              </div>

              {[
                { icon:Mail,   label:"Email",       value:user?.email,           color:"#1D9E75" },
                { icon:Phone,  label:"Telemóvel",   value:user?.phone||"+244 —", color:"#378ADD" },
                { icon:MapPin, label:"Localização", value:"Luanda, Angola",       color:"#EF9F27" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div className="info-row" key={i}>
                    <div style={{ width:38,height:38,borderRadius:10,background:`${item.color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <Icon size={16} style={{ color:item.color }}/>
                    </div>
                    <div>
                      <p style={{ fontSize:11,color:"#4a5a6a",marginBottom:2 }}>{item.label}</p>
                      {loading
                        ? <div className="skeleton" style={{ width:140,height:14 }}/>
                        : <p style={{ fontSize:14,color:"#c0d0e0" }}>{item.value ?? "—"}</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats — campos correctos */}
            <div className="stat-grid">
              {[
                { label:"Serviços criados", value: loading ? "..." : fmt(stats?.totalCreated ?? 0),                        color:"#1D9E75" },
                { label:"Concluídos",       value: loading ? "..." : fmt(stats?.totalCompleted ?? 0),                      color:"#EF9F27" },
                { label:"Total gasto",      value: loading ? "..." : `${fmt(stats?.totalSpent ?? 0)} Kz`,                  color:"#378ADD" },
              ].map((s, i) => (
                <div className="stat-card" key={i}>
                  <p style={{ fontSize:22,fontWeight:700,color:s.color,marginBottom:4 }}>{s.value}</p>
                  <p style={{ fontSize:12,color:"#4a6a6a" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* VERIFICAÇÃO REMOVIDA — não faz sentido para clientes */}

          </div>
        </div>
      </div>

      {/* Modal edição */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <h2 style={{ fontSize:18,fontWeight:700,color:"#e2e8f0" }}>Editar perfil</h2>
              <button onClick={() => setEditing(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"#4a6a6a" }}>
                <X size={20}/>
              </button>
            </div>
            {error && (
              <div style={{ background:"#E24B4A15",border:"1px solid #E24B4A30",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#E24B4A",marginBottom:14 }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background:"#1d9e7520",border:"1px solid #1d9e7540",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#1D9E75",marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>
                <CheckCircle size={14}/> Guardado!
              </div>
            )}
            <label style={{ fontSize:13,fontWeight:600,color:"#6a7a8a",display:"block",marginBottom:6 }}>Nome completo</label>
            <input className="modal-input" value={form.fullName} onChange={e => setForm({ ...form, fullName:e.target.value })} placeholder="O teu nome"/>
            <label style={{ fontSize:13,fontWeight:600,color:"#6a7a8a",display:"block",marginBottom:6 }}>Telemóvel</label>
            <input className="modal-input" value={form.phone} onChange={e => setForm({ ...form, phone:e.target.value })} placeholder="+244 9XX XXX XXX"/>
            <button className="save-btn" disabled={saving} onClick={handleSave}>
              {saving ? <><Loader2 size={15}/>A guardar...</> : "Guardar alterações"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
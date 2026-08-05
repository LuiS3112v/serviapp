"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Phone, MapPin, Edit, Shield, Star, Briefcase, CheckCircle, X, Loader2, Camera,
  FileText, Image as ImageIcon, Plus, Trash2, DollarSign,
} from "lucide-react";
import { userApi, getCurrentUser, refreshUserInStorage } from "@/lib/user.api";
import { servicesApi, ProviderStats } from "@/lib/services.api";
import { providerProfileApi } from "@/lib/provider-profile.api";
import { AuthUser } from "@/lib/auth.api";
import { getToken } from "@/lib/auth.api";
import { ProviderGalleryImageData, ProviderPricedServiceData } from "@/types/provider-profile.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const CATEGORIES = ["Limpeza","Climatização","Canalização","Eletricista","TI & Redes","Jardinagem","Mudanças","Beleza","Automóvel","Pintura","Construção","Segurança"];

const fmtRating = (n: number) => n.toFixed(1);
const fKz = (v: number) => new Intl.NumberFormat("pt-PT").format(v) + " Kz";

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

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // ── Sobre ──────────────────────────────────────────────────────────
  const [bioDraft, setBioDraft] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  // ── Galeria ────────────────────────────────────────────────────────
  const [gallery, setGallery] = useState<ProviderGalleryImageData[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // ── Serviços e preços ──────────────────────────────────────────────
  const [pricedServices, setPricedServices] = useState<ProviderPricedServiceData[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [addingService, setAddingService] = useState(false);

  useEffect(() => {
    const cached = getCurrentUser();
    if (cached) { setUser(cached as AuthUser); setLoading(false); }
    Promise.all([
      userApi.getMe(),
      servicesApi.getProviderStats().catch(() => null),
      providerProfileApi.getMyGallery().catch(() => []),
      providerProfileApi.getMyPricedServices().catch(() => []),
    ]).then(([u, s, g, ps]) => {
      setUser(u as AuthUser);
      refreshUserInStorage(u as AuthUser);
      if (s) setStats(s);
      setGallery(g);
      setPricedServices(ps);
      setBioDraft((u as any)?.bio ?? "");
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

  // ── Handlers: Sobre ────────────────────────────────────────────────
  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const { bio } = await providerProfileApi.updateBio(bioDraft);
      setUser(prev => prev ? ({ ...prev, bio } as AuthUser) : prev);
      refreshUserInStorage({ ...(user as AuthUser), bio });
    } catch (e: any) {
      alert(e.message || "Erro ao guardar biografia.");
    } finally {
      setSavingBio(false);
    }
  };

  // ── Handlers: Galeria ──────────────────────────────────────────────
  const handleAddGalleryImages = async (files: File[]) => {
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      for (const file of files) {
        const img = await providerProfileApi.addGalleryImage(file);
        setGallery(prev => [img, ...prev]);
      }
    } catch (e: any) {
      alert(e.message || "Erro ao fazer upload.");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = async (id: string) => {
    try {
      await providerProfileApi.removeGalleryImage(id);
      setGallery(prev => prev.filter(g => g.id !== id));
    } catch (e: any) {
      alert(e.message || "Erro ao remover imagem.");
    }
  };

  // ── Handlers: Serviços e preços ────────────────────────────────────
  const handleAddPricedService = async () => {
    if (!newServiceName.trim() || !newServicePrice || Number(newServicePrice) <= 0) return;
    setAddingService(true);
    try {
      const created = await providerProfileApi.addPricedService({
        name: newServiceName.trim(),
        price: Number(newServicePrice),
      });
      setPricedServices(prev => [...prev, created]);
      setNewServiceName("");
      setNewServicePrice("");
    } catch (e: any) {
      alert(e.message || "Erro ao adicionar serviço.");
    } finally {
      setAddingService(false);
    }
  };

  const handleRemovePricedService = async (id: string) => {
    try {
      await providerProfileApi.removePricedService(id);
      setPricedServices(prev => prev.filter(s => s.id !== id));
    } catch (e: any) {
      alert(e.message || "Erro ao remover serviço.");
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("pt-PT").format(n);
  const userAny = user as any;

  return (
    <>
      <style>{`
        .pp-inner{padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:700px}
        .pp-card{background:#ffffff;border:1px solid #eef1f5;border-radius:20px;padding:24px;box-shadow:0 2px 12px rgba(15,23,42,0.04)}
        .info-row{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #eef1f5}
        .info-row:last-child{border-bottom:none}
        .stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .stat{background:#ffffff;border:1px solid #eef1f5;border-radius:12px;padding:16px;text-align:center;box-shadow:0 2px 12px rgba(15,23,42,0.04)}
        .stat-value{font-size:22px;font-weight:700;margin-bottom:4px;line-height:1.15;word-break:break-word}
        .edit-btn{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:12px;border:1px solid #e2e8f0;background:#ffffff;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .edit-btn:hover{border-color:#EF9F27;color:#EF9F27}
        .edit-btn:disabled{opacity:0.6;cursor:not-allowed}
        .add-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;background:#EF9F2715;color:#EF9F27;border:1px solid #EF9F2730;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;transition:all 0.15s}
        .add-btn:hover{background:#EF9F2725}
        .add-btn:disabled{opacity:0.5;cursor:not-allowed}
        .kyc-btn{padding:10px 18px;border-radius:10px;background:#EF9F27;color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;transition:opacity 0.15s}
        .kyc-btn:hover{opacity:0.88}
        .modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px}
        .modal-card{background:#ffffff;border:1px solid #eef1f5;border-radius:20px;padding:28px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 50px rgba(15,23,42,0.14)}
        .modal-input{width:100%;padding:13px 16px;border-radius:12px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#0f172a;font-size:14px;outline:none;transition:border 0.2s;margin-bottom:14px;font-family:inherit}
        .modal-input:focus{border-color:#EF9F27;background:#fff}
        .modal-input::placeholder{color:#94a3b8}
        .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:14px}
        .cat-opt{padding:8px 4px;border-radius:8px;font-size:11px;cursor:pointer;text-align:center;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;transition:all 0.15s;font-family:inherit}
        .cat-opt:hover{border-color:#EF9F27;color:#EF9F27}
        .cat-opt.sel{border-color:#EF9F27;background:#EF9F2712;color:#EF9F27;font-weight:600}
        .save-btn{width:100%;padding:14px;border-radius:12px;border:none;background:#EF9F27;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 8px 20px rgba(239,159,39,0.25);transition:opacity 0.15s}
        .save-btn:hover{opacity:0.9}
        .save-btn:disabled{opacity:0.6;cursor:not-allowed}
        .skeleton{background:#e2e8f0;border-radius:8px;animation:pulse 1.5s infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .avatar-frame{width:72px;height:72px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;position:relative;border:2px solid #eef1f5}
        .avatar-frame img{width:100%;height:100%;object-fit:cover}
        .avatar-upload-wrap{display:flex;align-items:center;gap:14px;margin-bottom:16px}
        .avatar-upload-frame{width:64px;height:64px;border-radius:50%;background:#f1f5f9;border:1.5px solid #e2e8f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}
        .avatar-upload-frame img{width:100%;height:100%;object-fit:cover}
        .avatar-upload-btn{display:flex;align-items:center;gap:8px;padding:9px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .avatar-upload-btn:hover{border-color:#EF9F27;color:#EF9F27;background:#fffbf3}
        .avatar-upload-btn:disabled{opacity:0.6;cursor:not-allowed}
        .section-title{display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:15px;font-weight:700;color:#0f172a}
        .about-textarea{width:100%;min-width:0;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#0f172a;font-size:13px;outline:none;font-family:inherit;resize:none;height:96px;line-height:1.6;transition:border 0.2s}
        .about-textarea:focus{border-color:#EF9F27;background:#fff}
        .about-textarea::placeholder{color:#94a3b8}
        .gallery-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .price-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;background:#f8fafc;border:1px solid #eef1f5;border-radius:10px}
        .inline-add{display:flex;gap:8px;width:100%}
        .input{width:100%;padding:10px 13px;border-radius:10px;background:#f8fafc;border:1.5px solid #e2e8f0;color:#0f172a;font-size:13px;outline:none;font-family:inherit;min-width:0;transition:border 0.2s}
        .input:focus{border-color:#EF9F27;background:#fff}
        .input::placeholder{color:#94a3b8}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:640px){.pp-inner{padding:70px 16px 20px}.cat-grid{grid-template-columns:repeat(2,1fr)}.stat-grid{grid-template-columns:1fr 1fr}.stat-value{font-size:17px}.gallery-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:360px){.stat-value{font-size:16px}}
      `}</style>

      <div className="pp-inner">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:"#0f172a",marginBottom:4}}>Perfil de prestador</h1>
            <p style={{fontSize:13,color:"#64748b"}}>Gere o teu perfil profissional</p>
          </div>
          <button className="edit-btn" onClick={openEdit}><Edit size={14}/> Editar</button>
        </div>

        {/* ── Card principal ── */}
        <div className="pp-card">
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20,paddingBottom:20,borderBottom:"1px solid #eef1f5"}}>
            <div className="avatar-frame">
              {userAny?.avatarUrl
                ? <img src={userAny.avatarUrl} alt={user?.fullName ?? ""} />
                : <User size={32} style={{color:"#94a3b8"}}/>}
            </div>
            <div>
              {loading
                ? <div className="skeleton" style={{width:160,height:20,marginBottom:8}}/>
                : <p style={{fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:6}}>{user?.fullName ?? "—"}</p>}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,background:"#EF9F2712",color:"#EF9F27",border:"1px solid #EF9F2730"}}>Prestador</span>
                <span style={{
                  fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:99,
                  background: user?.isVerified ? "#1d9e7512" : "#fef2f2",
                  color:       user?.isVerified ? "#1D9E75"   : "#dc2626",
                  border:      `1px solid ${user?.isVerified ? "#1d9e7530" : "#fecaca"}`,
                }}>
                  {user?.isVerified ? "Verificado ✓" : "Verificação pendente"}
                </span>
              </div>
            </div>
          </div>

          {[
            {icon:Mail,      label:"Email",       value:user?.email,                       color:"#2563eb"},
            {icon:Phone,     label:"Telemóvel",   value:user?.phone||"+244 —",             color:"#1D9E75"},
            {icon:MapPin,    label:"Localização", value:"Luanda, Angola",                  color:"#EF9F27"},
            {icon:Briefcase, label:"Categoria",   value:userAny?.category||"Não definida", color:"#8B5CF6"},
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div className="info-row" key={i}>
                <div style={{width:38,height:38,borderRadius:10,background:`${item.color}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Icon size={16} style={{color:item.color}}/>
                </div>
                <div>
                  <p style={{fontSize:11,color:"#94a3b8",marginBottom:2}}>{item.label}</p>
                  {loading
                    ? <div className="skeleton" style={{width:130,height:14}}/>
                    : <p style={{fontSize:14,color:"#334155"}}>{item.value ?? "—"}</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Stats ── */}
        <div className="stat-grid">
          {[
            {label:"Pedidos recebidos", value:loading?"...":fmt(stats?.totalOrders??0)},
            {label:"Concluídos",        value:loading?"...":fmt(stats?.totalCompleted??0)},
            {label:"Avaliação média",   value:loading?"...":stats?.averageRating!=null?`${fmtRating(stats.averageRating)}★`:"—"},
          ].map((s, i) => (
            <div className="stat" key={i}>
              <p style={{fontSize:22,fontWeight:700,color:"#0f172a",marginBottom:4}}>{s.value}</p>
              <p style={{fontSize:12,color:"#64748b"}}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Sobre ── */}
        <div className="pp-card">
          <div className="section-title"><FileText size={15} style={{color:"#378ADD"}}/>Sobre</div>
          <textarea
            className="about-textarea"
            placeholder="Escreve uma breve biografia — experiência, especialização, o que te diferencia..."
            maxLength={600}
            value={bioDraft}
            onChange={e => setBioDraft(e.target.value)}
          />
          <button className="edit-btn" style={{marginTop:12}} disabled={savingBio} onClick={handleSaveBio}>
            {savingBio
              ? <Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>
              : <CheckCircle size={14}/>} Guardar biografia
          </button>
        </div>

        {/* ── Galeria ── */}
        <div className="pp-card">
          <div className="section-title"><ImageIcon size={15} style={{color:"#8B5CF6"}}/>Galeria de trabalhos</div>

          {gallery.length > 0 && (
            <div className="gallery-grid" style={{marginBottom:16}}>
              {gallery.map(img => (
                <div key={img.id} style={{position:"relative",aspectRatio:"1",borderRadius:10,overflow:"hidden",border:"1px solid #eef1f5"}}>
                  <img src={img.url} alt={img.caption||"Trabalho"} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  <button
                    onClick={() => handleRemoveGalleryImage(img.id)}
                    style={{
                      position:"absolute",top:6,right:6,
                      width:24,height:24,borderRadius:"50%",
                      background:"rgba(15,23,42,0.55)",border:"none",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      cursor:"pointer",
                    }}
                  >
                    <X size={12} style={{color:"white"}}/>
                  </button>
                </div>
              ))}
            </div>
          )}

          <label style={{
            display:"flex",alignItems:"center",gap:12,
            padding:"14px 16px",borderRadius:12,
            background:"#f8fafc",border:"1.5px dashed #e2e8f0",
            cursor: uploadingGallery ? "not-allowed" : "pointer",
            opacity: uploadingGallery ? 0.6 : 1,
            transition:"border-color 0.2s",
          }}>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{display:"none"}}
              disabled={uploadingGallery}
              onChange={async e => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                await handleAddGalleryImages(files);
              }}
            />
            {uploadingGallery
              ? <Loader2 size={20} style={{animation:"spin 1s linear infinite",color:"#8B5CF6",flexShrink:0}}/>
              : <ImageIcon size={20} style={{color:"#8B5CF6",flexShrink:0}}/>
            }
            <div>
              <p style={{fontSize:13,fontWeight:600,color:"#334155",margin:0}}>
                {uploadingGallery ? "A fazer upload..." : "Adicionar fotografias de trabalhos"}
              </p>
              <p style={{fontSize:11,color:"#94a3b8",margin:0}}>
                Clica para seleccionar · JPG, PNG · múltiplas fotos
              </p>
            </div>
          </label>
        </div>

        {/* ── Serviços e preços ── */}
        <div className="pp-card">
          <div className="section-title"><DollarSign size={15} style={{color:"#1D9E75"}}/>Serviços e preços</div>

          {pricedServices.length === 0
            ? <p style={{fontSize:13,color:"#94a3b8",marginBottom:16}}>Ainda não adicionaste serviços com preço.</p>
            : (
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {pricedServices.map(s => (
                  <div className="price-row" key={s.id}>
                    <span style={{fontSize:13,color:"#334155",fontWeight:600}}>{s.name}</span>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:13,color:"#1D9E75",fontWeight:800}}>{fKz(s.price)}</span>
                      <button
                        onClick={() => handleRemovePricedService(s.id)}
                        style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",display:"flex",transition:"color 0.15s"}}
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }

          <div className="inline-add">
            <input className="input" placeholder="Nome do serviço" value={newServiceName} onChange={e => setNewServiceName(e.target.value)}/>
            <input className="input" style={{maxWidth:130}} type="number" placeholder="Preço (Kz)" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)}/>
            <button className="add-btn" disabled={addingService} onClick={handleAddPricedService}>
              {addingService ? <Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> : <Plus size={13}/>} Adicionar
            </button>
          </div>
        </div>

        {/* ── KYC banner ── */}
        {!user?.isVerified && (
          <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"16px 20px",borderRadius:14,background:"#fffbf0",border:"1px solid #EF9F2730"}}>
            <Shield size={18} style={{color:"#EF9F27",flexShrink:0,marginTop:2}}/>
            <div style={{flex:1}}>
              <p style={{fontSize:14,fontWeight:600,color:"#0f172a",marginBottom:6}}>Verificação de identidade pendente</p>
              <p style={{fontSize:13,color:"#92743a",marginBottom:12,lineHeight:1.6}}>
                Completa o KYC para activar o teu perfil. Após verificação, a tua conta aparece nas categorias e no mapa.
              </p>
              <button className="kyc-btn" onClick={() => router.push("/kyc?role=provider")}>Completar verificação →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal edição ── */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"#0f172a"}}>Editar perfil</h2>
              <button onClick={() => setEditing(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b"}}><X size={20}/></button>
            </div>

            {error && (
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#b91c1c",marginBottom:14}}>
                {error}
              </div>
            )}
            {success && (
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#15803d",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <CheckCircle size={14}/> Guardado!
              </div>
            )}

            <label style={{fontSize:13,fontWeight:600,color:"#475569",display:"block",marginBottom:8}}>Foto de perfil</label>
            {avatarError && (
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#b91c1c",marginBottom:10}}>
                {avatarError}
              </div>
            )}
            <div className="avatar-upload-wrap">
              <div className="avatar-upload-frame">
                {userAny?.avatarUrl
                  ? <img src={userAny.avatarUrl} alt=""/>
                  : <User size={26} style={{color:"#94a3b8"}}/>}
              </div>
              <label className="avatar-upload-btn">
                {avatarUploading
                  ? <><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/> A enviar...</>
                  : <><Camera size={13}/> {userAny?.avatarUrl ? "Trocar foto" : "Escolher foto"}</>}
                <input
                  type="file"
                  accept="image/*"
                  style={{display:"none"}}
                  disabled={avatarUploading}
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    handleAvatarChange(file);
                  }}
                />
              </label>
            </div>

            <label style={{fontSize:13,fontWeight:600,color:"#475569",display:"block",marginBottom:6}}>Nome completo</label>
            <input className="modal-input" value={form.fullName} onChange={e => setForm({...form,fullName:e.target.value})} placeholder="O teu nome"/>

            <label style={{fontSize:13,fontWeight:600,color:"#475569",display:"block",marginBottom:6}}>Telemóvel</label>
            <input className="modal-input" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="+244 9XX XXX XXX"/>

            <label style={{fontSize:13,fontWeight:600,color:"#475569",display:"block",marginBottom:8}}>Categoria</label>
            <div className="cat-grid">
              {CATEGORIES.map((c, i) => (
                <button key={i} className={`cat-opt${form.category===c?" sel":""}`} onClick={() => setForm({...form,category:c})}>{c}</button>
              ))}
            </div>

            <button className="save-btn" disabled={saving} onClick={handleSave}>
              {saving ? <><Loader2 size={15}/>A guardar...</> : "Guardar alterações"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
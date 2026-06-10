"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Clock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { providerCatalogApi, CreateCatalogPayload } from "@/lib/provider-catalog.api";
import { getToken } from "@/lib/auth.api";

const CATEGORIES = [
  "Limpeza","Climatização","Canalização","Eletricista",
  "TI & Redes","Jardinagem","Mudanças","Beleza",
  "Automóvel","Pintura","Construção","Segurança",
];

interface FormState { title:string; cat:string; desc:string; address:string; price:string; }

function validate(form: FormState): string | null {
  if (!form.title.trim()) return "O título é obrigatório.";
  if (!form.cat)          return "Selecciona uma categoria.";
  if (!form.desc.trim())  return "A descrição é obrigatória.";
  if (form.price && Number(form.price)<=0) return "O preço deve ser maior que 0.";
  return null;
}

export default function ProviderNewServicePage() {
  const router = useRouter();
  const [form, setForm]       = useState<FormState>({title:"",cat:"",desc:"",address:"",price:""});
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    const err = validate(form);
    if (err) { setError(err); return; }
    if (!getToken()) { router.push("/"); return; }

    setLoading(true); setError("");
    try {
      const payload: CreateCatalogPayload = {
        title:      form.title.trim(),
        description:form.desc.trim(),
        category:   form.cat,
        address:    form.address.trim() || undefined,
        pricePerHour: form.price ? Number(form.price) : undefined,
      };
      await providerCatalogApi.create(payload);
      setSuccess(true);
      // Redireciona para o perfil (onde está o catálogo), não para pedidos
      setTimeout(() => router.push("/provider/profile"), 1600);
    } catch (e:any) {
      setError(e.message || "Erro ao publicar. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16,textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:20,background:"#EF9F2720",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <CheckCircle size={32} style={{color:"#EF9F27"}}/>
        </div>
        <p style={{fontSize:18,fontWeight:700,color:"#e2e8f0"}}>Serviço adicionado ao catálogo!</p>
        <p style={{fontSize:14,color:"#4a6a6a"}}>A redirecionar para o teu perfil profissional...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .ns-inner{padding:28px 32px;max-width:640px;display:flex;flex-direction:column;gap:0}
        .ns-input{width:100%;padding:14px 16px;border-radius:12px;background:#131b27;border:1px solid #1a2535;color:#e2e8f0;font-size:14px;outline:none;transition:border 0.2s;margin-bottom:16px;font-family:inherit}
        .ns-input:focus{border-color:#EF9F27}
        .ns-input::placeholder{color:#4a5a6a}
        .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px}
        .cat-opt{padding:10px 6px;border-radius:10px;font-size:12px;cursor:pointer;text-align:center;border:1px solid #1a2535;background:#131b27;color:#6a7a8a;transition:all 0.15s;font-family:inherit}
        .cat-opt.sel{border-color:#EF9F27;background:#EF9F2715;color:#EF9F27}
        .cat-opt:hover:not(.sel){border-color:#EF9F2740;color:#c0d0e0}
        .label{font-size:13px;font-weight:600;color:#6a7a8a;display:block;margin-bottom:6px}
        .submit-btn{width:100%;padding:15px;border-radius:12px;border:none;background:#EF9F27;color:#0d1117;font-size:15px;font-weight:700;cursor:pointer;margin-top:8px;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.2s}
        .submit-btn:disabled{opacity:0.6;cursor:not-allowed}
        .back-btn{display:flex;align-items:center;gap:6px;font-size:13px;color:#4a6a6a;background:none;border:none;cursor:pointer;margin-bottom:24px;font-family:inherit;padding:0}
        .error-box{background:#E24B4A15;border:1px solid #E24B4A30;border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:10px;font-size:13px;color:#E24B4A;margin-bottom:16px}
        @media(max-width:640px){.ns-inner{padding:70px 16px 20px}.cat-grid{grid-template-columns:repeat(2,1fr)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div className="ns-inner">
        <button onClick={()=>router.back()} className="back-btn">
          <ArrowLeft size={15}/> Voltar
        </button>

        <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Adicionar ao catálogo</h1>
        <p style={{fontSize:13,color:"#4a6a6a",marginBottom:28}}>
          Publica um serviço que ofereces para que clientes te encontrem no mercado
        </p>

        {error && (
          <div className="error-box">
            <AlertCircle size={15} style={{flexShrink:0}}/> {error}
          </div>
        )}

        <label className="label">Título do serviço *</label>
        <input className="ns-input" placeholder="Ex: Instalação de ar condicionado split"
          value={form.title} onChange={e=>{setForm({...form,title:e.target.value});setError("");}}/>

        <label className="label">Categoria *</label>
        <div className="cat-grid">
          {CATEGORIES.map((c,i)=>(
            <button key={i} className={`cat-opt${form.cat===c?" sel":""}`}
              onClick={()=>{setForm({...form,cat:c});setError("");}}>
              {c}
            </button>
          ))}
        </div>

        <label className="label">Descrição do serviço *</label>
        <textarea className="ns-input" rows={4}
          placeholder="Descreve o que fazes, a tua experiência, equipamentos..."
          style={{resize:"none"}}
          value={form.desc} onChange={e=>{setForm({...form,desc:e.target.value});setError("");}}/>

        <label className="label">
          <MapPin size={13} style={{display:"inline",marginRight:4,color:"#EF9F27"}}/>
          Área de trabalho (opcional)
        </label>
        <input className="ns-input" placeholder="Ex: Luanda, Talatona, Kilamba..."
          value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>

        <label className="label">
          <Clock size={13} style={{display:"inline",marginRight:4,color:"#EF9F27"}}/>
          Preço por hora (Kz) (opcional)
        </label>
        <input className="ns-input" type="number" placeholder="Ex: 5000" min="1"
          value={form.price} onChange={e=>{setForm({...form,price:e.target.value});setError("");}}/>

        <div style={{padding:"12px 16px",borderRadius:12,background:"#2a1e08",border:"1px solid #EF9F2725",marginBottom:16}}>
          <p style={{fontSize:12,color:"#8a6a3a",lineHeight:1.6}}>
            💡 Este serviço fica visível no teu perfil profissional. Clientes podem encontrar-te e criar um pedido directamente para ti.
          </p>
        </div>

        <button className="submit-btn" disabled={loading} onClick={handleSubmit}>
          {loading
            ? <><Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/> A publicar...</>
            : "Adicionar ao catálogo →"}
        </button>
      </div>
    </>
  );
}
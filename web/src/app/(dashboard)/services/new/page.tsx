"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { ArrowLeft, MapPin, Calendar, Clock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { servicesApi } from "@/lib/services.api";
import { getToken } from "@/lib/auth.api";
import { CATEGORY_NAMES } from "@/lib/categories";

interface FormState { title:string; category:string; description:string; address:string; date:string; time:string; budget:string; }

function validate(form: FormState): string|null {
  if (!form.title.trim())       return "O título é obrigatório.";
  if (!form.category)           return "Selecciona uma categoria.";
  if (!form.description.trim()) return "A descrição é obrigatória.";
  if (!form.address.trim())     return "A morada é obrigatória.";
  if (!form.budget || Number(form.budget)<=0) return "O orçamento deve ser maior que 0.";
  return null;
}

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm]       = useState<FormState>({title:"",category:"",description:"",address:"",date:"",time:"",budget:""});

  const set = (key: keyof FormState, val: string) => {
    setForm(f=>({...f,[key]:val}));
    setError("");
  };

  const handleSubmit = async () => {
  const err = validate(form);
  if (err) { setError(err); return; }

  const token = getToken();
  if (!token) { router.push("/"); return; }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== "client") {
      setError(
        `A tua conta activa é do tipo "${payload.role}". Para criar pedidos de serviço precisas de estar logado como cliente. Faz logout e entra com a tua conta de cliente.`
      );
      return;
    }
  } catch {
    setError("Sessão inválida. Faz logout e login novamente.");
    return;
  }

  setLoading(true); setError("");
  try {
    const scheduledAt = form.date && form.time
      ? new Date(`${form.date}T${form.time}`).toISOString()
      : form.date ? new Date(`${form.date}T09:00`).toISOString()
      : undefined;

    await servicesApi.create({
      title:       form.title.trim(),
      description: form.description.trim(),
      category:    form.category,
      address:     form.address.trim(),
      budget:      Number(form.budget),
      scheduledAt,
    });
    setSuccess(true);
    setTimeout(()=>router.push("/services"), 1500);
  } catch (e:any) {
    setError(e.message || "Erro ao criar pedido. Tenta novamente.");
  } finally {
    setLoading(false);
  }
 };

  if (success) {
    return (
      <div style={{minHeight:"100vh",background:"#FFFFFF",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div style={{width:64,height:64,borderRadius:20,background:"#E3F5EE",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <CheckCircle size={32} style={{color:"#0E7A5F"}}/>
          </div>
          <p style={{fontSize:18,fontWeight:700,color:"#0F172A"}}>Pedido criado com sucesso!</p>
          <p style={{fontSize:14,color:"#4B5563"}}>A redirecionar para os teus serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .ns-wrap{display:flex;min-height:100vh;background:#FFFFFF}
        .ns-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .ns-inner{flex:1;padding:28px 32px;max-width:640px;display:flex;flex-direction:column;gap:0}
        .ns-input{width:100%;padding:14px 16px;border-radius:12px;background:#F1F5F9;border:1px solid #CBD5E1;color:#111827;font-size:14px;outline:none;transition:border 0.2s;margin-bottom:16px;font-family:inherit}
        .ns-input:focus{border-color:#0E7A5F}
        .ns-input::placeholder{color:#94A3B8}
        .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px}
        .cat-opt{padding:10px 6px;border-radius:10px;font-size:12px;cursor:pointer;text-align:center;border:1px solid #CBD5E1;background:#E2E8F0;color:#475569;transition:all 0.15s;font-family:inherit}
        .cat-opt.sel{border-color:#0E7A5F;background:#E3F5EE;color:#0E7A5F}
        .cat-opt:hover:not(.sel){border-color:#0E7A5F60;color:#0F172A}
        .label{font-size:13px;font-weight:600;color:#374151;display:block;margin-bottom:6px}
        .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .submit-btn{width:100%;padding:15px;border-radius:12px;border:none;background:#0E7A5F;color:white;font-size:15px;font-weight:700;cursor:pointer;margin-top:8px;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.2s}
        .submit-btn:disabled{opacity:0.6;cursor:not-allowed}
        .submit-btn:hover:not(:disabled){opacity:0.9}
        .error-box{background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px;padding:12px 16px;display:flex;align-items:flex-start;gap:10px;font-size:13px;color:#B91C1C;margin-bottom:16px;line-height:1.5}
        @media(max-width:1024px){.ns-main{margin-left:0}}
        @media(max-width:640px){.ns-inner{padding:70px 16px 20px}.cat-grid{grid-template-columns:repeat(2,1fr)}.row2{grid-template-columns:1fr}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div className="ns-wrap">
        <Sidebar/>
        <div className="ns-main">
          <Navbar/>
          <div className="ns-inner">
            <button onClick={()=>router.back()} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#475569",background:"none",border:"none",cursor:"pointer",marginBottom:24,fontFamily:"inherit",padding:0}}>
              <ArrowLeft size={15}/> Voltar
            </button>

            <h1 style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:4}}>Novo pedido de serviço</h1>
            <p style={{fontSize:13,color:"#4B5563",marginBottom:28}}>Descreve o que precisas e recebe propostas de prestadores verificados</p>

            {error && (
              <div className="error-box">
                <AlertCircle size={15} style={{flexShrink:0,marginTop:1}}/> {error}
              </div>
            )}

            <label className="label">Título do pedido *</label>
            <input className="ns-input" placeholder="Ex: Limpeza de apartamento T3"
              value={form.title} onChange={e=>set("title",e.target.value)}/>

            <label className="label">Categoria *</label>
            <div className="cat-grid">
              {CATEGORY_NAMES.map((c,i)=>(
                <button key={i} className={`cat-opt${form.category===c?" sel":""}`} onClick={()=>set("category",c)}>{c}</button>
              ))}
            </div>

            <label className="label">Descrição detalhada *</label>
            <textarea className="ns-input" rows={4}
              placeholder="Descreve o trabalho com o máximo de detalhe — dimensões, materiais, urgência..."
              style={{resize:"none"}} value={form.description} onChange={e=>set("description",e.target.value)}/>

            <label className="label">
              <MapPin size={13} style={{display:"inline",marginRight:4,color:"#0E7A5F"}}/>
              Morada *
            </label>
            <input className="ns-input" placeholder="Rua, número, bairro — Luanda"
              value={form.address} onChange={e=>set("address",e.target.value)}/>

            <div className="row2">
              <div>
                <label className="label">
                  <Calendar size={13} style={{display:"inline",marginRight:4,color:"#0E7A5F"}}/>
                  Data preferida
                </label>
                <input className="ns-input" type="date" value={form.date} onChange={e=>set("date",e.target.value)}/>
              </div>
              <div>
                <label className="label">
                  <Clock size={13} style={{display:"inline",marginRight:4,color:"#0E7A5F"}}/>
                  Hora preferida
                </label>
                <input className="ns-input" type="time" value={form.time} onChange={e=>set("time",e.target.value)}/>
              </div>
            </div>

            <label className="label">Orçamento máximo (Kz) *</label>
            <input className="ns-input" type="number" placeholder="Ex: 10000" min="1"
              value={form.budget} onChange={e=>set("budget",e.target.value)}/>

            <button className="submit-btn" disabled={loading} onClick={handleSubmit}>
              {loading ? <><Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/> A publicar...</> : "Publicar pedido →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
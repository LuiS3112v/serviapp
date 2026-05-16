"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Eye, EyeOff, CheckCircle, Upload } from "lucide-react";

const categories = ["Limpeza","Climatização","Canalização","Eletricista","TI & Redes","Jardinagem","Mudanças","Beleza","Automóvel","Pintura","Construção","Segurança"];

export default function RegisterProviderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", bio: "" });

  return (
    <>
      <style>{`
        .auth-wrap { min-height: 100vh; background: #0d1117; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .auth-card { width: 100%; max-width: 460px; background: #131b27; border: 1px solid #1a2535; border-radius: 24px; padding: 40px 36px; }
        .auth-input { width: 100%; padding: 14px 16px; border-radius: 12px; background: #0d1117; border: 1px solid #1a2535; color: #e2e8f0; font-size: 14px; outline: none; transition: border 0.2s; margin-bottom: 16px; }
        .auth-input:focus { border-color: #EF9F27; }
        .auth-input::placeholder { color: #4a5a6a; }
        .auth-btn { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #EF9F27; color: #0d1117; font-size: 15px; font-weight: 700; cursor: pointer; }
        .progress-bar { height: 4px; border-radius: 99px; background: #1a2535; margin-bottom: 28px; }
        .progress-fill { height: 100%; border-radius: 99px; background: #EF9F27; transition: width 0.3s; }
        .cat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 20px; }
        .cat-opt { padding: 10px 6px; border-radius: 10px; font-size: 12px; cursor: pointer; text-align: center; border: 1px solid #1a2535; background: #0d1117; color: #6a7a8a; transition: all 0.15s; }
        .cat-opt.sel { border-color: #EF9F27; background: #EF9F2715; color: #EF9F27; }
        .upload-area { border: 2px dashed #1a2535; border-radius: 14px; padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 16px; transition: border 0.2s; }
        .upload-area:hover { border-color: #EF9F27; }
        @media (max-width: 480px) { .auth-card { padding: 28px 20px; } .cat-grid { grid-template-columns: repeat(2,1fr); } }
      `}</style>
      <div className="auth-wrap">
        <div className="auth-card">
          <button onClick={() => step === 1 ? router.push("/") : setStep(s => s - 1)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a6a6a", background: "none", border: "none", cursor: "pointer", marginBottom: 24 }}>
            <ArrowLeft size={15} /> {step === 1 ? "Voltar" : "Passo anterior"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EF9F27", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={20} color="#0d1117" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>Criar perfil de prestador</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Passo {step} de 3</p>
            </div>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
          </div>

          {step === 1 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Nome completo</label>
              <input className="auth-input" placeholder="O teu nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Email</label>
              <input className="auth-input" type="email" placeholder="o-teu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Telemóvel</label>
              <input className="auth-input" placeholder="+244 9XX XXX XXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Senha</label>
              <div style={{ position: "relative", marginBottom: 20 }}>
                <input className="auth-input" type={show ? "text" : "password"} placeholder="Mínimo 6 caracteres" style={{ marginBottom: 0, paddingRight: 44 }} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a5a6a" }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button className="auth-btn" onClick={() => setStep(2)}>Continuar →</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 10 }}>Categoria de serviço</label>
              <div className="cat-grid">
                {categories.map((c, i) => (
                  <button key={i} className={`cat-opt${selectedCat === c ? " sel" : ""}`} onClick={() => setSelectedCat(c)}>{c}</button>
                ))}
              </div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Descrição do teu serviço</label>
              <textarea className="auth-input" rows={3} placeholder="Descreve o teu serviço, experiência e especialização..." style={{ resize: "none" }} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Preço hora (Kz)</label>
              <input className="auth-input" type="number" placeholder="Ex: 5000" />
              <button className="auth-btn" onClick={() => setStep(3)}>Continuar →</button>
            </div>
          )}

          {step === 3 && (
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#c0d0e0", marginBottom: 6 }}>Verificação de identidade (KYC)</p>
              <p style={{ fontSize: 13, color: "#4a6a6a", marginBottom: 20, lineHeight: 1.6 }}>Para garantir a segurança dos clientes, precisamos verificar a tua identidade.</p>

              <div className="upload-area">
                <Upload size={24} style={{ color: "#4a5a6a" }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a" }}>Bilhete de identidade</p>
                <p style={{ fontSize: 12, color: "#3a4a5a" }}>Frente e verso — JPG, PNG ou PDF</p>
              </div>

              <div className="upload-area">
                <Upload size={24} style={{ color: "#4a5a6a" }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a" }}>Selfie com o BI</p>
                <p style={{ fontSize: 12, color: "#3a4a5a" }}>Segura o documento junto ao rosto</p>
              </div>

              <div style={{ background: "#2a1e08", border: "1px solid #EF9F2725", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                {["O perfil só fica visível após aprovação (48h)", "Os documentos são tratados de forma confidencial", "Aprovação manual pela equipa Serviapp"].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
                    <CheckCircle size={14} style={{ color: "#EF9F27", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#8a6a3a" }}>{t}</span>
                  </div>
                ))}
              </div>

              <button className="auth-btn" onClick={() => router.push("/home")}>Submeter e aguardar aprovação →</button>
            </div>
          )}

          <p style={{ textAlign: "center", fontSize: 13, color: "#4a6a6a", marginTop: 20 }}>
            Já tens conta?{" "}
            <button onClick={() => router.push("/login")} style={{ color: "#1D9E75", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
              Entrar
            </button>
          </p>
        </div>
      </div>
    </>
  );
}
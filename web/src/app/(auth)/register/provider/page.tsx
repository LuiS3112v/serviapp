"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Eye, EyeOff, CheckCircle, Upload } from "lucide-react";

const categories = [
  "Limpeza", "Climatização", "Canalização", "Eletricista",
  "TI & Redes", "Jardinagem", "Mudanças", "Beleza",
  "Automóvel", "Pintura", "Construção", "Segurança",
];

export default function RegisterProviderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", bio: "" });

  return (
    <>
      <style>{`
        .auth *{box-sizing:border-box}
        .auth-wrap { min-height: 100vh; background: #f8fafc; background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 22px 22px; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: inherit; }
        .auth-card { width: 100%; max-width: 460px; background: #ffffff; border: 1px solid #eef1f5; border-radius: 24px; padding: 40px 36px; box-shadow: 0 20px 50px rgba(15,23,42,0.08); }
        .auth-back { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #64748b; background: none; border: none; cursor: pointer; margin-bottom: 24px; padding: 0; transition: color .15s; }
        .auth-back:hover { color: #EF9F27; }
        .auth-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .auth-logo-mark { width: 42px; height: 42px; border-radius: 13px; background: linear-gradient(135deg,#EF9F27,#f5b955); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 6px 16px rgba(239,159,39,0.28); }
        .auth-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
        .auth-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
        .auth-label { font-size: 13px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px; }
        .auth-input { width: 100%; padding: 14px 16px; border-radius: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; color: #0f172a; font-size: 14px; outline: none; transition: border-color .15s, background .15s; margin-bottom: 16px; font-family: inherit; }
        .auth-input:focus { border-color: #EF9F27; background: #fff; }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; }
        .auth-eye:hover { color: #475569; }
        .auth-btn { width: 100%; padding: 15px; border-radius: 12px; border: none; background: linear-gradient(135deg,#EF9F27,#f5b955); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: transform .15s, box-shadow .15s; box-shadow: 0 8px 20px rgba(239,159,39,0.25); font-family: inherit; }
        .auth-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(239,159,39,0.32); }
        .progress-bar { height: 5px; border-radius: 99px; background: #eef1f5; margin-bottom: 26px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#EF9F27,#f5b955); transition: width 0.3s; }
        .cat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 20px; }
        .cat-opt { padding: 10px 6px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: center; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #64748b; transition: all 0.15s; font-family: inherit; }
        .cat-opt:hover { border-color: #fcd9a1; }
        .cat-opt.sel { border-color: #EF9F27; background: #fef3e2; color: #b96f0f; }
        .upload-area { border: 2px dashed #e2e8f0; border-radius: 14px; padding: 26px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; margin-bottom: 16px; transition: border-color .2s, background .2s; background: #f8fafc; }
        .upload-area:hover { border-color: #EF9F27; background: #fffbf3; }
        .auth-perks { border-radius: 14px; padding: 15px 16px; margin-bottom: 20px; }
        .auth-perk-row { display: flex; align-items: center; gap: 8px; }
        .auth-footer-text { text-align: center; font-size: 13px; color: #64748b; margin-top: 20px; }
        .auth-link-btn { color: #1D9E75; font-weight: 700; background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; font-size: inherit; }
        @media (max-width: 480px) { .auth-card { padding: 30px 22px; } .cat-grid { grid-template-columns: repeat(2,1fr); } }
      `}</style>

      <div className="auth">
        <div className="auth-wrap">
          <div className="auth-card">

            <button
              className="auth-back"
              onClick={() => step === 1 ? router.back() : setStep(s => s - 1)}
            >
              <ArrowLeft size={15} /> {step === 1 ? "Voltar" : "Passo anterior"}
            </button>

            <div className="auth-logo-row">
              <div className="auth-logo-mark"><Zap size={20} color="#fff" /></div>
              <div>
                <p className="auth-title">Criar perfil de prestador</p>
                <p className="auth-subtitle">Passo {step} de 3</p>
              </div>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            {/* ── Passo 1: Dados de acesso ─────────────────────────────── */}
            {step === 1 && (
              <div>
                <label className="auth-label">Nome completo</label>
                <input className="auth-input" placeholder="O teu nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

                <label className="auth-label">Email</label>
                <input className="auth-input" type="email" placeholder="o-teu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

                <label className="auth-label">Telemóvel</label>
                <input className="auth-input" placeholder="+244 9XX XXX XXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

                <label className="auth-label">Senha</label>
                <div style={{ position: "relative", marginBottom: 20 }}>
                  <input
                    className="auth-input"
                    type={show ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    style={{ marginBottom: 0, paddingRight: 44 }}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button className="auth-eye" onClick={() => setShow(!show)} type="button">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button className="auth-btn" onClick={() => setStep(2)}>Continuar →</button>
              </div>
            )}

            {/* ── Passo 2: Categoria e descrição ──────────────────────── */}
            {step === 2 && (
              <div>
                <label className="auth-label" style={{ marginBottom: 10 }}>Categoria de serviço</label>
                <div className="cat-grid">
                  {categories.map((c, i) => (
                    <button key={i} type="button" className={`cat-opt${selectedCat === c ? " sel" : ""}`} onClick={() => setSelectedCat(c)}>{c}</button>
                  ))}
                </div>

                <label className="auth-label">Descrição do teu serviço</label>
                <textarea
                  className="auth-input"
                  rows={3}
                  placeholder="Descreve o teu serviço, experiência e especialização..."
                  style={{ resize: "none" }}
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                />

                <label className="auth-label">Preço hora (Kz)</label>
                <input className="auth-input" type="number" placeholder="Ex: 5000" />

                <button className="auth-btn" onClick={() => setStep(3)}>Continuar →</button>
              </div>
            )}

            {/* ── Passo 3: Verificação KYC ────────────────────────────── */}
            {step === 3 && (
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Verificação de identidade (KYC)</p>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
                  Para garantir a segurança dos clientes, precisamos verificar a tua identidade.
                </p>

                <div className="upload-area">
                  <Upload size={22} style={{ color: "#94a3b8" }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Bilhete de identidade</p>
                  <p style={{ fontSize: 12, color: "#94a3b8" }}>Frente e verso — JPG, PNG ou PDF</p>
                </div>

                <div className="upload-area">
                  <Upload size={22} style={{ color: "#94a3b8" }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Selfie com o BI</p>
                  <p style={{ fontSize: 12, color: "#94a3b8" }}>Segura o documento junto ao rosto</p>
                </div>

                <div className="auth-perks" style={{ background: "#fef3e2", border: "1px solid #fcd9a1" }}>
                  {[
                    "O perfil só fica visível após aprovação (48h)",
                    "Os documentos são tratados de forma confidencial",
                    "Aprovação manual pela equipa Serviapp",
                  ].map((t, i) => (
                    <div key={i} className="auth-perk-row" style={{ marginBottom: i < 2 ? 8 : 0 }}>
                      <CheckCircle size={14} style={{ color: "#EF9F27", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#8a5a12" }}>{t}</span>
                    </div>
                  ))}
                </div>

                <button className="auth-btn" onClick={() => router.push("/home")}>
                  Submeter e aguardar aprovação →
                </button>
              </div>
            )}

            <p className="auth-footer-text">
              Já tens conta?{" "}
              <button className="auth-link-btn" onClick={() => router.push("/login")}>
                Entrar
              </button>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
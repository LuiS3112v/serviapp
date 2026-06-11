"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function RegisterClientPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  return (
    <>
      <style>{`
        .auth-wrap { min-height: 100vh; background: #0d1117; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .auth-card { width: 100%; max-width: 420px; background: #131b27; border: 1px solid #1a2535; border-radius: 24px; padding: 40px 36px; }
        .auth-input { width: 100%; padding: 14px 16px; border-radius: 12px; background: #0d1117; border: 1px solid #1a2535; color: #e2e8f0; font-size: 14px; outline: none; transition: border 0.2s; margin-bottom: 16px; }
        .auth-input:focus { border-color: #1D9E75; }
        .auth-input::placeholder { color: #4a5a6a; }
        .auth-btn { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #1D9E75; color: white; font-size: 15px; font-weight: 700; cursor: pointer; }
        .progress-bar { height: 4px; border-radius: 99px; background: #1a2535; margin-bottom: 28px; }
        .progress-fill { height: 100%; border-radius: 99px; background: #1D9E75; transition: width 0.3s; }
        @media (max-width: 480px) { .auth-card { padding: 28px 20px; } }
      `}</style>
      <div className="auth-wrap">
        <div className="auth-card">
          <button onClick={() => step === 1 ? router.push("/") : setStep(1)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a6a6a", background: "none", border: "none", cursor: "pointer", marginBottom: 24 }}>
            <ArrowLeft size={15} /> {step === 1 ? "Voltar" : "Passo anterior"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>Criar conta de cliente</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Passo {step} de 2</p>
            </div>
          </div>

          <div className="progress-bar">
            <div className="progress-fill" style={{ width: step === 1 ? "50%" : "100%" }} />
          </div>

          {step === 1 ? (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Nome completo</label>
              <input className="auth-input" placeholder="O teu nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Email</label>
              <input className="auth-input" type="email" placeholder="o-teu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Telemóvel</label>
              <input className="auth-input" placeholder="+244 9XX XXX XXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

              <button className="auth-btn" onClick={() => setStep(2)}>Continuar →</button>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Criar senha</label>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <input className="auth-input" type={show ? "text" : "password"} placeholder="Mínimo 6 caracteres" style={{ marginBottom: 0, paddingRight: 44 }} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a5a6a" }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div style={{ background: "#0b2a2a", border: "1px solid #1d9e7525", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                {["Pagamento 100% protegido", "Acesso a prestadores verificados", "Chat integrado na plataforma"].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
                    <CheckCircle size={14} style={{ color: "#1D9E75", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#4a8a6a" }}>{t}</span>
                  </div>
                ))}
              </div>

              <button className="auth-btn" onClick={() => router.push("/home")}>Criar conta →</button>

              <p style={{ textAlign: "center", fontSize: 12, color: "#3a4a5a", marginTop: 16, lineHeight: 1.6 }}>
                Ao criar conta aceitas os nossos{" "}
                <span style={{ color: "#1D9E75", cursor: "pointer" }}>Termos de Serviço</span>
              </p>
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
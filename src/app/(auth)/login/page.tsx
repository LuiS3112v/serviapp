"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = () => {
    if (!form.email || !form.password) { setError("Preenche todos os campos."); return; }
    if (form.password.length < 6) { setError("Senha incorrecta. Tenta novamente."); return; }
    setError("");
    router.push("/home");
  };

  return (
    <>
      <style>{`
        .auth-wrap { min-height: 100vh; background: #0d1117; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .auth-card { width: 100%; max-width: 420px; background: #131b27; border: 1px solid #1a2535; border-radius: 24px; padding: 40px 36px; }
        .input-wrap { position: relative; margin-bottom: 16px; }
        .auth-input { width: 100%; padding: 14px 16px; border-radius: 12px; background: #0d1117; border: 1px solid #1a2535; color: #e2e8f0; font-size: 14px; outline: none; transition: border 0.2s; }
        .auth-input:focus { border-color: #1D9E75; }
        .auth-input::placeholder { color: #4a5a6a; }
        .auth-btn { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #1D9E75; color: white; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; margin-top: 8px; }
        .auth-btn:hover { opacity: 0.9; }
        .error-msg { background: #E24B4A20; border: 1px solid #E24B4A40; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #E24B4A; margin-bottom: 16px; }
        @media (max-width: 480px) { .auth-card { padding: 28px 20px; } }
      `}</style>
      <div className="auth-wrap">
        <div className="auth-card">
          <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a6a6a", background: "none", border: "none", cursor: "pointer", marginBottom: 28 }}>
            <ArrowLeft size={15} /> Voltar
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>Entrar na conta</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Bem-vindo de volta à Serviapp</p>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Email</label>
            <div className="input-wrap">
              <input className="auth-input" type="email" placeholder="o-teu@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Senha</label>
            <div className="input-wrap" style={{ marginBottom: 8 }}>
              <input className="auth-input" type={show ? "text" : "password"} placeholder="A tua senha"
                style={{ paddingRight: 44 }}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a5a6a" }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div style={{ textAlign: "right", marginBottom: 20 }}>
              <button style={{ fontSize: 13, color: "#1D9E75", background: "none", border: "none", cursor: "pointer" }}>
                Esqueci a senha
              </button>
            </div>

            <button className="auth-btn" onClick={handleLogin}>Entrar</button>

            <p style={{ textAlign: "center", fontSize: 13, color: "#4a6a6a", marginTop: 20 }}>
              Não tens conta?{" "}
              <button onClick={() => router.push("/")} style={{ color: "#1D9E75", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                Criar conta
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Shield, Star, MapPin, CheckCircle, ArrowRight, Eye, EyeOff } from "lucide-react";

type Mode = "entry" | "login-client" | "login-provider" | "signup-client" | "signup-provider";

export default function EntryPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("entry");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const reset = (m: Mode) => { setMode(m); setError(""); setStep(1); setForm({ name: "", email: "", phone: "", password: "" }); };

  const handleLogin = () => {
    if (!form.email || !form.password) { setError("Preenche todos os campos."); return; }
    if (form.password.length < 6) { setError("Senha incorrecta. Tenta novamente."); return; }
    if (mode === "login-provider") { router.push("/provider-home"); return; }
    router.push("/home");
  };

  const features = [
    { icon: Shield, color: "#1D9E75", text: "Pagamento 100% protegido com escrow" },
    { icon: CheckCircle, color: "#378ADD", text: "Prestadores verificados com KYC" },
    { icon: MapPin, color: "#EF9F27", text: "Geolocalização em tempo real" },
    { icon: Star, color: "#D4537E", text: "Sistema de avaliações e ranking" },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d1117; }
        .entry-page { min-height: 100vh; background: #0d1117; display: grid; grid-template-columns: 1fr 1fr; }
        .entry-left { background: #0b2a2a; border-right: 1px solid #1d9e7530; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; gap: 32px; }
        .entry-right { display: flex; align-items: center; justify-content: center; padding: 48px; overflow-y: auto; }
        .entry-card { width: 100%; max-width: 420px; }
        .auth-input { width: 100%; padding: 14px 16px; border-radius: 12px; background: #0d1117; border: 1px solid #1a2535; color: #e2e8f0; font-size: 14px; outline: none; transition: border 0.2s; margin-bottom: 14px; font-family: inherit; }
        .auth-input:focus { border-color: #1D9E75; }
        .auth-input::placeholder { color: #4a5a6a; }
        .auth-btn-green { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #1D9E75; color: white; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; font-family: inherit; }
        .auth-btn-green:hover { opacity: 0.9; }
        .auth-btn-amber { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #EF9F27; color: #0d1117; font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; font-family: inherit; }
        .auth-btn-amber:hover { opacity: 0.9; }
        .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
        .role-btn { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px 14px; border-radius: 18px; cursor: pointer; transition: all 0.2s; border: 2px solid #1a2535; background: #131b27; }
        .role-btn:hover { transform: translateY(-2px); }
        .role-btn.green:hover { border-color: #1D9E75; }
        .role-btn.amber:hover { border-color: #EF9F27; }
        .progress-bar { height: 4px; border-radius: 99px; background: #1a2535; margin-bottom: 24px; }
        .progress-fill { height: 100%; border-radius: 99px; transition: width 0.3s; }
        .error-msg { background: #E24B4A15; border: 1px solid #E24B4A30; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #E24B4A; margin-bottom: 14px; }
        .link-btn { background: none; border: none; cursor: pointer; font-size: 13px; font-family: inherit; }
        .back-btn { display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; font-size: 13px; color: #4a6a6a; margin-bottom: 24px; font-family: inherit; padding: 0; }
        .divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
        .divider span { font-size: 12px; color: #3a4a5a; white-space: nowrap; }
        .divider-line { flex: 1; height: 1px; background: #1a2535; }
        .cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
        .cat-opt { padding: 9px 6px; border-radius: 10px; font-size: 12px; cursor: pointer; text-align: center; border: 1px solid #1a2535; background: #0d1117; color: #6a7a8a; transition: all 0.15s; font-family: inherit; }
        .cat-opt.sel-green { border-color: #1D9E75; background: #1d9e7515; color: #1D9E75; }
        .upload-area { border: 2px dashed #1a2535; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 14px; transition: border 0.2s; text-align: center; }
        .upload-area:hover { border-color: #EF9F27; }
        @media (max-width: 900px) {
          .entry-page { grid-template-columns: 1fr; }
          .entry-left { display: none; }
          .entry-right { padding: 24px; align-items: flex-start; padding-top: 40px; }
        }
        @media (max-width: 480px) {
          .entry-right { padding: 20px; }
          .role-grid { grid-template-columns: 1fr; }
          .cat-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="entry-page">
        <div className="entry-left">
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Zap size={32} color="white" />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>
              Servi<span style={{ color: "#1D9E75" }}>app</span>
            </h1>
            <p style={{ fontSize: 15, color: "#4a7a7a", lineHeight: 1.7, maxWidth: 320, margin: "0 auto" }}>
              A plataforma que liga clientes a prestadores de serviços verificados em Angola.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "#091e1e", border: "1px solid #1a3535" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${f.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} style={{ color: f.color }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#6a8a7a" }}>{f.text}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 20, textAlign: "center" }}>
            {[{ v: "500+", l: "Prestadores" }, { v: "15+", l: "Categorias" }, { v: "4.9★", l: "Avaliação" }].map((s, i) => (
              <div key={i}>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#1D9E75" }}>{s.v}</p>
                <p style={{ fontSize: 12, color: "#4a6a6a", marginTop: 4 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="entry-right">
          <div className="entry-card">

            {mode === "entry" && (
              <>
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Zap size={18} color="white" />
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>Servi<span style={{ color: "#1D9E75" }}>app</span></span>
                  </div>
                  <h2 style={{ fontSize: 26, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>Bem-vindo</h2>
                  <p style={{ fontSize: 14, color: "#4a6a6a", lineHeight: 1.6 }}>Escolhe como queres entrar na plataforma.</p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#3a4a5a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Criar nova conta</p>
                <div className="role-grid">
                  <button className="role-btn green" onClick={() => reset("signup-client")}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "#0b2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>Sou Cliente</p>
                      <p style={{ fontSize: 11, color: "#4a6a6a" }}>Quero contratar</p>
                    </div>
                    <ArrowRight size={14} style={{ color: "#1D9E75" }} />
                  </button>
                  <button className="role-btn amber" onClick={() => reset("signup-provider")}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "#2a1e08", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🔧</div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>Sou Prestador</p>
                      <p style={{ fontSize: 11, color: "#4a6a6a" }}>Quero oferecer</p>
                    </div>
                    <ArrowRight size={14} style={{ color: "#EF9F27" }} />
                  </button>
                </div>
                <div className="divider">
                  <div className="divider-line" />
                  <span>Já tens conta?</span>
                  <div className="divider-line" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button onClick={() => reset("login-client")} style={{ padding: "12px", borderRadius: 12, border: "1px solid #1a2535", background: "#131b27", color: "#c0d0e0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    Entrar como Cliente
                  </button>
                  <button onClick={() => reset("login-provider")} style={{ padding: "12px", borderRadius: 12, border: "1px solid #EF9F2740", background: "#EF9F2710", color: "#EF9F27", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    Entrar como Prestador
                  </button>
                </div>
              </>
            )}

            {mode === "login-client" && (
              <>
                <button className="back-btn" onClick={() => reset("entry")}>← Voltar</button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#1d9e7520", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 20 }}>👤</span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>Entrar como Cliente</h2>
                    <p style={{ fontSize: 13, color: "#4a6a6a" }}>Bem-vindo de volta</p>
                  </div>
                </div>
                {error && <div className="error-msg">{error}</div>}
                <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Email</label>
                <input className="auth-input" type="email" placeholder="o-teu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Senha</label>
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <input className="auth-input" type={show ? "text" : "password"} placeholder="A tua senha" style={{ marginBottom: 0, paddingRight: 44 }} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a5a6a" }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ textAlign: "right", marginBottom: 20 }}>
                  <button className="link-btn" style={{ color: "#1D9E75" }}>Esqueci a senha</button>
                </div>
                <button className="auth-btn-green" onClick={handleLogin}>Entrar</button>
                <p style={{ textAlign: "center", fontSize: 13, color: "#4a6a6a", marginTop: 16 }}>
                  Não tens conta?{" "}
                  <button className="link-btn" style={{ color: "#1D9E75", fontWeight: 600 }} onClick={() => reset("signup-client")}>Criar conta</button>
                </p>
              </>
            )}

            {mode === "login-provider" && (
              <>
                <button className="back-btn" onClick={() => reset("entry")}>← Voltar</button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EF9F2720", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 20 }}>🔧</span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>Entrar como Prestador</h2>
                    <p style={{ fontSize: 13, color: "#4a6a6a" }}>Bem-vindo de volta</p>
                  </div>
                </div>
                {error && <div className="error-msg">{error}</div>}
                <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Email</label>
                <input className="auth-input" type="email" placeholder="o-teu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Senha</label>
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <input className="auth-input" type={show ? "text" : "password"} placeholder="A tua senha" style={{ marginBottom: 0, paddingRight: 44 }} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a5a6a" }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ textAlign: "right", marginBottom: 20 }}>
                  <button className="link-btn" style={{ color: "#EF9F27" }}>Esqueci a senha</button>
                </div>
                <button className="auth-btn-amber" onClick={handleLogin}>Entrar</button>
                <p style={{ textAlign: "center", fontSize: 13, color: "#4a6a6a", marginTop: 16 }}>
                  Não tens conta?{" "}
                  <button className="link-btn" style={{ color: "#EF9F27", fontWeight: 600 }} onClick={() => reset("signup-provider")}>Criar conta</button>
                </p>
              </>
            )}

            {mode === "signup-client" && (
              <>
                <button className="back-btn" onClick={() => step === 1 ? reset("entry") : setStep(1)}>← {step === 1 ? "Voltar" : "Passo anterior"}</button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#1d9e7520", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 20 }}>👤</span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>Criar conta de Cliente</h2>
                    <p style={{ fontSize: 13, color: "#4a6a6a" }}>Passo {step} de 2</p>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: 16 }}>
                  <div className="progress-fill" style={{ width: step === 1 ? "50%" : "100%", background: "#1D9E75" }} />
                </div>
                {step === 1 ? (
                  <>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Nome completo</label>
                    <input className="auth-input" placeholder="O teu nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Email</label>
                    <input className="auth-input" type="email" placeholder="o-teu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Telemóvel</label>
                    <input className="auth-input" placeholder="+244 9XX XXX XXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    <button className="auth-btn-green" onClick={() => setStep(2)}>Continuar →</button>
                  </>
                ) : (
                  <>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Criar senha</label>
                    <div style={{ position: "relative", marginBottom: 14 }}>
                      <input className="auth-input" type={show ? "text" : "password"} placeholder="Mínimo 6 caracteres" style={{ marginBottom: 0, paddingRight: 44 }} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                      <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a5a6a" }}>
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div style={{ background: "#0b2a2a", border: "1px solid #1d9e7525", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                      {["Pagamento 100% protegido", "Acesso a prestadores verificados", "Chat integrado"].map((t, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
                          <CheckCircle size={13} style={{ color: "#1D9E75", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#4a8a6a" }}>{t}</span>
                        </div>
                      ))}
                    </div>
                    <button className="auth-btn-green" onClick={() => router.push("/home")}>Criar conta →</button>
                  </>
                )}
                <p style={{ textAlign: "center", fontSize: 13, color: "#4a6a6a", marginTop: 16 }}>
                  Já tens conta?{" "}
                  <button className="link-btn" style={{ color: "#1D9E75", fontWeight: 600 }} onClick={() => reset("login-client")}>Entrar</button>
                </p>
              </>
            )}

            {mode === "signup-provider" && (
              <>
                <button className="back-btn" onClick={() => step === 1 ? reset("entry") : setStep(s => s - 1)}>← {step === 1 ? "Voltar" : "Passo anterior"}</button>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#EF9F2720", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 20 }}>🔧</span>
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0" }}>Criar perfil de Prestador</h2>
                    <p style={{ fontSize: 13, color: "#4a6a6a" }}>Passo {step} de 3</p>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: 16 }}>
                  <div className="progress-fill" style={{ width: `${(step / 3) * 100}%`, background: "#EF9F27" }} />
                </div>
                {step === 1 && (
                  <>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Nome completo</label>
                    <input className="auth-input" placeholder="O teu nome" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Email</label>
                    <input className="auth-input" type="email" placeholder="o-teu@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Telemóvel</label>
                    <input className="auth-input" placeholder="+244 9XX XXX XXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Senha</label>
                    <div style={{ position: "relative", marginBottom: 16 }}>
                      <input className="auth-input" type={show ? "text" : "password"} placeholder="Mínimo 6 caracteres" style={{ marginBottom: 0, paddingRight: 44 }} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                      <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#4a5a6a" }}>
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button className="auth-btn-amber" onClick={() => setStep(2)}>Continuar →</button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 10 }}>Categoria de serviço</label>
                    <div className="cat-grid">
                      {["Limpeza","Climatização","Canalização","Eletricista","TI & Redes","Jardinagem","Mudanças","Beleza","Automóvel","Pintura","Construção","Segurança"].map((c, i) => (
                        <button key={i} className={`cat-opt${form.name === c ? " sel-green" : ""}`} onClick={() => setForm({ ...form, name: c })}>{c}</button>
                      ))}
                    </div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Descrição do serviço</label>
                    <textarea className="auth-input" rows={3} placeholder="Descreve o teu serviço e experiência..." style={{ resize: "none" }} />
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a", display: "block", marginBottom: 6 }}>Preço/hora (Kz)</label>
                    <input className="auth-input" type="number" placeholder="Ex: 5000" />
                    <button className="auth-btn-amber" onClick={() => setStep(3)}>Continuar →</button>
                  </>
                )}
                {step === 3 && (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#c0d0e0", marginBottom: 6 }}>Verificação de identidade (KYC)</p>
                    <p style={{ fontSize: 13, color: "#4a6a6a", marginBottom: 16, lineHeight: 1.6 }}>Para a segurança dos clientes precisamos verificar a tua identidade.</p>
                    <div className="upload-area">
                      <span style={{ fontSize: 24 }}>📄</span>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a" }}>Bilhete de identidade</p>
                      <p style={{ fontSize: 12, color: "#3a4a5a" }}>Frente e verso — JPG, PNG ou PDF</p>
                    </div>
                    <div className="upload-area">
                      <span style={{ fontSize: 24 }}>🤳</span>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#6a7a8a" }}>Selfie com o BI</p>
                      <p style={{ fontSize: 12, color: "#3a4a5a" }}>Segura o documento junto ao rosto</p>
                    </div>
                    <div style={{ background: "#2a1e08", border: "1px solid #EF9F2725", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                      {["Perfil visível após aprovação (48h)", "Documentos tratados com confidencialidade", "Aprovação manual pela equipa"].map((t, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
                          <CheckCircle size={13} style={{ color: "#EF9F27", flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: "#8a6a3a" }}>{t}</span>
                        </div>
                      ))}
                    </div>
                    <button className="auth-btn-amber" onClick={() => router.push("/provider-home")}>Submeter e aguardar aprovação →</button>
                  </>
                )}
                <p style={{ textAlign: "center", fontSize: 13, color: "#4a6a6a", marginTop: 16 }}>
                  Já tens conta?{" "}
                  <button className="link-btn" style={{ color: "#EF9F27", fontWeight: 600 }} onClick={() => reset("login-provider")}>Entrar</button>
                </p>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
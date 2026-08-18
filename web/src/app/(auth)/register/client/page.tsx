"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Eye, EyeOff, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { authApi, saveSession } from "@/lib/auth.api";
import { renderGoogleButton } from "@/lib/google-auth";

export default function RegisterClientPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBusyRef = useRef(false);

  // NOVO — quando o utilizador usa "Continuar com Google", o email e o
  // nome vindos da Google passam a ser tratados como pré-preenchidos
  // (não editáveis), para deixar claro que essa identidade já foi
  // verificada. O resto do cadastro (telemóvel, senha) continua
  // manual e obrigatório — Google NUNCA cria a conta aqui.
  const [googleFilled, setGoogleFilled] = useState(false);
  const [googlePicture, setGooglePicture] = useState<string | null>(null);

  useEffect(() => {
    renderGoogleButton({
      containerId: "google-btn-register-client",
      onCredential: async (idToken) => {
        if (googleBusyRef.current) return;
        googleBusyRef.current = true;
        setGoogleLoading(true);
        setError("");
        try {
          // ALTERADO — antes: authApi.google(idToken) criava/autenticava
          // a conta imediatamente e redirecionava. Agora: authApi.googleVerify()
          // só valida a identidade junto da Google e devolve nome/email,
          // sem criar User, sem sessão, sem login. A conta só é criada
          // quando o utilizador terminar o formulário e clicar em
          // "Criar conta" (handleSubmit), tal como no cadastro tradicional.
          const identity = await authApi.googleVerify(idToken);

          if (identity.emailAlreadyRegistered) {
            setError(
              "Este email já está associado a uma conta existente. Tenta entrar em vez de criar uma nova conta."
            );
            return;
          }

          setForm((f) => ({ ...f, name: identity.fullName, email: identity.email }));
          setGooglePicture(identity.picture);
          setGoogleFilled(true);
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Erro ao verificar a conta Google.");
        } finally {
          setGoogleLoading(false);
          googleBusyRef.current = false;
        }
      },
      onError: (err) => setError(err.message),
    });
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        fullName: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "client",
        phone: form.phone.trim() || undefined,
      });
      saveSession(data);
      // Preserva a foto sugerida da Google (se houver) para a página
      // seguinte poder oferecê-la como sugestão de avatar — mesmo
      // mecanismo de passagem que já existia, só que agora acontece
      // depois da conta ser criada, não antes.
      if (typeof window !== "undefined" && googlePicture) {
        sessionStorage.setItem("mestroo_google_picture", googlePicture);
      }
      router.push("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth *{box-sizing:border-box}
        .auth-wrap { min-height: 100vh; background: #f8fafc; background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 22px 22px; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: inherit; }
        .auth-card { width: 100%; max-width: 420px; background: #ffffff; border: 1px solid #eef1f5; border-radius: 24px; padding: 40px 36px; box-shadow: 0 20px 50px rgba(15,23,42,0.08); }
        .auth-back { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #64748b; background: none; border: none; cursor: pointer; margin-bottom: 24px; padding: 0; transition: color .15s; }
        .auth-back:hover { color: #2563eb; }
        .auth-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .auth-logo-mark { width: 42px; height: 42px; border-radius: 13px; background: linear-gradient(135deg,#2563eb,#3b82f6); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 6px 16px rgba(37,99,235,0.25); }
        .auth-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
        .auth-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
        .auth-label { font-size: 13px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px; }
        .auth-input { width: 100%; padding: 14px 16px; border-radius: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; color: #0f172a; font-size: 16px; outline: none; transition: border-color .15s, background .15s; margin-bottom: 16px; font-family: inherit; }
        .auth-input:focus { border-color: #2563eb; background: #fff; }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-input:disabled { background: #f1f5f9; color: #64748b; cursor: not-allowed; }
        .auth-eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; }
        .auth-eye:hover { color: #475569; }
        .auth-btn { width: 100%; padding: 15px; border-radius: 12px; border: none; background: linear-gradient(135deg,#2563eb,#3b82f6); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: transform .15s, box-shadow .15s; box-shadow: 0 8px 20px rgba(37,99,235,0.25); font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .auth-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(37,99,235,0.3); }
        .auth-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .auth-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #b91c1c; margin-bottom: 16px; }
        .progress-bar { height: 5px; border-radius: 99px; background: #eef1f5; margin-bottom: 26px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#2563eb,#3b82f6); transition: width 0.3s; }
        .auth-perks { background: #eff6ff; border: 1px solid #dbeafe; border-radius: 14px; padding: 15px 16px; margin-bottom: 20px; }
        .auth-perk-row { display: flex; align-items: center; gap: 8px; }
        .auth-footer-text { text-align: center; font-size: 13px; color: #64748b; margin-top: 20px; }
        .auth-link-btn { color: #2563eb; font-weight: 700; background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; font-size: inherit; }
        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 4px 0 20px; }
        .auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: #eef1f5; }
        .auth-divider span { font-size: 12px; color: #94a3b8; font-weight: 600; }
        .google-btn-wrap { position: relative; display: flex; justify-content: center; min-height: 44px; margin-bottom: 16px; }
        .google-btn-wrap.disabled { opacity: 0.6; pointer-events: none; }
        .google-filled-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; background: #eff6ff; border: 1px solid #dbeafe; margin-bottom: 16px; }
        .google-filled-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        @media (max-width: 480px) { .auth-card { padding: 30px 22px; } }
      `}</style>
      <div className="auth">
        <div className="auth-wrap">
          <div className="auth-card">
            <button type="button" className="auth-back" onClick={() => step === 1 ? router.push("/") : setStep(1)}>
              <ArrowLeft size={15} /> {step === 1 ? "Voltar" : "Passo anterior"}
            </button>

            <div className="auth-logo-row">
              <div className="auth-logo-mark"><Zap size={20} color="#fff" /></div>
              <div>
                <p className="auth-title">Criar conta de cliente</p>
                <p className="auth-subtitle">Passo {step} de 2</p>
              </div>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: step === 1 ? "50%" : "100%" }} />
            </div>

            {error && <div className="auth-error">{error}</div>}

            {step === 1 ? (
              <div>
                <div className={`google-btn-wrap${googleLoading ? " disabled" : ""}`}>
                  <div id="google-btn-register-client" style={{ width: "100%" }} />
                </div>
                <div className="auth-divider"><span>ou</span></div>

                {googleFilled && (
                  <div className="google-filled-row">
                    {googlePicture && <img src={googlePicture} alt="" className="google-filled-avatar" />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: "#1e40af" }}>
                        <Sparkles size={12} style={{ display: "inline", marginRight: 4, verticalAlign: -1 }} />
                        Identidade Google verificada
                      </p>
                      <p style={{ fontSize: 11.5, color: "#64748b" }}>Continua o cadastro abaixo</p>
                    </div>
                  </div>
                )}

                <label className="auth-label">Nome completo</label>
                <input
                  className="auth-input"
                  placeholder="O teu nome"
                  value={form.name}
                  disabled={googleFilled}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />

                <label className="auth-label">Email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="o-teu@email.com"
                  value={form.email}
                  disabled={googleFilled}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />

                <label className="auth-label">Telemóvel</label>
                <input className="auth-input" placeholder="+244 9XX XXX XXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

                <button type="button" className="auth-btn" onClick={() => setStep(2)}>Continuar →</button>
              </div>
            ) : (
              <div>
                <label className="auth-label">Criar senha</label>
                <div style={{ position: "relative", marginBottom: 16 }}>
                  <input
                    className="auth-input"
                    type={show ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    style={{ marginBottom: 0, paddingRight: 44 }}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" className="auth-eye" onClick={() => setShow(!show)}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="auth-perks">
                  {["Pagamento 100% protegido", "Acesso a prestadores verificados", "Chat integrado na plataforma"].map((t, i) => (
                    <div key={i} className="auth-perk-row" style={{ marginBottom: i < 2 ? 8 : 0 }}>
                      <CheckCircle size={14} style={{ color: "#2563eb", flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "#1e40af" }}>{t}</span>
                    </div>
                  ))}
                </div>

                <button type="button" className="auth-btn" disabled={loading} onClick={handleSubmit}>
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> A criar conta...</>
                    : "Criar conta →"
                  }
                </button>

                <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 16, lineHeight: 1.6 }}>
                  Ao criar conta aceitas os nossos{" "}
                  <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600 }}>Termos de Serviço</span>
                </p>
              </div>
            )}

            <p className="auth-footer-text">
              Já tens conta?{" "}
              <button
                type="button"
                className="auth-link-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push("/login");
                }}
              >
                Entrar
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
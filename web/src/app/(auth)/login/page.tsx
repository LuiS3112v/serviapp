"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { authApi, saveSession, resolvePostGoogleAuthRoute } from "@/lib/auth.api";
import { renderGoogleButton } from "@/lib/google-auth";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const initialType = searchParams.get("type") === "provider" ? "provider" : "client";
  const [accountType, setAccountType] = useState<"client" | "provider">(initialType);
  const [form, setForm] = useState({ email: "", password: "" });
  const googleBusyRef = useRef(false);

  const accent = accountType === "client" ? "#2563eb" : "#EF9F27";
  const accentSoft = accountType === "client" ? "#3b82f6" : "#f5b955";

  // Renderiza o botão oficial da Google. Re-renderiza sempre que
  // accountType muda, para o container manter a largura correcta do
  // cartão actual — o próprio helper limpa o conteúdo anterior.
  useEffect(() => {
    renderGoogleButton({
      containerId: "google-btn-login",
      onCredential: async (idToken) => {
        if (googleBusyRef.current) return;
        googleBusyRef.current = true;
        setGoogleLoading(true);
        setError("");
        try {
          const data = await authApi.google(idToken);
          saveSession(data);
          if (typeof window !== "undefined" && data.googlePicture) {
            sessionStorage.setItem("mestroo_google_picture", data.googlePicture);
          }
          router.push(resolvePostGoogleAuthRoute(data.user, data.kycStatus));
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Erro ao entrar com Google.");
          setGoogleLoading(false);
          googleBusyRef.current = false;
        }
      },
      onError: (err) => setError(err.message),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountType]);

  const handleLogin = async () => {
    if (!form.email || !form.password) { setError("Preenche todos os campos."); return; }
    if (form.password.length < 6) { setError("Senha incorrecta. Tenta novamente."); return; }
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email: form.email, password: form.password });
      saveSession(data);

      if (data.user.role === "admin") {
        router.push("/admin");
      } else if (data.user.role === "provider" || data.user.role === "company") {
        router.push("/provider-home");
      } else {
        router.push("/home");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao entrar. Tenta novamente.");
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
        .auth-back { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #64748b; background: none; border: none; cursor: pointer; margin-bottom: 28px; padding: 0; transition: color .15s; }
        .auth-back:hover { color: #2563eb; }
        .auth-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
        .auth-logo-mark { width: 42px; height: 42px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background .2s, box-shadow .2s; }
        .auth-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
        .auth-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
        .auth-type-toggle { display: flex; gap: 8px; background: #f1f5f9; border-radius: 12px; padding: 4px; margin-bottom: 24px; }
        .auth-type-opt { flex: 1; padding: 10px 8px; border-radius: 9px; border: none; background: transparent; font-size: 13.5px; font-weight: 700; color: #64748b; cursor: pointer; transition: all .18s; font-family: inherit; }
        .auth-type-opt.active-client { background: #fff; color: #2563eb; box-shadow: 0 3px 10px rgba(15,23,42,0.08); }
        .auth-type-opt.active-provider { background: #fff; color: #EF9F27; box-shadow: 0 3px 10px rgba(15,23,42,0.08); }
        .auth-label { font-size: 13px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px; }
        .input-wrap { position: relative; margin-bottom: 16px; }
        .auth-input { width: 100%; padding: 14px 16px; border-radius: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; color: #0f172a; font-size: 16px; outline: none; transition: border-color .15s, background .15s; }
        .auth-input:focus { border-color: var(--accent); background: #fff; }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; }
        .auth-eye:hover { color: #475569; }
        .auth-forgot { font-size: 13px; font-weight: 600; color: var(--accent); background: none; border: none; cursor: pointer; padding: 0; }
        .auth-btn { width: 100%; padding: 15px; border-radius: 12px; border: none; background: linear-gradient(135deg, var(--accent), var(--accent-soft)); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: transform .15s, box-shadow .15s; margin-top: 8px; box-shadow: 0 8px 20px var(--accent-shadow); font-family: inherit; }
        .auth-btn:hover { transform: translateY(-1px); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .auth-error { display: flex; align-items: flex-start; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #dc2626; margin-bottom: 16px; line-height: 1.5; }
        .auth-footer-text { text-align: center; font-size: 13px; color: #64748b; margin-top: 22px; }
        .auth-link-btn { color: var(--accent); font-weight: 700; background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; font-size: inherit; }
        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
        .auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: #eef1f5; }
        .auth-divider span { font-size: 12px; color: #94a3b8; font-weight: 600; }
        .google-btn-wrap { position: relative; display: flex; justify-content: center; min-height: 44px; }
        .google-btn-wrap.disabled { opacity: 0.6; pointer-events: none; }
        @media (max-width: 480px) { .auth-card { padding: 30px 22px; } }
      `}</style>
      <div className="auth" style={{ "--accent": accent, "--accent-soft": accentSoft, "--accent-shadow": accountType === "client" ? "rgba(37,99,235,0.25)" : "rgba(239,159,39,0.28)" } as CSSProperties}>
        <div className="auth-wrap">
          <div className="auth-card">
            <button className="auth-back" onClick={() => router.push("/")}>
              <ArrowLeft size={15} /> Voltar
            </button>

            <div className="auth-logo-row">
              <div
                className="auth-logo-mark"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accentSoft})`,
                  boxShadow: `0 6px 16px ${accountType === "client" ? "rgba(37,99,235,0.25)" : "rgba(239,159,39,0.28)"}`,
                }}
              >
                <Zap size={20} color="#fff" />
              </div>
              <div>
                <p className="auth-title">Entrar na conta</p>
                <p className="auth-subtitle">Bem-vindo de volta à Mestroo</p>
              </div>
            </div>

            <div className="auth-type-toggle">
              <button
                type="button"
                className={`auth-type-opt${accountType === "client" ? " active-client" : ""}`}
                onClick={() => setAccountType("client")}
              >
                Sou cliente
              </button>
              <button
                type="button"
                className={`auth-type-opt${accountType === "provider" ? " active-provider" : ""}`}
                onClick={() => setAccountType("provider")}
              >
                Sou prestador
              </button>
            </div>

            {error && (
              <div className="auth-error">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <div className={`google-btn-wrap${googleLoading ? " disabled" : ""}`}>
              <div id="google-btn-login" style={{ width: "100%" }} />
            </div>

            <div className="auth-divider"><span>ou</span></div>

            <div>
              <label className="auth-label">Email</label>
              <div className="input-wrap">
                <input
                  className="auth-input"
                  type="email"
                  placeholder="o-teu@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <label className="auth-label">Senha</label>
              <div className="input-wrap" style={{ marginBottom: 8 }}>
                <input
                  className="auth-input"
                  type={show ? "text" : "password"}
                  placeholder="A tua senha"
                  style={{ paddingRight: 44 }}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
                />
                <button className="auth-eye" onClick={() => setShow(!show)} type="button">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div style={{ textAlign: "right", marginBottom: 20 }}>
                <button className="auth-forgot" type="button">Esqueci a senha</button>
              </div>

              <button
                className="auth-btn"
                type="button"
                onPointerUp={(e) => { e.preventDefault(); if (!loading) handleLogin(); }}
                disabled={loading}
              >
                {loading ? "A entrar..." : "Entrar"}
              </button>

              <p className="auth-footer-text">
                Não tens conta?{" "}
                <button
                  className="auth-link-btn"
                  onClick={() => router.push(accountType === "client" ? "/register/client" : "/register/provider")}
                >
                  Criar conta
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
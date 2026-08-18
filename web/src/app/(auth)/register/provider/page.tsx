"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Zap, Eye, EyeOff, CheckCircle, Upload, Loader2, Sparkles } from "lucide-react";
import { authApi, saveSession, getToken, clearSession, resolvePostGoogleAuthRoute } from "@/lib/auth.api";
import { refreshUserInStorage } from "@/lib/user.api";
import { renderGoogleButton } from "@/lib/google-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const categories = [
  "Limpeza", "Climatização", "Canalização", "Eletricista",
  "TI & Redes", "Jardinagem", "Mudanças", "Beleza",
  "Automóvel", "Pintura", "Construção", "Segurança",
];

// Wrapper com Suspense — necessário no Next.js 16 sempre que a página
// usa useSearchParams() (mesmo padrão já aplicado em login/page.tsx).
export default function RegisterProviderPage() {
  return (
    <Suspense fallback={null}>
      <RegisterProviderPageContent />
    </Suspense>
  );
}

function RegisterProviderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // NOVO — se a conta já foi criada via Google (choose-role redireciona
  // para cá com ?source=google&step=2), a conta já existe: não há
  // Passo 1 (dados de acesso) a preencher, porque não há password.
  const isGoogleFlow = searchParams.get("source") === "google";
  const requestedStep = Number(searchParams.get("step"));
  const firstStep = isGoogleFlow ? 2 : 1;
  const initialStep = isGoogleFlow && requestedStep >= 2 && requestedStep <= 4
    ? requestedStep
    : firstStep;

  const [step, setStep] = useState(initialStep);
  const [show, setShow] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", bio: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBusyRef = useRef(false);

  // Se veio do Google, a conta JÁ existe — não repetir authApi.register().
  const [accountCreated, setAccountCreated] = useState(isGoogleFlow);

  const [biFile, setBiFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const biInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // NOVO — foto sugerida a partir da conta Google (rule e: nunca
  // aplicada automaticamente, só como sugestão que o utilizador pode
  // confirmar ou substituir).
  const [suggestedAvatarUrl, setSuggestedAvatarUrl] = useState<string | null>(null);
  const [applyingSuggestion, setApplyingSuggestion] = useState(false);

  // Botão Google só faz sentido no Passo 1 (entrada normal). Se
  // isGoogleFlow, o Passo 1 nunca é renderizado, por isso este efeito
  // simplesmente não encontra o container e não faz nada.
  useEffect(() => {
    if (isGoogleFlow) return;
    renderGoogleButton({
      containerId: "google-btn-register-provider",
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
          setError(e instanceof Error ? e.message : "Erro ao criar conta com Google.");
          setGoogleLoading(false);
          googleBusyRef.current = false;
        }
      },
      onError: (err) => setError(err.message),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NOVO — lê a foto sugerida da Google (guardada temporariamente em
  // sessionStorage por login/register no momento da autenticação) e
  // limpa-a de seguida — é só um valor de passagem entre páginas, não
  // fica persistido em lado nenhum.
  useEffect(() => {
    if (!isGoogleFlow || typeof window === "undefined") return;
    const stored = sessionStorage.getItem("mestroo_google_picture");
    if (stored) {
      setSuggestedAvatarUrl(stored);
      sessionStorage.removeItem("mestroo_google_picture");
    }
  }, [isGoogleFlow]);

  const handleAvatarSelect = async (file: File | null) => {
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
      setAvatarUrl(updated.avatarUrl ?? null);
      refreshUserInStorage(updated);
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setAvatarUploading(false);
    }
  };

  // NOVO — "Usar esta foto": busca a imagem pública da conta Google e
  // reutiliza o MESMO caminho de upload já existente (handleAvatarSelect
  // → POST /users/me/avatar → Cloudinary). A foto só se torna oficial
  // depois deste passo — nunca é aplicada sozinha.
  const handleUseSuggestedAvatar = async () => {
    if (!suggestedAvatarUrl) return;
    setApplyingSuggestion(true);
    setAvatarError("");
    try {
      const res = await fetch(suggestedAvatarUrl);
      if (!res.ok) throw new Error("Não foi possível obter a foto da Google.");
      const blob = await res.blob();
      const file = new File([blob], "google-avatar.jpg", { type: blob.type || "image/jpeg" });
      await handleAvatarSelect(file);
    } catch {
      setAvatarError("Não foi possível usar a foto da Google. Escolhe outra.");
    } finally {
      setApplyingSuggestion(false);
    }
  };

  const handleContinueFromStep2 = async () => {
    setError("");

    if (!isGoogleFlow && form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (!selectedCat) {
      setError("Seleciona uma categoria de serviço.");
      return;
    }

    if (accountCreated) {
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        fullName: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "provider",
        phone: form.phone.trim() || undefined,
      });
      saveSession(data);
      setAccountCreated(true);
      setStep(3);
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
        .auth-card { width: 100%; max-width: 460px; background: #ffffff; border: 1px solid #eef1f5; border-radius: 24px; padding: 40px 36px; box-shadow: 0 20px 50px rgba(15,23,42,0.08); }
        .auth-back { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #64748b; background: none; border: none; cursor: pointer; margin-bottom: 24px; padding: 0; transition: color .15s; }
        .auth-back:hover { color: #EF9F27; }
        .auth-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .auth-logo-mark { width: 42px; height: 42px; border-radius: 13px; background: linear-gradient(135deg,#EF9F27,#f5b955); display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 6px 16px rgba(239,159,39,0.28); }
        .auth-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
        .auth-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
        .auth-label { font-size: 13px; font-weight: 600; color: #475569; display: block; margin-bottom: 6px; }
        .auth-input { width: 100%; padding: 14px 16px; border-radius: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; color: #0f172a; font-size: 16px; outline: none; transition: border-color .15s, background .15s; margin-bottom: 16px; font-family: inherit; }
        .auth-input:focus { border-color: #EF9F27; background: #fff; }
        .auth-input::placeholder { color: #94a3b8; }
        .auth-eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; }
        .auth-eye:hover { color: #475569; }
        .auth-btn { width: 100%; padding: 15px; border-radius: 12px; border: none; background: linear-gradient(135deg,#EF9F27,#f5b955); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: transform .15s, box-shadow .15s; box-shadow: 0 8px 20px rgba(239,159,39,0.25); font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .auth-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(239,159,39,0.32); }
        .auth-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
        .auth-btn-secondary { width: 100%; padding: 13px; border-radius: 12px; border: 1.5px solid #EF9F27; background: #fffbf3; color: #b96f0f; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: all .15s; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 12px; }
        .auth-btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #b91c1c; margin-bottom: 16px; }
        .progress-bar { height: 5px; border-radius: 99px; background: #eef1f5; margin-bottom: 26px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg,#EF9F27,#f5b955); transition: width 0.3s; }
        .cat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 20px; }
        .cat-opt { padding: 10px 6px; border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; text-align: center; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #64748b; transition: all 0.15s; font-family: inherit; }
        .cat-opt:hover { border-color: #fcd9a1; }
        .cat-opt.sel { border-color: #EF9F27; background: #fef3e2; color: #b96f0f; }
        .upload-area { border: 2px dashed #e2e8f0; border-radius: 14px; padding: 26px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; margin-bottom: 16px; transition: border-color .2s, background .2s; background: #f8fafc; }
        .upload-area:hover { border-color: #EF9F27; background: #fffbf3; }
        .upload-area.has-file { border-style: solid; border-color: #1D9E75; background: #f0faf6; }
        .auth-perks { border-radius: 14px; padding: 15px 16px; margin-bottom: 20px; }
        .auth-perk-row { display: flex; align-items: center; gap: 8px; }
        .auth-footer-text { text-align: center; font-size: 13px; color: #64748b; margin-top: 20px; }
        .auth-link-btn { color: #1D9E75; font-weight: 700; background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; font-size: inherit; }
        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 4px 0 20px; }
        .auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: #eef1f5; }
        .auth-divider span { font-size: 12px; color: #94a3b8; font-weight: 600; }
        .google-btn-wrap { position: relative; display: flex; justify-content: center; min-height: 44px; margin-bottom: 16px; }
        .google-btn-wrap.disabled { opacity: 0.6; pointer-events: none; }
        .suggested-avatar-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; background: #f8fafc; border: 1px solid #eef1f5; margin-bottom: 16px; }
        .suggested-avatar-img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) { .auth-card { padding: 30px 22px; } .cat-grid { grid-template-columns: repeat(2,1fr); } }
      `}</style>

      <div className="auth">
        <div className="auth-wrap">
          <div className="auth-card">

            <button
              type="button"
              className="auth-back"
              onClick={() => {
                if (step === firstStep) {
                  if (accountCreated) {
                    clearSession();
                  }
                  router.push("/");
                } else {
                  setStep(s => s - 1);
                }
              }}
            >
              <ArrowLeft size={15} /> {step === firstStep ? "Voltar" : "Passo anterior"}
            </button>

            <div className="auth-logo-row">
              <div className="auth-logo-mark"><Zap size={20} color="#fff" /></div>
              <div>
                <p className="auth-title">Criar perfil de prestador</p>
                <p className="auth-subtitle">Passo {step} de 4</p>
              </div>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
            </div>

            {error && <div className="auth-error">{error}</div>}

            {/* ── Passo 1: Dados de acesso (só entrada normal) ─────────── */}
            {step === 1 && (
              <div>
                <div className={`google-btn-wrap${googleLoading ? " disabled" : ""}`}>
                  <div id="google-btn-register-provider" style={{ width: "100%" }} />
                </div>
                <div className="auth-divider"><span>ou</span></div>

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
                  <button type="button" className="auth-eye" onClick={() => setShow(!show)}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button type="button" className="auth-btn" onClick={() => setStep(2)}>Continuar →</button>
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

                <button type="button" className="auth-btn" disabled={loading} onClick={handleContinueFromStep2}>
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> A criar conta...</>
                    : "Continuar →"
                  }
                </button>
              </div>
            )}

            {/* ── Passo 3: Foto de perfil (OBRIGATÓRIA) ───────────────── */}
            {step === 3 && (
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Foto de perfil</p>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
                  A tua foto ajuda os clientes a reconhecerem-te e a confiarem no teu perfil. É obrigatória para continuares o registo.
                </p>

                {suggestedAvatarUrl && !avatarUrl && (
                  <div className="suggested-avatar-row">
                    <img src={suggestedAvatarUrl} alt="" className="suggested-avatar-img" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", marginBottom: 2 }}>
                        Foto da tua conta Google
                      </p>
                      <p style={{ fontSize: 11.5, color: "#94a3b8" }}>Podes usar esta ou escolher outra abaixo</p>
                    </div>
                  </div>
                )}

                {suggestedAvatarUrl && !avatarUrl && (
                  <button
                    type="button"
                    className="auth-btn-secondary"
                    disabled={applyingSuggestion}
                    onClick={handleUseSuggestedAvatar}
                  >
                    {applyingSuggestion
                      ? <><Loader2 size={14} className="animate-spin" /> A aplicar...</>
                      : <><Sparkles size={14} /> Usar foto da conta Google</>}
                  </button>
                )}

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    handleAvatarSelect(file);
                  }}
                />

                {avatarError && <div className="auth-error">{avatarError}</div>}

                <div
                  className={`upload-area${avatarUrl ? " has-file" : ""}`}
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ borderRadius: "50%", width: 120, height: 120, margin: "0 auto 16px", padding: 0, overflow: "hidden", position: "relative" }}
                >
                  {avatarUploading ? (
                    <Loader2 size={26} style={{ color: "#94a3b8", animation: "spin 1s linear infinite" }} />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Upload size={22} style={{ color: "#94a3b8" }} />
                  )}
                </div>

                <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 20 }}>
                  {avatarUrl ? "Foto enviada — clica para trocar" : "Ou clica para escolher outra foto"}
                </p>

                <button type="button" className="auth-btn" disabled={avatarUploading || !avatarUrl} onClick={() => setStep(4)}>
                  Continuar →
                </button>
              </div>
            )}

            {/* ── Passo 4: Verificação KYC ────────────────────────────── */}
            {step === 4 && (
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Verificação de identidade (KYC)</p>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
                  Para garantir a segurança dos clientes, precisamos verificar a tua identidade.
                </p>

                <input
                  ref={biInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  style={{ display: "none" }}
                  onChange={(e) => setBiFile(e.target.files?.[0] || null)}
                />
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                />

                <div
                  className={`upload-area${biFile ? " has-file" : ""}`}
                  onClick={() => biInputRef.current?.click()}
                >
                  <Upload size={22} style={{ color: biFile ? "#1D9E75" : "#94a3b8" }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                    {biFile ? biFile.name : "Bilhete de identidade"}
                  </p>
                  <p style={{ fontSize: 12, color: "#94a3b8" }}>
                    {biFile ? "Ficheiro selecionado — clica para trocar" : "Frente e verso — JPG, PNG ou PDF"}
                  </p>
                </div>

                <div
                  className={`upload-area${selfieFile ? " has-file" : ""}`}
                  onClick={() => selfieInputRef.current?.click()}
                >
                  <Upload size={22} style={{ color: selfieFile ? "#1D9E75" : "#94a3b8" }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
                    {selfieFile ? selfieFile.name : "Selfie com o BI"}
                  </p>
                  <p style={{ fontSize: 12, color: "#94a3b8" }}>
                    {selfieFile ? "Ficheiro selecionado — clica para trocar" : "Segura o documento junto ao rosto"}
                  </p>
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

                <button type="button" className="auth-btn" onClick={() => router.push("/provider-home")}>
                  Submeter e aguardar aprovação →
                </button>
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
                  if (accountCreated) {
                    clearSession();
                  }
                  router.push("/login?type=provider");
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
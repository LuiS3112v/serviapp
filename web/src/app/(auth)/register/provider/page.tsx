"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, Eye, EyeOff, CheckCircle, Upload, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { authApi, saveSession, getToken } from "@/lib/auth.api";
import { refreshUserInStorage } from "@/lib/user.api";
import { renderGoogleButton } from "@/lib/google-auth";
import { CATEGORY_NAMES } from "@/lib/categories";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// CORRIGIDO — antes existia uma lista local ["Limpeza", ..., "Eletricista",
// ...] duplicada e desalinhada da fonte oficial em web/src/lib/categories.ts
// (que usa "Eletricidade"). Consumir CATEGORY_NAMES aqui garante que a
// categoria escolhida no registo do provider é sempre uma das 12
// categorias reais e pesquisáveis do sistema — a mesma lista já usada no
// KYC, no mapa, na pesquisa e nos Serviços Rápidos.
const categories = CATEGORY_NAMES;

// Wrapper com Suspense mantido por consistência com o resto do projeto.
export default function RegisterProviderPage() {
  return (
    <Suspense fallback={null}>
      <RegisterProviderPageContent />
    </Suspense>
  );
}

function RegisterProviderPageContent() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", bio: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBusyRef = useRef(false);

  // NOVO — quando o utilizador usa "Continuar com Google", nome e
  // email vêm preenchidos e não editáveis, para deixar claro que essa
  // identidade já foi verificada. O resto do cadastro (telemóvel,
  // senha, categoria, foto, KYC) continua manual e obrigatório.
  const [googleFilled, setGoogleFilled] = useState(false);

  // ALTERADO (regra "conta só no botão final") — deixou de haver upload
  // de avatar no Passo 3. O ficheiro fica só em memória (selectedAvatarFile)
  // e o preview usa URL.createObjectURL, sem tocar no backend. Só é
  // enviado para /users/me/avatar DEPOIS de authApi.register() ter
  // criado a conta e a sessão existir — ver handleFinish().
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Foto sugerida a partir da conta Google — continua a ser só uma
  // sugestão no Passo 3 (regra 13 do pedido anterior). "Usar esta foto"
  // agora só marca o File local a partir da URL da Google; o upload
  // real continua a acontecer apenas no fim, tal como qualquer outra
  // foto escolhida manualmente.
  const [suggestedAvatarUrl, setSuggestedAvatarUrl] = useState<string | null>(null);
  const [applyingSuggestion, setApplyingSuggestion] = useState(false);

  // Revoga o object URL do preview local quando deixa de ser necessário,
  // para não acumular memória enquanto o utilizador navega entre passos.
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    renderGoogleButton({
      containerId: "google-btn-register-provider",
      onCredential: async (idToken) => {
        if (googleBusyRef.current) return;
        googleBusyRef.current = true;
        setGoogleLoading(true);
        setError("");
        try {
          // authApi.googleVerify() só valida a identidade junto da
          // Google e devolve nome/email/foto — não cria User, não cria
          // sessão, não faz login. A conta só é criada no botão final
          // do Passo 4 (handleFinish).
          const identity = await authApi.googleVerify(idToken);

          if (identity.emailAlreadyRegistered) {
            setError(
              "Este email já está associado a uma conta existente. Tenta entrar em vez de criar uma nova conta."
            );
            return;
          }

          setForm((f) => ({ ...f, name: identity.fullName, email: identity.email }));
          setGoogleFilled(true);
          if (identity.picture) setSuggestedAvatarUrl(identity.picture);
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Erro ao verificar a conta Google.");
        } finally {
          setGoogleLoading(false);
          googleBusyRef.current = false;
        }
      },
      onError: (err) => setError(err.message),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Só guarda o ficheiro em memória e gera preview local — zero
  // chamadas ao backend neste passo.
  const handleAvatarSelect = (file: File | null) => {
    if (!file) return;
    setAvatarError("");
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  // "Usar esta foto" (sugestão Google): busca o ficheiro da URL pública
  // da Google e trata-o como qualquer outra foto escolhida manualmente
  // — guardado em memória, sem upload. O upload real só acontece no
  // fim, junto com o resto.
  const handleUseSuggestedAvatar = async () => {
    if (!suggestedAvatarUrl) return;
    setApplyingSuggestion(true);
    setAvatarError("");
    try {
      const res = await fetch(suggestedAvatarUrl);
      if (!res.ok) throw new Error("Não foi possível obter a foto da Google.");
      const blob = await res.blob();
      const file = new File([blob], "google-avatar.jpg", { type: blob.type || "image/jpeg" });
      handleAvatarSelect(file);
    } catch {
      setAvatarError("Não foi possível usar a foto da Google. Escolhe outra.");
    } finally {
      setApplyingSuggestion(false);
    }
  };

  // Envia o avatar já escolhido para o backend. Só pode ser chamado
  // DEPOIS de existir sessão (token), ou seja, depois de
  // authApi.register() + saveSession() terem corrido em handleFinish().
  const uploadAvatarIfAny = async (): Promise<void> => {
    if (!selectedAvatarFile) return;
    const token = getToken();
    const formData = new FormData();
    formData.append("avatar", selectedAvatarFile);

    const res = await fetch(`${API_URL}/users/me/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      // Não bloqueia o fim do registo por causa do avatar — a conta já
      // foi criada com sucesso nesse ponto. O erro fica só reportado;
      // o utilizador pode enviar a foto mais tarde a partir do perfil.
      const err = await res.json().catch(() => ({}));
      console.error(
        "Falha ao enviar avatar após criação da conta:",
        Array.isArray(err.message) ? err.message[0] : err.message
      );
      return;
    }

    const updated = await res.json();
    refreshUserInStorage(updated);
  };

  const handleContinueFromStep1 = () => {
    setError("");
    if (!form.name.trim()) {
      setError("Insere o teu nome completo.");
      return;
    }
    if (!form.email.trim()) {
      setError("Insere o teu email.");
      return;
    }
    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setStep(2);
  };

  const handleContinueFromStep2 = () => {
    setError("");

    // A password continua sempre obrigatória, mesmo vindo do Google —
    // Google nunca cria nem inventa password.
    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (!selectedCat) {
      setError("Seleciona uma categoria de serviço.");
      return;
    }

    // ALTERADO — já não chama authApi.register() aqui. Este passo
    // passou a ser só validação e avanço de UI, tal como o Passo 1.
    // Nenhuma conta é criada até ao botão final do Passo 4.
    setStep(3);
  };

  const handleContinueFromStep3 = () => {
    setError("");
    setStep(4);
  };

  // NOVO — único ponto de criação de conta em todo o formulário.
  // Substitui o antigo handleContinueFromStep2(): a conta, a sessão e
  // o upload de avatar acontecem aqui, todos depois do clique no
  // botão final "Ir para o meu painel →".
  const handleFinish = async () => {
    setError("");

    // Guarda de segurança — revalida a categoria mesmo que o Passo 2
    // já o tenha feito. Protege contra navegação inesperada, reset de
    // estado ou qualquer outro caminho que chegue aqui sem categoria.
    if (!selectedCat) {
      setError("Categoria de serviço não selecionada. Volta ao passo anterior e escolhe uma.");
      setStep(2);
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
        // NOVO — antes esta categoria (obrigatória no Passo 2, ver
        // handleContinueFromStep2) era validada mas nunca enviada ao
        // backend: user.category ficava vazio até o provider concluir
        // o KYC, opcional e posterior ao registo. Agora fica gravada
        // logo na criação da conta.
        category: selectedCat,
      });
      saveSession(data);

      // Só depois de existir sessão é que o avatar (se escolhido no
      // Passo 3) é enviado — mesmo endpoint de sempre, /users/me/avatar.
      await uploadAvatarIfAny();

      router.push("/provider-home");
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
        .auth-input:disabled { background: #f1f5f9; color: #64748b; cursor: not-allowed; }
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
        .google-filled-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; background: #fffbf3; border: 1px solid #fcd9a1; margin-bottom: 16px; }
        .suggested-avatar-row { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; background: #f8fafc; border: 1px solid #eef1f5; margin-bottom: 16px; }
        .suggested-avatar-img { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .done-icon-wrap { width: 72px; height: 72px; border-radius: 50%; background: #f0faf6; border: 1.5px solid #cdeee1; display: flex; align-items: center; justify-content: center; margin: 4px auto 20px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) { .auth-card { padding: 30px 22px; } .cat-grid { grid-template-columns: repeat(2,1fr); } }
      `}</style>

      <div className="auth">
        <div className="auth-wrap">
          <div className="auth-card">

            {/* ALTERADO — "Voltar"/"Sair" já não precisa de clearSession()
                em nenhum passo: como a conta só é criada no botão final
                do Passo 4, nunca existe sessão a limpar antes disso. */}
            <button
              type="button"
              className="auth-back"
              onClick={() => {
                if (step === 1) {
                  router.push("/");
                } else {
                  setStep(s => s - 1);
                }
              }}
            >
              <ArrowLeft size={15} /> {step === 1 ? "Voltar" : "Passo anterior"}
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

            {/* ── Passo 1: Dados de acesso ─────────────────────────────── */}
            {step === 1 && (
              <div>
                <div className={`google-btn-wrap${googleLoading ? " disabled" : ""}`}>
                  <div id="google-btn-register-provider" style={{ width: "100%" }} />
                </div>
                <div className="auth-divider"><span>ou</span></div>

                {googleFilled && (
                  <div className="google-filled-row">
                    <Sparkles size={14} style={{ color: "#b96f0f", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: "#8a5a12" }}>
                        Identidade Google verificada
                      </p>
                      <p style={{ fontSize: 11.5, color: "#94a3b8" }}>Continua o cadastro abaixo</p>
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

                <button type="button" className="auth-btn" onClick={handleContinueFromStep1}>Continuar →</button>
              </div>
            )}

            {/* ── Passo 2: Categoria e descrição ──────────────────────── */}
            {/* ALTERADO — deixou de criar a conta. Agora é só validação
                e avanço para o Passo 3, exactamente como o Passo 1. */}
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

                <button type="button" className="auth-btn" onClick={handleContinueFromStep2}>
                  Continuar →
                </button>
              </div>
            )}

            {/* ── Passo 3: Foto de perfil (OBRIGATÓRIA) ───────────────── */}
            {/* ALTERADO — já não faz upload para o backend. O ficheiro
                fica só em memória (selectedAvatarFile) com preview via
                URL.createObjectURL. O envio real acontece no fim
                (handleFinish), depois da conta existir. */}
            {step === 3 && (
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Foto de perfil</p>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>
                  A tua foto ajuda os clientes a reconhecerem-te e a confiarem no teu perfil. É obrigatória para continuares o registo.
                </p>

                {suggestedAvatarUrl && !selectedAvatarFile && (
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

                {suggestedAvatarUrl && !selectedAvatarFile && (
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
                  className={`upload-area${avatarPreviewUrl ? " has-file" : ""}`}
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ borderRadius: "50%", width: 120, height: 120, margin: "0 auto 16px", padding: 0, overflow: "hidden", position: "relative" }}
                >
                  {avatarPreviewUrl ? (
                    <img src={avatarPreviewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Upload size={22} style={{ color: "#94a3b8" }} />
                  )}
                </div>

                <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 20 }}>
                  {avatarPreviewUrl ? "Foto selecionada — clica para trocar" : "Ou clica para escolher outra foto"}
                </p>
                <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginBottom: 20 }}>
                  A foto só é enviada depois de concluíres o registo.
                </p>

                <button type="button" className="auth-btn" disabled={!selectedAvatarFile} onClick={handleContinueFromStep3}>
                  Continuar →
                </button>
              </div>
            )}

            {/* ── Passo 4: Conclusão da conta ─────────────────────────── */}
            {/* ALTERADO — este é agora o ÚNICO ponto onde a conta é
                criada. O botão final chama handleFinish(): cria a
                conta (authApi.register), guarda a sessão, envia o
                avatar escolhido no Passo 3 (se houver) e só depois
                navega para /provider-home. Antes deste clique, nenhuma
                conta existe na base de dados. */}
            {step === 4 && (
              <div>
                <div className="done-icon-wrap">
                  <ShieldCheck size={32} style={{ color: "#0E7A5F" }} />
                </div>

                <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8, textAlign: "center" }}>
                  Tudo pronto para criar a tua conta
                </p>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.6, textAlign: "center" }}>
                  Ao continuares, o teu perfil de prestador é criado. Para começares a receber pedidos de clientes,
                  falta só um passo depois disso: verificar a tua identidade a partir do teu painel.
                </p>

                <div className="auth-perks" style={{ background: "#fef3e2", border: "1px solid #fcd9a1" }}>
                  {[
                    "A verificação de identidade fica disponível no teu painel",
                    "O perfil só fica visível para clientes depois de aprovado",
                    "Podes explorar a plataforma enquanto isso",
                  ].map((t, i) => (
                    <div key={i} className="auth-perk-row" style={{ marginBottom: i < 2 ? 8 : 0 }}>
                      <CheckCircle size={14} style={{ color: "#EF9F27", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "#8a5a12" }}>{t}</span>
                    </div>
                  ))}
                </div>

                <button type="button" className="auth-btn" disabled={loading} onClick={handleFinish}>
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> A criar conta...</>
                    : "Ir para o meu painel →"
                  }
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
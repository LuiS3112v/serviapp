"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Eye, EyeOff, Monitor, Smartphone, Tablet, Laptop,
  LogOut, ShieldCheck, ShieldOff, Copy, Check, Clock,
  KeyRound, LogIn, UserPlus, ShieldAlert, Trash2, AlertTriangle,
  Loader2, X,
} from "lucide-react";
import {
  securityApi, SessionInfo, SecurityLogEntry,
} from "@/lib/security.api";
import { clearAllSessions } from "@/lib/auth.api";

type PasswordStrength = "Muito fraca" | "Fraca" | "Boa" | "Forte" | "Excelente";

function evaluatePasswordStrength(password: string): { score: number; label: PasswordStrength } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const labels: PasswordStrength[] = ["Muito fraca", "Muito fraca", "Fraca", "Boa", "Forte", "Excelente"];
  return { score, label: labels[Math.min(score, 5)] };
}

const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  "Muito fraca": "#dc2626",
  "Fraca": "#f97316",
  "Boa": "#eab308",
  "Forte": "#22c55e",
  "Excelente": "#1D9E75",
};

function deviceIcon(device: string | null) {
  if (!device) return Monitor;
  const normalized = device.toLowerCase();
  if (normalized.includes("iphone") || normalized.includes("android")) return Smartphone;
  if (normalized.includes("ipad")) return Tablet;
  if (normalized.includes("mac") || normalized.includes("windows") || normalized.includes("linux")) return Laptop;
  return Monitor;
}

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  login: { label: "Início de sessão", icon: LogIn, color: "#1D9E75" },
  logout: { label: "Fim de sessão", icon: LogOut, color: "#64748b" },
  password_changed: { label: "Senha alterada", icon: KeyRound, color: "#EF9F27" },
  session_revoked: { label: "Sessão terminada", icon: ShieldAlert, color: "#dc2626" },
  new_device: { label: "Novo dispositivo detectado", icon: UserPlus, color: "#8B5CF6" },
  two_fa_enabled: { label: "2FA activado", icon: ShieldCheck, color: "#1D9E75" },
  two_fa_disabled: { label: "2FA desactivado", icon: ShieldOff, color: "#dc2626" },
  account_deleted: { label: "Conta eliminada", icon: Trash2, color: "#dc2626" },
};

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  return `Há ${days} dias`;
}

export default function SecurityPage() {
  const router = useRouter();

  // ── Password ──────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // ── Sessões ───────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  // ── 2FA ───────────────────────────────────────────────────────────────
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [settingUp, setSettingUp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirmingOtp, setConfirmingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [secretCopied, setSecretCopied] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling, setDisabling] = useState(false);
  const [disableError, setDisableError] = useState("");

  // ── Histórico ─────────────────────────────────────────────────────────
  const [history, setHistory] = useState<SecurityLogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // ── Eliminar conta ────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await securityApi.getSessions();
      setSessions(data);
    } catch { /* silencioso */ }
    finally { setSessionsLoading(false); }
  }, []);

  const loadTwoFactorStatus = useCallback(async () => {
    setTwoFactorLoading(true);
    try {
      const { enabled } = await securityApi.getTwoFactorStatus();
      setTwoFactorEnabled(enabled);
    } catch { /* silencioso */ }
    finally { setTwoFactorLoading(false); }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await securityApi.getSecurityHistory();
      setHistory(data);
    } catch { /* silencioso */ }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => {
    loadSessions();
    loadTwoFactorStatus();
    loadHistory();
  }, [loadSessions, loadTwoFactorStatus, loadHistory]);

  const strength = evaluatePasswordStrength(newPassword);
  const passwordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword) { setPasswordError("Indica a senha atual."); return; }
    if (newPassword.length < 8) { setPasswordError("A nova senha tem de ter pelo menos 8 caracteres."); return; }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setPasswordError("A senha precisa de uma maiúscula, um número e um símbolo.");
      return;
    }
    if (newPassword !== confirmPassword) { setPasswordError("As senhas não coincidem."); return; }

    setPasswordSaving(true);
    try {
      await securityApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      loadSessions();
      loadHistory();
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (e: any) {
      setPasswordError(e.message || "Erro ao alterar a senha.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await securityApi.revokeSession(sessionId);
      await loadSessions();
      loadHistory();
    } catch { /* silencioso */ }
    finally { setRevokingId(null); }
  };

  const handleRevokeAllOthers = async () => {
    setRevokingAll(true);
    try {
      await securityApi.revokeAllOtherSessions();
      await loadSessions();
      loadHistory();
    } catch { /* silencioso */ }
    finally { setRevokingAll(false); }
  };

  const handleStartTwoFactorSetup = async () => {
    setSettingUp(true);
    setOtpError("");
    try {
      const data = await securityApi.setupTwoFactor();
      setSetupData(data);
    } catch (e: any) {
      setOtpError(e.message || "Erro ao iniciar configuração.");
    } finally {
      setSettingUp(false);
    }
  };

  const handleConfirmTwoFactor = async () => {
    if (otpCode.length !== 6) return;
    setConfirmingOtp(true);
    setOtpError("");
    try {
      await securityApi.enableTwoFactor(otpCode);
      setTwoFactorEnabled(true);
      setSetupData(null);
      setOtpCode("");
      loadHistory();
    } catch (e: any) {
      setOtpError(e.message || "Código inválido.");
    } finally {
      setConfirmingOtp(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    setDisableError("");
    setDisabling(true);
    try {
      await securityApi.disableTwoFactor(disablePassword);
      setTwoFactorEnabled(false);
      setShowDisableModal(false);
      setDisablePassword("");
      loadHistory();
    } catch (e: any) {
      setDisableError(e.message || "Senha incorreta.");
    } finally {
      setDisabling(false);
    }
  };

  const handleCopySecret = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    if (deleteConfirmText !== "ELIMINAR") {
      setDeleteError('Escreve exactamente "ELIMINAR" para confirmar.');
      return;
    }
    if (!deletePassword) {
      setDeleteError("Indica a tua senha.");
      return;
    }

    setDeleting(true);
    try {
      await securityApi.deleteAccount(deletePassword, deleteConfirmText);
      clearAllSessions();
      router.push("/");
    } catch (e: any) {
      setDeleteError(e.message || "Erro ao eliminar a conta.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <style>{`
        .sec-wrap{display:flex;min-height:100vh;background:#f8fafc}
        .sec-main{flex:1;display:flex;flex-direction:column}
        .sec-inner{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:720px}
        .sec-card{background:#ffffff;border:1px solid #eef1f5;border-radius:16px;padding:24px;box-shadow:0 2px 12px rgba(15,23,42,0.04)}
        .sec-card--danger{border-color:#fecaca}
        .sec-label{font-size:13px;font-weight:600;color:#334155;margin-bottom:6px;display:block}
        .sec-input-wrap{position:relative}
        .sec-input{width:100%;padding:11px 42px 11px 14px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;color:#0f172a;font-size:14px;outline:none;font-family:inherit;transition:border-color .15s}
        .sec-input:focus{border-color:#1D9E75}
        .sec-eye-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#94a3b8;display:flex}
        .sec-btn{padding:11px 20px;border-radius:10px;border:none;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .15s}
        .sec-btn:disabled{opacity:.6;cursor:not-allowed}
        .sec-btn-primary{background:linear-gradient(135deg,#1D9E75,#16876a);color:white}
        .sec-btn-danger{background:#dc2626;color:white}
        .sec-btn-ghost{background:#f1f5f9;color:#475569;border:1px solid #e2e8f0}
        .sec-session-row{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #f1f5f9}
        .sec-session-row:last-child{border-bottom:none}
        @media(max-width:1024px){}
        @media(max-width:640px){.sec-inner{padding:70px 16px 20px}}
        @keyframes sec-spin{to{transform:rotate(360deg)}}
        .sec-spin{animation:sec-spin .8s linear infinite}
      `}</style>

      <div className="sec-wrap">
        <div className="sec-main">
          <div className="sec-inner">

            <div>
              <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:4 }}>Segurança</h1>
              <p style={{ fontSize:13, color:"#64748b" }}>Protege a tua conta e controla as opções de autenticação.</p>
            </div>

            {/* ── Card 1: Alterar palavra-passe ── */}
            <div className="sec-card">
              <h2 style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                <KeyRound size={17} style={{ color:"#1D9E75" }} /> Alterar palavra-passe
              </h2>

              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label className="sec-label">Senha atual</label>
                  <div className="sec-input-wrap">
                    <input
                      className="sec-input"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                    <button className="sec-eye-btn" onClick={() => setShowCurrent(v => !v)} type="button">
                      {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="sec-label">Nova senha</label>
                  <div className="sec-input-wrap">
                    <input
                      className="sec-input"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button className="sec-eye-btn" onClick={() => setShowNew(v => !v)} type="button">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div style={{ marginTop:8 }}>
                      <div style={{ height:5, borderRadius:99, background:"#e2e8f0", overflow:"hidden" }}>
                        <div style={{
                          height:"100%", width:`${(strength.score / 5) * 100}%`,
                          background: STRENGTH_COLORS[strength.label], transition:"width .2s, background .2s",
                        }} />
                      </div>
                      <p style={{ fontSize:12, marginTop:5, color: STRENGTH_COLORS[strength.label], fontWeight:600 }}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="sec-label">Confirmar nova senha</label>
                  <div className="sec-input-wrap">
                    <input
                      className="sec-input"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={!passwordsMatch ? { borderColor:"#dc2626" } : undefined}
                    />
                    <button className="sec-eye-btn" onClick={() => setShowConfirm(v => !v)} type="button">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {!passwordsMatch && (
                    <p style={{ fontSize:12, color:"#dc2626", marginTop:5 }}>As senhas não coincidem.</p>
                  )}
                </div>

                {passwordError && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"#fef2f2", borderRadius:9, border:"1px solid #fecaca" }}>
                    <AlertTriangle size={14} style={{ color:"#dc2626", flexShrink:0 }} />
                    <span style={{ fontSize:12, color:"#dc2626" }}>{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"#f0fdf4", borderRadius:9, border:"1px solid #bbf7d0" }}>
                    <Check size={14} style={{ color:"#1D9E75", flexShrink:0 }} />
                    <span style={{ fontSize:12, color:"#1D9E75" }}>Senha alterada com sucesso. As outras sessões foram terminadas.</span>
                  </div>
                )}

                <button
                  className="sec-btn sec-btn-primary"
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                  onClick={handleChangePassword}
                >
                  {passwordSaving ? <Loader2 size={15} className="sec-spin" /> : <KeyRound size={15} />}
                  {passwordSaving ? "A guardar..." : "Guardar nova palavra-passe"}
                </button>
              </div>
            </div>

            {/* ── Card 2: Sessões ativas ── */}
            <div className="sec-card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <h2 style={{ fontSize:15, fontWeight:700, color:"#0f172a", display:"flex", alignItems:"center", gap:8 }}>
                  <Monitor size={17} style={{ color:"#378ADD" }} /> Sessões activas
                </h2>
              </div>

              {sessionsLoading ? (
                <div style={{ display:"flex", justifyContent:"center", padding:24 }}>
                  <Loader2 size={22} className="sec-spin" style={{ color:"#378ADD" }} />
                </div>
              ) : sessions.length === 0 ? (
                <p style={{ fontSize:13, color:"#94a3b8", textAlign:"center", padding:20 }}>Sem sessões activas.</p>
              ) : (
                <>
                  {sessions.map(session => {
                    const Icon = deviceIcon(session.device);
                    return (
                      <div className="sec-session-row" key={session.id}>
                        <div style={{ width:40, height:40, borderRadius:10, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Icon size={18} style={{ color:"#64748b" }} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                            <p style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>
                              {session.device ?? "Dispositivo"} · {session.browser ?? "Browser"}
                            </p>
                            {session.isCurrent && (
                              <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"#f0fdf4", color:"#1D9E75" }}>
                                Sessão atual
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
                            {session.location ?? session.ip ?? "Localização desconhecida"} · {timeAgo(session.lastSeen)}
                          </p>
                        </div>
                        {!session.isCurrent && (
                          <button
                            className="sec-btn sec-btn-ghost"
                            style={{ padding:"7px 12px", fontSize:12 }}
                            disabled={revokingId === session.id}
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            {revokingId === session.id ? <Loader2 size={13} className="sec-spin" /> : "Terminar"}
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {sessions.length > 1 && (
                    <button
                      className="sec-btn sec-btn-danger"
                      style={{ marginTop:16, width:"100%" }}
                      disabled={revokingAll}
                      onClick={handleRevokeAllOthers}
                    >
                      {revokingAll ? <Loader2 size={15} className="sec-spin" /> : <LogOut size={15} />}
                      Terminar todas as outras sessões
                    </button>
                  )}
                </>
              )}
            </div>

            {/* ── Card 3: 2FA ── */}
            <div className="sec-card">
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <h2 style={{ fontSize:15, fontWeight:700, color:"#0f172a", display:"flex", alignItems:"center", gap:8 }}>
                  <Shield size={17} style={{ color:"#8B5CF6" }} /> Autenticação de dois factores
                </h2>
                {!twoFactorLoading && (
                  <span style={{
                    fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:99,
                    background: twoFactorEnabled ? "#f0fdf4" : "#f1f5f9",
                    color: twoFactorEnabled ? "#1D9E75" : "#94a3b8",
                  }}>
                    {twoFactorEnabled ? "Activado" : "Desactivado"}
                  </span>
                )}
              </div>

              {twoFactorLoading ? (
                <div style={{ display:"flex", justifyContent:"center", padding:24 }}>
                  <Loader2 size={22} className="sec-spin" style={{ color:"#8B5CF6" }} />
                </div>
              ) : twoFactorEnabled ? (
                <>
                  <p style={{ fontSize:13, color:"#64748b", marginBottom:16, lineHeight:1.6 }}>
                    A tua conta está protegida com um código adicional a cada início de sessão.
                  </p>
                  <button className="sec-btn sec-btn-ghost" onClick={() => setShowDisableModal(true)}>
                    <ShieldOff size={15} /> Desactivar
                  </button>
                </>
              ) : setupData ? (
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  <p style={{ fontSize:13, color:"#64748b", lineHeight:1.6 }}>
                    Digitaliza o código com a tua app de autenticação (Google Authenticator, Authy, etc.).
                  </p>
                  <div style={{ display:"flex", justifyContent:"center" }}>
                    <img src={setupData.qrCodeDataUrl} alt="QR Code 2FA" style={{ width:180, height:180, borderRadius:12, border:"1px solid #e2e8f0" }} />
                  </div>
                  <div>
                    <label className="sec-label">Código secreto (se não conseguires ler o QR)</label>
                    <div style={{ display:"flex", gap:8 }}>
                      <input className="sec-input" readOnly value={setupData.secret} style={{ fontFamily:"monospace", fontSize:12 }} />
                      <button className="sec-btn sec-btn-ghost" style={{ padding:"0 14px" }} onClick={handleCopySecret}>
                        {secretCopied ? <Check size={15} style={{ color:"#1D9E75" }} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="sec-label">Código de 6 dígitos</label>
                    <input
                      className="sec-input"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      style={{ fontFamily:"monospace", fontSize:16, textAlign:"center", letterSpacing:4 }}
                    />
                  </div>
                  {otpError && (
                    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"#fef2f2", borderRadius:9 }}>
                      <AlertTriangle size={14} style={{ color:"#dc2626" }} />
                      <span style={{ fontSize:12, color:"#dc2626" }}>{otpError}</span>
                    </div>
                  )}
                  <button
                    className="sec-btn sec-btn-primary"
                    disabled={otpCode.length !== 6 || confirmingOtp}
                    onClick={handleConfirmTwoFactor}
                  >
                    {confirmingOtp ? <Loader2 size={15} className="sec-spin" /> : <ShieldCheck size={15} />}
                    Confirmar
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontSize:13, color:"#64748b", marginBottom:16, lineHeight:1.6 }}>
                    Adiciona uma camada extra de segurança à tua conta com um código temporário a cada início de sessão.
                  </p>
                  <button className="sec-btn sec-btn-primary" disabled={settingUp} onClick={handleStartTwoFactorSetup}>
                    {settingUp ? <Loader2 size={15} className="sec-spin" /> : <Shield size={15} />}
                    Ativar autenticação em dois factores
                  </button>
                </>
              )}
            </div>

            {/* ── Card 4: Histórico de segurança ── */}
            <div className="sec-card">
              <h2 style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                <Clock size={17} style={{ color:"#EF9F27" }} /> Histórico de segurança
              </h2>

              {historyLoading ? (
                <div style={{ display:"flex", justifyContent:"center", padding:24 }}>
                  <Loader2 size={22} className="sec-spin" style={{ color:"#EF9F27" }} />
                </div>
              ) : history.length === 0 ? (
                <p style={{ fontSize:13, color:"#94a3b8", textAlign:"center", padding:20 }}>Sem eventos registados.</p>
              ) : (
                history.map(entry => {
                  const config = ACTION_CONFIG[entry.action] ?? { label: entry.action, icon: Clock, color: "#64748b" };
                  const Icon = config.icon;
                  return (
                    <div className="sec-session-row" key={entry.id}>
                      <div style={{ width:36, height:36, borderRadius:9, background:`${config.color}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Icon size={16} style={{ color:config.color }} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{config.label}</p>
                        <p style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
                          {new Date(entry.createdAt).toLocaleString("pt-PT")} · {entry.ip ?? "IP desconhecido"} · {entry.browser ?? "—"} · {entry.device ?? "—"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Card 5: Eliminar conta ── */}
            <div className="sec-card sec-card--danger">
              <h2 style={{ fontSize:15, fontWeight:700, color:"#dc2626", marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
                <Trash2 size={17} /> Eliminar conta
              </h2>
              <p style={{ fontSize:13, color:"#64748b", marginBottom:16, lineHeight:1.6 }}>
                Esta ação é permanente e não pode ser desfeita.
              </p>
              <button className="sec-btn sec-btn-danger" onClick={() => setShowDeleteModal(true)}>
                <Trash2 size={15} /> Eliminar conta
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Modal: desactivar 2FA ── */}
      {showDisableModal && (
        <div onClick={() => setShowDisableModal(false)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:16, padding:24, maxWidth:380, width:"100%" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a" }}>Desactivar 2FA</h3>
              <button onClick={() => setShowDisableModal(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8" }}>
                <X size={18} />
              </button>
            </div>
            <label className="sec-label">Confirma a tua senha</label>
            <input
              className="sec-input"
              type="password"
              value={disablePassword}
              onChange={e => setDisablePassword(e.target.value)}
              style={{ marginBottom:12 }}
            />
            {disableError && <p style={{ fontSize:12, color:"#dc2626", marginBottom:12 }}>{disableError}</p>}
            <button
              className="sec-btn sec-btn-danger"
              style={{ width:"100%" }}
              disabled={!disablePassword || disabling}
              onClick={handleDisableTwoFactor}
            >
              {disabling ? <Loader2 size={15} className="sec-spin" /> : <ShieldOff size={15} />}
              Confirmar desactivação
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: eliminar conta ── */}
      {showDeleteModal && (
        <div onClick={() => setShowDeleteModal(false)} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white", borderRadius:16, padding:24, maxWidth:400, width:"100%" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:"#dc2626" }}>Eliminar conta</h3>
              <button onClick={() => setShowDeleteModal(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize:13, color:"#64748b", marginBottom:16, lineHeight:1.6 }}>
              Esta acção é irreversível. Escreve <strong>ELIMINAR</strong> e confirma a tua senha para continuar.
            </p>
            <label className="sec-label">Escreve ELIMINAR</label>
            <input
              className="sec-input"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              style={{ marginBottom:12 }}
            />
            <label className="sec-label">Senha</label>
            <input
              className="sec-input"
              type="password"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              style={{ marginBottom:12 }}
            />
            {deleteError && <p style={{ fontSize:12, color:"#dc2626", marginBottom:12 }}>{deleteError}</p>}
            <button
              className="sec-btn sec-btn-danger"
              style={{ width:"100%" }}
              disabled={deleteConfirmText !== "ELIMINAR" || !deletePassword || deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? <Loader2 size={15} className="sec-spin" /> : <Trash2 size={15} />}
              Eliminar conta definitivamente
            </button>
          </div>
        </div>
      )}
    </>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, User, Briefcase, Loader2, AlertCircle } from "lucide-react";
import { authApi, saveSession, getSession } from "@/lib/auth.api";

const BRAND = "#1e293b";
const LOGO_ACCENT = "#7C6FE0";

export default function ChooseRolePage() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<"client" | "provider" | null>(null);
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session?.fullName) setFirstName(session.fullName.split(" ")[0]);
  }, []);

  const handleChoose = async (role: "client" | "provider") => {
    if (loadingRole) return;
    setError("");
    setLoadingRole(role);
    try {
      const data = await authApi.chooseRole(role);
      saveSession(data);
      if (role === "client") {
        router.push("/home");
      } else {
        router.push("/register/provider?source=google&step=2");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao definir o tipo de conta.");
      setLoadingRole(null);
    }
  };

  return (
    <>
      <style>{`
        .cr *{box-sizing:border-box}
        .cr-wrap { min-height: 100vh; background: #f8fafc; background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 22px 22px; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: inherit; }
        .cr-card { width: 100%; max-width: 440px; background: #ffffff; border: 1px solid #eef1f5; border-radius: 24px; padding: 40px 36px; box-shadow: 0 20px 50px rgba(15,23,42,0.08); }
        .cr-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        .cr-logo-mark { width: 42px; height: 42px; border-radius: 13px; background: ${BRAND}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cr-title { font-size: 19px; font-weight: 800; color: #0f172a; letter-spacing: -0.01em; }
        .cr-subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }
        .cr-error { display: flex; align-items: flex-start; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 11px 14px; font-size: 13px; color: #dc2626; margin-bottom: 16px; line-height: 1.5; }
        .cr-option { width: 100%; display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 16px; border: 1.5px solid #e2e8f0; background: #fff; cursor: pointer; text-align: left; transition: all .15s; font-family: inherit; margin-bottom: 12px; }
        .cr-option:hover:not(:disabled) { border-color: ${BRAND}; transform: translateY(-1px); }
        .cr-option:disabled { opacity: 0.6; cursor: not-allowed; }
        .cr-option-icon { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cr-option-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
        .cr-option-desc { font-size: 12.5px; color: #64748b; line-height: 1.4; }
        .cr-spin { margin-left: auto; flex-shrink: 0; animation: cr-spin 0.9s linear infinite; }
        @keyframes cr-spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) { .cr-card { padding: 30px 22px; } }
      `}</style>
      <div className="cr">
        <div className="cr-wrap">
          <div className="cr-card">
            <div className="cr-logo-row">
              <div className="cr-logo-mark"><Zap size={20} color="#fff" /></div>
              <div>
                <p className="cr-title">
                  {firstName ? `Olá, ${firstName}!` : "Como vais usar a Mestroo?"}
                </p>
                <p className="cr-subtitle">Escolhe o tipo de conta para continuar</p>
              </div>
            </div>

            {error && (
              <div className="cr-error">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              className="cr-option"
              disabled={loadingRole !== null}
              onClick={() => handleChoose("client")}
            >
              <div className="cr-option-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
                <User size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="cr-option-title">Sou cliente</p>
                <p className="cr-option-desc">Quero encontrar e contratar prestadores de serviços</p>
              </div>
              {loadingRole === "client" && <Loader2 size={18} className="cr-spin" />}
            </button>

            <button
              type="button"
              className="cr-option"
              disabled={loadingRole !== null}
              onClick={() => handleChoose("provider")}
            >
              <div className="cr-option-icon" style={{ background: "#fef3e2", color: "#b96f0f" }}>
                <Briefcase size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="cr-option-title">Sou prestador</p>
                <p className="cr-option-desc">Quero oferecer os meus serviços e receber pedidos</p>
              </div>
              {loadingRole === "provider" && <Loader2 size={18} className="cr-spin" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";
import { useState, useRef, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, CheckCircle, ArrowLeft, Upload, X, Loader2 } from "lucide-react";
import { Suspense } from "react";

// ─── FIX #1: getToken correcto ────────────────────────────────────────────────
// Bug original: localStorage.getItem("serviapp_token") devolvia sempre null.
// auth.api.ts guarda sob "serviapp_token_<role>". Esta função replica o
// getToken() de auth.api.ts — podes também importar directamente:
//   import { getToken } from "@/lib/api/auth.api"  (ajusta o caminho)
function getActiveToken(): string | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem("serviapp_active_role");
  if (!role) return null;
  return localStorage.getItem(`serviapp_token_${role}`);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface FilePreview {
  file: File;
  preview: string;
  name: string;
}

interface PersonalInfo {
  fullName: string;
  biNumber: string;
  phoneNumber: string;
  province: string;
  category: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ANGOLA_PROVINCES = [
  "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango",
  "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla",
  "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico",
  "Namibe", "Uíge", "Zaire",
];

const PROVIDER_CATEGORIES = [
  "Construção Civil", "Electricidade", "Canalização", "Pintura",
  "Jardinagem", "Limpeza", "Segurança", "Tecnologia",
  "Saúde", "Educação", "Carpintaria", "Mecânica", "Outro",
];

const TOTAL_STEPS = 3;

// ─── FIX #3: FileUploadArea definido FORA de KYCContent ──────────────────────
// Bug original: definido dentro do componente pai → nova referência em cada
// render → React fazia unmount/remount → inputs de ficheiro resetavam.
interface FileUploadAreaProps {
  label: string;
  subLabel: string;
  emoji: string;
  value: FilePreview | null;
  onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (f: File) => void;
}

const FileUploadArea = memo(function FileUploadArea({
  label, subLabel, emoji, value, onClear, inputRef, onChange,
}: FileUploadAreaProps) {
  return (
    <div
      className="upload-area"
      onClick={() => inputRef.current?.click()}
      style={{
        borderColor: value ? "#1D9E75" : undefined,
        background:  value ? "#0b2a2a" : undefined,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,application/pdf"
        style={{ display: "none" }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
          e.target.value = "";
        }}
      />
      {value ? (
        <>
          {value.preview
            ? <img src={value.preview} alt={label} style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8 }} />
            : <span style={{ fontSize: 28 }}>📄</span>
          }
          <p style={{ fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>{value.name}</p>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onClear(); }}
            style={{ position: "absolute", top: 10, right: 10, background: "#E24B4A20", border: "1px solid #E24B4A40", borderRadius: 8, padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
          >
            <X size={12} style={{ color: "#E24B4A" }} />
            <span style={{ fontSize: 11, color: "#E24B4A" }}>Remover</span>
          </button>
          <CheckCircle size={16} style={{ color: "#1D9E75" }} />
        </>
      ) : (
        <>
          <span style={{ fontSize: 32 }}>{emoji}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Upload size={14} style={{ color: "#4a7a7a" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#6a7a8a" }}>{label}</p>
          </div>
          <p style={{ fontSize: 12, color: "#3a4a5a" }}>{subLabel}</p>
        </>
      )}
    </div>
  );
});

// ─── Estilos partilhados (module-level para não recriar em cada render) ───────
const INPUT_STYLE: React.CSSProperties = {
  width: "100%", padding: "12px 14px", background: "#0d1822",
  border: "1px solid #1a2535", borderRadius: 10, color: "#e2e8f0",
  fontSize: 14, fontFamily: "inherit", outline: "none",
  boxSizing: "border-box", marginBottom: 12, display: "block",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block", fontSize: 11, color: "#4a6a7a", marginBottom: 6,
  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
};

// ─── Componente principal ─────────────────────────────────────────────────────
function KYCContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const role        = searchParams.get("role") ?? "provider";

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // FIX #2: campos pessoais agora recolhidos no Step 1
  const [info, setInfo] = useState<PersonalInfo>({
    fullName: "", biNumber: "", phoneNumber: "", province: "Luanda", category: "",
  });

  const [frontBi, setFrontBi] = useState<FilePreview | null>(null);
  const [backBi,  setBackBi]  = useState<FilePreview | null>(null);
  const [selfie,  setSelfie]  = useState<FilePreview | null>(null);

  const frontRef  = useRef<HTMLInputElement>(null);
  const backRef   = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFile = (file: File, setter: (v: FilePreview | null) => void) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) { setError("Formato inválido. Usa JPG, PNG ou PDF."); return; }
    if (file.size > 5 * 1024 * 1024)  { setError("Ficheiro demasiado grande. Máx 5MB."); return; }
    setError("");
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setter({ file, preview, name: file.name });
  };

  const handleBack = () => {
    if (step > 1) { setStep(s => s - 1); return; }
    router.push(role === "provider" ? "/provider-home" : "/profile/client");
  };

  const validateStep1 = (): boolean => {
    if (!info.fullName.trim())               { setError("Nome completo é obrigatório."); return false; }
    if (info.biNumber.trim().length !== 14)  { setError("O BI deve ter exatamente 14 caracteres."); return false; }
    if (!info.phoneNumber.trim())            { setError("Número de telefone é obrigatório."); return false; }
    if (!info.category)                      { setError("Seleciona uma categoria de serviço."); return false; }
    setError(""); return true;
  };

  const validateStep2 = (): boolean => {
    if (!frontBi || !backBi) { setError("Carrega a frente e o verso do BI antes de continuar."); return false; }
    setError(""); return true;
  };

  const handleSubmit = async () => {
    if (!selfie) { setError("Carrega a selfie com o BI antes de submeter."); return; }

    setLoading(true);
    setError("");

    try {
      // FIX #1: token correcto via chave role-based
      const token = getActiveToken();
      if (!token) {
        setError("Sessão expirada. Faz login novamente.");
        router.push("/");
        return;
      }

      const formData = new FormData();
      // Ficheiros
      formData.append("frontBi", frontBi!.file);
      formData.append("backBi",  backBi!.file);
      formData.append("selfie",  selfie.file);
      // FIX #2: campos pessoais com valores reais (não strings vazias)
      formData.append("fullName",    info.fullName.trim());
      formData.append("biNumber",    info.biNumber.trim().toUpperCase());
      formData.append("phoneNumber", info.phoneNumber.trim());
      formData.append("province",    info.province);
      formData.append("category",    info.category);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/provider/kyc/submit`,
        {
          method: "POST",
          // ⚠️ NÃO definir Content-Type com FormData.
          // O browser define o multipart boundary automaticamente.
          // Definir manualmente quebra o parsing do multer no backend.
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // ValidationPipe pode retornar array de mensagens
        const msg = Array.isArray(data.message)
          ? data.message.join(" • ")
          : data.message || "Erro ao submeter documentos.";
        throw new Error(msg);
      }

      router.push(role === "provider" ? "/provider-home" : "/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .kyc-wrap{min-height:100vh;background:#0d1117;display:flex;align-items:center;justify-content:center;padding:24px}
        .kyc-card{width:100%;max-width:480px;background:#131b27;border:1px solid #1a2535;border-radius:24px;padding:40px 36px}
        .upload-area{border:2px dashed #1a2535;border-radius:14px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:10px;cursor:pointer;margin-bottom:14px;transition:all .2s;text-align:center;position:relative}
        .upload-area:hover{border-color:#1D9E75;background:#0b2a2a}
        .prog-bar{height:4px;border-radius:99px;background:#1a2535;margin-bottom:28px}
        .prog-fill{height:100%;border-radius:99px;background:#1D9E75;transition:width .3s}
        .step-btn{width:100%;padding:15px;border-radius:12px;border:none;background:#1D9E75;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity .2s;margin-top:8px}
        .step-btn:disabled{opacity:.6;cursor:not-allowed}
        .step-btn:hover:not(:disabled){opacity:.9}
        .error-msg{background:#E24B4A15;border:1px solid #E24B4A30;border-radius:10px;padding:10px 14px;font-size:13px;color:#E24B4A;margin-bottom:14px}
        .kyc-input:focus{border-color:#1D9E75!important;outline:none}
        select option{background:#0d1822;color:#e2e8f0}
        @media(max-width:480px){.kyc-card{padding:28px 20px}}
      `}</style>

      <div className="kyc-wrap">
        <div className="kyc-card">

          {/* Voltar */}
          <button
            type="button"
            onClick={handleBack}
            style={{ display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#4a6a6a",background:"none",border:"none",cursor:"pointer",marginBottom:24,fontFamily:"inherit" }}
          >
            <ArrowLeft size={15}/> Voltar
          </button>

          {/* Header */}
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
            <div style={{ width:40,height:40,borderRadius:12,background:"#1d9e7520",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Shield size={20} style={{ color:"#1D9E75" }}/>
            </div>
            <div>
              <h1 style={{ fontSize:20,fontWeight:700,color:"#e2e8f0" }}>Verificação de identidade</h1>
              <p  style={{ fontSize:13,color:"#4a6a6a" }}>Passo {step} de {TOTAL_STEPS}</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="prog-bar">
            <div className="prog-fill" style={{ width:`${Math.round((step/TOTAL_STEPS)*100)}%` }}/>
          </div>

          {/* Erro */}
          {error && <div className="error-msg">{error}</div>}

          {/* ── STEP 1: Dados Pessoais ───────────────────────────────────── */}
          {step === 1 && (
            <>
              <p style={{ fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:6 }}>Dados pessoais</p>
              <p style={{ fontSize:13,color:"#4a6a6a",marginBottom:20,lineHeight:1.6 }}>
                Preenche os teus dados para a verificação de identidade.
              </p>

              <label style={LABEL_STYLE}>Nome completo</label>
              <input
                className="kyc-input"
                type="text"
                placeholder="Como aparece no Bilhete de Identidade"
                value={info.fullName}
                onChange={e => setInfo(p => ({ ...p, fullName: e.target.value }))}
                style={INPUT_STYLE}
              />

              <label style={LABEL_STYLE}>
                Número do BI{" "}
                <span style={{ fontWeight:400,textTransform:"none",letterSpacing:0 }}>— 14 caracteres</span>
              </label>
              <input
                className="kyc-input"
                type="text"
                placeholder="Ex: 004827495LA042"
                value={info.biNumber}
                maxLength={14}
                onChange={e => setInfo(p => ({ ...p, biNumber: e.target.value.toUpperCase() }))}
                style={{
                  ...INPUT_STYLE,
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                  borderColor: info.biNumber.length > 0 && info.biNumber.length !== 14
                    ? "#E24B4A60"
                    : "#1a2535",
                }}
              />
              {info.biNumber.length > 0 && (
                <p style={{ fontSize:11,marginTop:-8,marginBottom:12,color:info.biNumber.length===14?"#1D9E75":"#E24B4A80" }}>
                  {info.biNumber.length}/14 caracteres
                </p>
              )}

              <label style={LABEL_STYLE}>Telefone</label>
              <input
                className="kyc-input"
                type="tel"
                placeholder="+244 9XX XXX XXX"
                value={info.phoneNumber}
                onChange={e => setInfo(p => ({ ...p, phoneNumber: e.target.value }))}
                style={INPUT_STYLE}
              />

              <label style={LABEL_STYLE}>Província</label>
              <select
                className="kyc-input"
                value={info.province}
                onChange={e => setInfo(p => ({ ...p, province: e.target.value }))}
                style={INPUT_STYLE}
              >
                {ANGOLA_PROVINCES.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>

              <label style={LABEL_STYLE}>Categoria de serviço</label>
              <select
                className="kyc-input"
                value={info.category}
                onChange={e => setInfo(p => ({ ...p, category: e.target.value }))}
                style={{ ...INPUT_STYLE, color: info.category ? "#e2e8f0" : "#4a6a7a" }}
              >
                <option value="" disabled>Seleciona uma categoria</option>
                {PROVIDER_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <button
                type="button"
                className="step-btn"
                onClick={() => { if (validateStep1()) setStep(2); }}
              >
                Continuar →
              </button>
            </>
          )}

          {/* ── STEP 2: Documentos BI ────────────────────────────────────── */}
          {step === 2 && (
            <>
              <p style={{ fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:6 }}>Bilhete de Identidade</p>
              <p style={{ fontSize:13,color:"#4a6a6a",marginBottom:20,lineHeight:1.6 }}>
                Faz upload da frente e do verso do teu Bilhete de Identidade.
              </p>

              <FileUploadArea
                label="Frente do BI"
                subLabel="JPG, PNG ou PDF · máx 5MB"
                emoji="📄"
                value={frontBi}
                onClear={() => setFrontBi(null)}
                inputRef={frontRef}
                onChange={f => handleFile(f, setFrontBi)}
              />
              <FileUploadArea
                label="Verso do BI"
                subLabel="JPG, PNG ou PDF · máx 5MB"
                emoji="📄"
                value={backBi}
                onClear={() => setBackBi(null)}
                inputRef={backRef}
                onChange={f => handleFile(f, setBackBi)}
              />

              <button
                type="button"
                className="step-btn"
                onClick={() => { if (validateStep2()) setStep(3); }}
              >
                Continuar →
              </button>
            </>
          )}

          {/* ── STEP 3: Selfie + Submissão ───────────────────────────────── */}
          {step === 3 && (
            <>
              <p style={{ fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:6 }}>Selfie com documento</p>
              <p style={{ fontSize:13,color:"#4a6a6a",marginBottom:20,lineHeight:1.6 }}>
                Tira uma foto segurando o teu BI junto ao rosto.
              </p>

              <FileUploadArea
                label="Selfie com o BI"
                subLabel="JPG ou PNG · máx 5MB"
                emoji="🤳"
                value={selfie}
                onClear={() => setSelfie(null)}
                inputRef={selfieRef}
                onChange={f => handleFile(f, setSelfie)}
              />

              <div style={{ background:"#0b2a2a",border:"1px solid #1d9e7525",borderRadius:12,padding:14,marginBottom:20 }}>
                {[
                  "Aprovação em até 48h",
                  "Dados tratados com confidencialidade",
                  "Só para verificação de identidade",
                ].map((t, i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:i<2?8:0 }}>
                    <CheckCircle size={13} style={{ color:"#1D9E75",flexShrink:0 }}/>
                    <span style={{ fontSize:12,color:"#4a8a6a" }}>{t}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="step-btn"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin"/> A submeter...</>
                  : "Submeter documentos →"
                }
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}

export default function KYCPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100vh",background:"#0d1117",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <div style={{ color:"#4a6a6a",fontSize:14 }}>A carregar...</div>
      </div>
    }>
      <KYCContent/>
    </Suspense>
  );
}
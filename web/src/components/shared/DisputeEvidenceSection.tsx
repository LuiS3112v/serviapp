"use client";
import { useState, useEffect, useRef } from "react";
import {
  Upload, FileText, Image, Eye, Loader2, AlertTriangle,
  Plus, X, CheckCircle,
} from "lucide-react";
import {
  disputeEvidenceApi,
  DisputeEvidence,
} from "@/lib/api/dispute-evidence.api";
import EvidenceViewerModal from "@/components/shared/EvidenceViewerModal";

interface Props {
  serviceId: string;
  mode: "mine" | "admin";
  theme?: "light" | "dark";
  onUploaded?: () => void;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf:  <FileText size={16} style={{ color: "#E24B4A" }} />,
  png:  <Image size={16} style={{ color: "#378ADD" }} />,
  jpg:  <Image size={16} style={{ color: "#378ADD" }} />,
  jpeg: <Image size={16} style={{ color: "#378ADD" }} />,
};

function fDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Tokens de cor por tema ─────────────────────────────────────────────────

function tk(theme: "light" | "dark") {
  const dark = theme === "dark";
  return {
    bg:          dark ? "#131b27"  : "#FFFFFF",
    bgSub:       dark ? "#0d1117"  : "#F8FAFC",
    bgMuted:     dark ? "#1a2535"  : "#F1F5F9",
    border:      dark ? "#1a2535"  : "#CBD5E1",
    text:        dark ? "#e2e8f0"  : "#0F172A",
    textMuted:   dark ? "#8a9ab0"  : "#4B5563",
    textFaint:   dark ? "#4a6a6a"  : "#94A3B8",
    warnBg:      dark ? "#2a1a00"  : "#FFF7ED",
    warnBorder:  dark ? "#7a4a00"  : "#FED7AA",
    warnText:    dark ? "#d4900a"  : "#92400E",
    emptyBorder: dark ? "#1a2535"  : "#CBD5E1",
    emptyBg:     dark ? "#0d1117"  : "#F8FAFC",
  };
}

// ── Upload Modal ───────────────────────────────────────────────────────────

function UploadEvidenceModal({
  onUpload, onClose, uploading, theme,
}: {
  onUpload: (file: File, description: string) => void;
  onClose: () => void;
  uploading: boolean;
  theme: "light" | "dark";
}) {
  const [file, setFile]         = useState<File | null>(null);
  const [description, setDesc]  = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);
  const c                       = tk(theme);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const canSubmit = !!file && !uploading;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
        zIndex: 350, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: c.bg, border: `1px solid ${c.border}`,
          borderRadius: 20, padding: 28, maxWidth: 460, width: "100%",
          boxShadow: "0 20px 48px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: c.text }}>Adicionar evidência</h2>
          <button
            onClick={onClose}
            style={{
              background: c.bgMuted, border: `1px solid ${c.border}`, borderRadius: 8,
              width: 30, height: 30, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: c.textMuted,
            }}
          >
            <X size={14} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
          Só o administrador consegue ver as tuas evidências. Aceita PDF, PNG ou JPG até 5 MB.
        </p>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 10, padding: "24px 16px",
            borderRadius: 14, marginBottom: 16, cursor: "pointer",
            border: `2px dashed ${dragOver ? "#E24B4A" : file ? "#1D9E75" : c.border}`,
            background: dragOver ? (theme === "dark" ? "#2a0a0a" : "#FEF2F2")
                       : file    ? (theme === "dark" ? "#0a2a1a" : "#F0FDF4")
                       : c.bgSub,
            transition: "all 0.15s ease",
          }}
        >
          <input
            ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: "none" }}
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <CheckCircle size={28} style={{ color: "#1D9E75" }} />
              <p style={{ fontSize: 13, color: "#1D9E75", fontWeight: 700, textAlign: "center" }}>{file.name}</p>
              <p style={{ fontSize: 11, color: c.textFaint }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <>
              <Upload size={26} style={{ color: c.textFaint }} />
              <p style={{ fontSize: 13, color: c.textMuted, fontWeight: 600, textAlign: "center" }}>
                Arrasta o ficheiro aqui ou clica para escolher
              </p>
              <p style={{ fontSize: 11, color: c.textFaint }}>PDF, PNG ou JPG · máx. 5 MB</p>
            </>
          )}
        </div>

        <textarea
          value={description}
          onChange={e => setDesc(e.target.value)}
          placeholder="Descreve brevemente esta evidência (opcional)..."
          maxLength={400}
          style={{
            width: "100%", minHeight: 80, padding: 12, borderRadius: 10,
            background: c.bgSub, border: `1px solid ${c.border}`,
            color: c.text, fontSize: 13, resize: "vertical",
            outline: "none", fontFamily: "inherit", marginBottom: 16,
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 12, borderRadius: 10,
              background: c.bgMuted, color: c.textMuted,
              border: `1px solid ${c.border}`, cursor: "pointer",
              fontFamily: "inherit", fontSize: 14, fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => file && onUpload(file, description)}
            style={{
              flex: 1, padding: 12, borderRadius: 10, border: "none",
              background: canSubmit ? "#E24B4A" : (theme === "dark" ? "#2a1a1a" : "#FEE2E2"),
              color: canSubmit ? "#FFFFFF" : (theme === "dark" ? "#5a3a3a" : "#FCA5A5"),
              cursor: canSubmit ? "pointer" : "not-allowed",
              fontFamily: "inherit", fontSize: 14, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {uploading
              ? <><Loader2 size={14} style={{ animation: "des-spin 1s linear infinite" }} /> A enviar...</>
              : <><Upload size={14} /> Enviar evidência</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes des-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Card de evidência ──────────────────────────────────────────────────────

function EvidenceCard({
  ev, showRole, onView, theme,
}: {
  ev: DisputeEvidence;
  showRole?: boolean;
  onView: () => void;
  theme: "light" | "dark";
}) {
  const c = tk(theme);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px", borderRadius: 12,
      background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: c.bgMuted,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {FILE_ICONS[ev.fileType] ?? <FileText size={16} style={{ color: c.textFaint }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 1 }}>
          evidencia.{ev.fileType}
          {showRole && (
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700,
              padding: "2px 7px", borderRadius: 99,
              background: ev.uploaderRole === "client" ? "#1e2a5e" : "#0a2a1a",
              color: ev.uploaderRole === "client" ? "#818cf8" : "#34d399",
              border: `1px solid ${ev.uploaderRole === "client" ? "#3730a3" : "#065f46"}`,
            }}>
              {ev.uploaderRole === "client" ? "Cliente" : "Prestador"}
              {ev.uploadedBy ? ` · ${ev.uploadedBy.fullName}` : ""}
            </span>
          )}
        </p>
        {ev.description && (
          <p style={{
            fontSize: 12, color: c.textMuted, marginBottom: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {ev.description}
          </p>
        )}
        <p style={{ fontSize: 11, color: c.textFaint }}>{fDate(ev.createdAt)}</p>
      </div>

      <button
        onClick={onView}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 12px", borderRadius: 8, border: "none",
          background: c.bgMuted, color: c.textMuted,
          fontSize: 12, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", flexShrink: 0,
        }}
      >
        <Eye size={13} /> Ver
      </button>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function DisputeEvidenceSection({
  serviceId, mode, theme = "light", onUploaded,
}: Props) {
  const c = tk(theme);
  const [evidences, setEvidences]     = useState<DisputeEvidence[]>([]);
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [showUpload, setShowUpload]   = useState(false);
  const [viewingId, setViewingId]     = useState<string | null>(null);
  const [viewingType, setViewingType] = useState<string>("png");
  const [error, setError]             = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = mode === "admin"
        ? await disputeEvidenceApi.listForAdmin(serviceId)
        : await disputeEvidenceApi.listMine(serviceId);
      setEvidences(data);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar evidências.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [serviceId, mode]);

  const handleUpload = async (file: File, description: string) => {
    setUploading(true);
    try {
      await disputeEvidenceApi.upload(serviceId, file, description);
      setShowUpload(false);
      await load();
      onUploaded?.();
    } catch (e: any) {
      alert(e.message || "Erro ao enviar evidência.");
    } finally {
      setUploading(false);
    }
  };

  const clientEvidences   = evidences.filter(e => e.uploaderRole === "client");
  const providerEvidences = evidences.filter(e => e.uploaderRole === "provider");

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={15} style={{ color: "#E24B4A" }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Evidências da disputa</p>
          {!loading && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
              background: "#2a0a0a", color: "#E24B4A", border: "1px solid #5a1a1a",
            }}>
              {evidences.length}
            </span>
          )}
        </div>
        {mode === "mine" && (
          <button
            onClick={() => setShowUpload(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 9,
              border: "1px solid #E24B4A40",
              background: theme === "dark" ? "#2a0a0a" : "#FEF2F2",
              color: "#E24B4A",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Plus size={13} /> Adicionar
          </button>
        )}
      </div>

      {/* Aviso confidencialidade */}
      {mode === "mine" && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          padding: "10px 12px", borderRadius: 10, marginBottom: 14,
          background: c.warnBg, border: `1px solid ${c.warnBorder}`,
        }}>
          <AlertTriangle size={14} style={{ color: c.warnText, marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: c.warnText, lineHeight: 1.5 }}>
            As tuas evidências são <strong>confidenciais</strong> — só o administrador as consegue ver.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: c.textFaint }}>
          <Loader2 size={14} style={{ animation: "des-spin 1s linear infinite" }} />
          <span style={{ fontSize: 13 }}>A carregar...</span>
          <style>{`@keyframes des-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Erro */}
      {!loading && error && (
        <p style={{ fontSize: 13, color: "#E24B4A", padding: "8px 0" }}>{error}</p>
      )}

      {/* Vazio */}
      {!loading && !error && evidences.length === 0 && (
        <div style={{
          textAlign: "center", padding: "24px 16px", borderRadius: 12,
          background: c.emptyBg, border: `1px dashed ${c.emptyBorder}`,
        }}>
          <FileText size={28} style={{ color: c.textFaint, margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, color: c.textMuted, fontWeight: 600 }}>
            {mode === "mine" ? "Ainda não enviaste nenhuma evidência" : "Sem evidências"}
          </p>
          {mode === "mine" && (
            <p style={{ fontSize: 12, color: c.textFaint, marginTop: 4 }}>
              Clica em "Adicionar" para enviar fotos, capturas de ecrã ou documentos.
            </p>
          )}
        </div>
      )}

      {/* Lista mode="mine" */}
      {!loading && !error && mode === "mine" && evidences.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {evidences.map(ev => (
            <EvidenceCard key={ev.id} ev={ev} theme={theme} onView={() => { setViewingId(ev.id); setViewingType(ev.fileType); }} />
          ))}
        </div>
      )}

      {/* Lista mode="admin" */}
      {!loading && !error && mode === "admin" && evidences.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Evidências do cliente",   items: clientEvidences,   color: "#818cf8", bg: "#1e2a5e", border: "#3730a3" },
            { label: "Evidências do prestador", items: providerEvidences, color: "#34d399", bg: "#0a2a1a", border: "#065f46" },
          ].map(({ label, items, color, bg, border }) => (
            <div key={label}>
              <p style={{
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.06em", color, marginBottom: 8,
                padding: "4px 8px", borderRadius: 6,
                background: bg, border: `1px solid ${border}`,
                display: "inline-block",
              }}>
                {label} ({items.length})
              </p>
              {items.length === 0 ? (
                <p style={{ fontSize: 12, color: c.textFaint, padding: "8px 0" }}>Nenhuma evidência enviada.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map(ev => (
                    <EvidenceCard
                      key={ev.id} ev={ev} showRole theme={theme}
                      onView={() => { setViewingId(ev.id); setViewingType(ev.fileType); }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <UploadEvidenceModal
          theme={theme}
          uploading={uploading}
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
        />
      )}
      {viewingId && (
        <EvidenceViewerModal
          evidenceId={viewingId}
          fileType={viewingType}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
}
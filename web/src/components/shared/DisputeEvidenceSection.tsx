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

// ══════════════════════════════════════════════════════════════════════
// DisputeEvidenceSection
//
// Usado em 3 contextos:
//   • mode="mine"  — cliente ou prestador: lista + upload das suas
//                    próprias evidências. Não vê as do outro lado.
//   • mode="admin" — admin: lista evidências de ambas as partes,
//                    agrupadas por papel (cliente / prestador).
//                    Sem botão de upload.
// ══════════════════════════════════════════════════════════════════════

interface Props {
  serviceId: string;
  mode: "mine" | "admin";
  // Callback opcional para re-carregar dados na página pai após upload.
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

// ── Upload Modal ───────────────────────────────────────────────────────────

function UploadEvidenceModal({
  onUpload,
  onClose,
  uploading,
}: {
  onUpload: (file: File, description: string) => void;
  onClose: () => void;
  uploading: boolean;
}) {
  const [file, setFile]               = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver]       = useState(false);
  const inputRef                      = useRef<HTMLInputElement>(null);

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
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
        zIndex: 350, display: "flex", alignItems: "center",
        justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#E2E8F0", border: "1px solid #CBD5E1",
          borderRadius: 20, padding: 28, maxWidth: 460, width: "100%",
          boxShadow: "0 20px 48px rgba(15,23,42,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
            Adicionar evidência
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8,
              width: 30, height: 30, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "#475569",
            }}
          >
            <X size={14} />
          </button>
        </div>
        <p style={{ fontSize: 13, color: "#4B5563", marginBottom: 20, lineHeight: 1.5 }}>
          Só o administrador consegue ver as tuas evidências — a outra parte não tem acesso.
          Aceita PDF, PNG ou JPG até 5 MB.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 10, padding: "24px 16px",
            borderRadius: 14, marginBottom: 16, cursor: "pointer",
            border: `2px dashed ${dragOver ? "#E24B4A" : file ? "#0E7A5F" : "#CBD5E1"}`,
            background: dragOver ? "#FEF2F2" : file ? "#F0FDF4" : "#FFFFFF",
            transition: "all 0.15s ease",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: "none" }}
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <>
              <CheckCircle size={28} style={{ color: "#0E7A5F" }} />
              <p style={{ fontSize: 13, color: "#0E7A5F", fontWeight: 700, textAlign: "center" }}>
                {file.name}
              </p>
              <p style={{ fontSize: 11, color: "#6B7770" }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <Upload size={26} style={{ color: "#94A3B8" }} />
              <p style={{ fontSize: 13, color: "#4B5563", fontWeight: 600, textAlign: "center" }}>
                Arrasta o ficheiro aqui ou clica para escolher
              </p>
              <p style={{ fontSize: 11, color: "#94A3B8" }}>PDF, PNG ou JPG · máx. 5 MB</p>
            </>
          )}
        </div>

        {/* Descrição opcional */}
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descreve brevemente esta evidência (opcional)..."
          maxLength={400}
          style={{
            width: "100%", minHeight: 80, padding: 12, borderRadius: 10,
            background: "#FFFFFF", border: "1px solid #CBD5E1",
            color: "#111827", fontSize: 13, resize: "vertical",
            outline: "none", fontFamily: "inherit", marginBottom: 16,
            boxSizing: "border-box",
          }}
        />

        {/* Botões */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 12, borderRadius: 10,
              background: "#FFFFFF", color: "#475569",
              border: "1px solid #CBD5E1", cursor: "pointer", fontFamily: "inherit",
              fontSize: 14, fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => file && onUpload(file, description)}
            style={{
              flex: 1, padding: 12, borderRadius: 10, border: "none",
              background: canSubmit ? "#E24B4A" : "#FEE2E2",
              color: canSubmit ? "#FFFFFF" : "#FCA5A5",
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

// ── Card de evidência individual ───────────────────────────────────────────

function EvidenceCard({
  ev,
  showRole,
  onView,
}: {
  ev: DisputeEvidence;
  showRole?: boolean; // true no modo admin
  onView: () => void;
}) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px", borderRadius: 12,
        background: "#FFFFFF", border: "1px solid #CBD5E1",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {FILE_ICONS[ev.fileType] ?? <FileText size={16} style={{ color: "#64748B" }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 1 }}>
          evidencia.{ev.fileType}
          {showRole && (
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700,
              padding: "2px 7px", borderRadius: 99,
              background: ev.uploaderRole === "client" ? "#EEF2FF" : "#F0FDF4",
              color: ev.uploaderRole === "client" ? "#4338CA" : "#15803D",
              border: `1px solid ${ev.uploaderRole === "client" ? "#C7D2FE" : "#86EFAC"}`,
            }}>
              {ev.uploaderRole === "client" ? "Cliente" : "Prestador"}
              {ev.uploadedBy ? ` · ${ev.uploadedBy.fullName}` : ""}
            </span>
          )}
        </p>
        {ev.description && (
          <p style={{
            fontSize: 12, color: "#4B5563", marginBottom: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {ev.description}
          </p>
        )}
        <p style={{ fontSize: 11, color: "#94A3B8" }}>{fDate(ev.createdAt)}</p>
      </div>

      <button
        onClick={onView}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 12px", borderRadius: 8, border: "none",
          background: "#F1F5F9", color: "#334155",
          fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        <Eye size={13} /> Ver
      </button>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────

export default function DisputeEvidenceSection({ serviceId, mode, onUploaded }: Props) {
  const [evidences, setEvidences]         = useState<DisputeEvidence[]>([]);
  const [loading, setLoading]             = useState(true);
  const [uploading, setUploading]         = useState(false);
  const [showUpload, setShowUpload]       = useState(false);
  const [viewingId, setViewingId]         = useState<string | null>(null);
  const [viewingType, setViewingType]     = useState<string>("png");
  const [error, setError]                 = useState("");

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

  const openViewer = (ev: DisputeEvidence) => {
    setViewingId(ev.id);
    setViewingType(ev.fileType);
  };

  // No modo admin, agrupa por papel para o admin ver claramente as duas partes
  const clientEvidences   = evidences.filter(e => e.uploaderRole === "client");
  const providerEvidences = evidences.filter(e => e.uploaderRole === "provider");

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={15} style={{ color: "#E24B4A" }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
            Evidências da disputa
          </p>
          {!loading && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: "2px 7px", borderRadius: 99,
              background: "#FEF2F2", color: "#E24B4A", border: "1px solid #FECACA",
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
              padding: "7px 12px", borderRadius: 9, border: "1px solid #E24B4A40",
              background: "#FEF2F2", color: "#E24B4A",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Plus size={13} /> Adicionar
          </button>
        )}
      </div>

      {/* Info: o outro lado não vê */}
      {mode === "mine" && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          padding: "10px 12px", borderRadius: 10, marginBottom: 14,
          background: "#FFF7ED", border: "1px solid #FED7AA",
        }}>
          <AlertTriangle size={14} style={{ color: "#D97706", marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
            As tuas evidências são <strong>confidenciais</strong> — só o administrador as consegue ver.
            A outra parte não tem acesso.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#64748B" }}>
          <Loader2 size={14} style={{ animation: "des-spin 1s linear infinite" }} />
          <span style={{ fontSize: 13 }}>A carregar...</span>
          <style>{`@keyframes des-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Erro */}
      {!loading && error && (
        <p style={{ fontSize: 13, color: "#E24B4A", padding: "8px 0" }}>{error}</p>
      )}

      {/* Estado vazio */}
      {!loading && !error && evidences.length === 0 && (
        <div style={{
          textAlign: "center", padding: "24px 16px",
          borderRadius: 12, background: "#F8FAFC", border: "1px dashed #CBD5E1",
        }}>
          <FileText size={28} style={{ color: "#94A3B8", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, color: "#6B7770", fontWeight: 600 }}>
            {mode === "mine" ? "Ainda não enviaste nenhuma evidência" : "Sem evidências"}
          </p>
          {mode === "mine" && (
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
              Clica em "Adicionar" para enviar fotos, capturas de ecrã ou documentos.
            </p>
          )}
        </div>
      )}

      {/* Lista — modo "mine" */}
      {!loading && !error && mode === "mine" && evidences.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {evidences.map(ev => (
            <EvidenceCard key={ev.id} ev={ev} onView={() => openViewer(ev)} />
          ))}
        </div>
      )}

      {/* Lista — modo "admin": agrupada por papel */}
      {!loading && !error && mode === "admin" && evidences.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { label: "Evidências do cliente", items: clientEvidences, color: "#4338CA", bg: "#EEF2FF", border: "#C7D2FE" },
            { label: "Evidências do prestador", items: providerEvidences, color: "#15803D", bg: "#F0FDF4", border: "#86EFAC" },
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
                <p style={{ fontSize: 12, color: "#94A3B8", padding: "8px 0" }}>
                  Nenhuma evidência enviada.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map(ev => (
                    <EvidenceCard
                      key={ev.id}
                      ev={ev}
                      showRole
                      onView={() => openViewer(ev)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
      {showUpload && (
        <UploadEvidenceModal
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
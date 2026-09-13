"use client";
import { useState, useEffect } from "react";
import { X, ExternalLink, Loader2, AlertTriangle, FileText } from "lucide-react";
import { getEvidenceBlobUrl } from "@/lib/api/dispute-evidence.api";

export default function EvidenceViewerModal({
  evidenceId,
  fileType,
  onClose,
}: {
  evidenceId: string;
  fileType: string;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const isPdf = fileType === "pdf";

  useEffect(() => {
    let cancelled = false;
    let currentUrl: string | null = null;

    (async () => {
      setLoading(true); setError("");
      try {
        const { url } = await getEvidenceBlobUrl(evidenceId);
        if (cancelled) { URL.revokeObjectURL(url); return; }
        currentUrl = url;
        setBlobUrl(url);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Não foi possível carregar o ficheiro.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [evidenceId]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(4px)", zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#E2E8F0", border: "1px solid #CBD5E1", borderRadius: 18,
          maxWidth: 600, width: "100%", maxHeight: "88vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 24px 60px rgba(15,23,42,0.25)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: "1px solid #CBD5E1",
        }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
            Evidência de disputa
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {blobUrl && (
              <button
                onClick={() => window.open(blobUrl, "_blank")}
                style={{
                  display: "flex", alignItems: "center", gap: 6, fontSize: 12,
                  color: "#2563EB", background: "#DBEAFE", border: "none",
                  cursor: "pointer", padding: "6px 12px", borderRadius: 8, fontFamily: "inherit",
                }}
              >
                <ExternalLink size={13} /> Abrir em nova aba
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8,
                width: 32, height: 32, display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", color: "#475569",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflow: "auto", padding: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#F8FAFC", minHeight: 300,
        }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Loader2 size={28} style={{ color: "#E24B4A", animation: "ev-spin 1s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#374151" }}>A carregar evidência...</p>
              <style>{`@keyframes ev-spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {!loading && error && (
            <div style={{
              textAlign: "center", padding: 40, maxWidth: 380,
              background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 14,
            }}>
              <AlertTriangle size={36} style={{ color: "#DC2626", margin: "0 auto 14px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>
                Não foi possível carregar o ficheiro
              </p>
              <p style={{ fontSize: 12, color: "#B91C1C", lineHeight: 1.6 }}>{error}</p>
            </div>
          )}

          {!loading && !error && blobUrl && (
            isPdf ? (
              <object
                data={blobUrl}
                type="application/pdf"
                style={{
                  width: "100%", height: "65vh", borderRadius: 12,
                  background: "#FFFFFF", border: "1px solid #E2E8F0",
                  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
                }}
              >
                <div style={{ textAlign: "center", padding: 40 }}>
                  <FileText size={40} style={{ color: "#475569", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 13, color: "#4B5563", marginBottom: 12 }}>
                    O teu navegador não consegue pré-visualizar PDFs aqui.
                  </p>
                  <button
                    onClick={() => window.open(blobUrl, "_blank")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      color: "#2563EB", fontSize: 13, fontWeight: 600,
                      background: "#DBEAFE", border: "1px solid #BFDBFE",
                      borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Clica para abrir o ficheiro numa nova aba
                  </button>
                </div>
              </object>
            ) : (
              <div style={{
                background: "#FFFFFF", padding: 10, borderRadius: 14,
                boxShadow: "0 10px 28px rgba(15,23,42,0.12)", border: "1px solid #E2E8F0",
              }}>
                <img
                  src={blobUrl}
                  alt="Evidência"
                  style={{ maxWidth: "100%", maxHeight: "65vh", borderRadius: 8, display: "block" }}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
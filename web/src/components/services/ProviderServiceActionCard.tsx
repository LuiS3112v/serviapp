"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, CheckCircle, AlertCircle, ChevronRight, Zap,
  Tag, MapPin, Calendar, MessageSquare, X, Loader2, DollarSign,
} from "lucide-react";
import { ServiceListItem } from "@/lib/service-list-item";
import { servicesApi } from "@/lib/services.api";
import { subcategoryServicesApi } from "@/lib/subcategory-services.api";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  requested:          { label: "Disponível",           color: "#1D9E75", bg: "#1d9e7520" },
  accepted:           { label: "Aceite",                color: "#378ADD", bg: "#378ADD20" },
  payment_held:       { label: "Pago — protegido",     color: "#8B5CF6", bg: "#8B5CF620" },
  in_progress:        { label: "Em execução",          color: "#EF9F27", bg: "#EF9F2720" },
  provider_completed: { label: "Aguarda confirmação",  color: "#EF9F27", bg: "#EF9F2720" },
  completed:          { label: "Concluído",            color: "#1D9E75", bg: "#1d9e7520" },
  cancelled:          { label: "Cancelado",            color: "#E24B4A", bg: "#E24B4A20" },
  refunded:           { label: "Reembolsado",          color: "#E24B4A", bg: "#E24B4A20" },
  disputed:           { label: "Em disputa",           color: "#D4537E", bg: "#D4537E20" },
  rejected:           { label: "Recusado",             color: "#E24B4A", bg: "#E24B4A20" },
};

function fKz(v: number) {
  return new Intl.NumberFormat("pt-PT").format(v) + " Kz";
}
function fmt(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

function ProposeValueModal({
  onSubmit, onClose, loading,
}: { onSubmit: (value: number) => void; onClose: () => void; loading: boolean }) {
  const [value, setValue] = useState("");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#131b27", border: "1px solid #1a2535", borderRadius: 20, padding: 28, maxWidth: 380, width: "100%" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>Propor valor</h2>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Valor em Kz"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "#0d1117", border: "1px solid #1a2535", color: "#e2e8f0", fontSize: 14, outline: "none", fontFamily: "inherit", marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, background: "#1a2535", color: "#8a9ab0", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            Cancelar
          </button>
          <button
            disabled={!value || Number(value) <= 0 || loading}
            onClick={() => onSubmit(Number(value))}
            style={{
              flex: 1, padding: 12, borderRadius: 10, border: "none",
              background: value && Number(value) > 0 ? "#EF9F27" : "#1a2535",
              color: value && Number(value) > 0 ? "#0d1117" : "#4a5a6a",
              fontWeight: 700, cursor: value && Number(value) > 0 ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit",
            }}
          >
            {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {loading ? "A enviar..." : "Enviar proposta"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProviderServiceActionCardProps {
  item: ServiceListItem;
  tab: string;
  onActionComplete: () => void;
}

export default function ProviderServiceActionCard({ item, tab, onActionComplete }: ProviderServiceActionCardProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);

  const isQuick = item.sourceType === "quick";
  const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.requested;
  const isAvailable = item.status === "requested" && !item.providerId;
  const hasOtherProp = !isQuick && !!item.proposedPrice && !item.providerId;

  const handleCardClick = () => {
    if (isQuick) return;
    router.push(`/provider/services/${item.id}`);
  };

  const handleAcceptNormal = async () => {
    setAccepting(true);
    try {
      await servicesApi.accept(item.id, item.budget);
      onActionComplete();
    } catch (e: any) {
      alert(e.message || "Erro ao aceitar.");
    } finally {
      setAccepting(false);
    }
  };

  const handleProposeQuick = async (value: number) => {
    setProposing(true);
    try {
      await subcategoryServicesApi.proposePrice(item.id, value);
      setShowProposeModal(false);
      onActionComplete();
    } catch (e: any) {
      alert(e.message || "Erro ao propor valor.");
    } finally {
      setProposing(false);
    }
  };

  const handleDismissQuick = async () => {
    setDismissing(true);
    try {
      await subcategoryServicesApi.dismiss(item.id);
      onActionComplete();
    } catch (e: any) {
      alert(e.message || "Erro ao recusar.");
    } finally {
      setDismissing(false);
    }
  };

  return (
    <>
      <div
        className="ocard"
        onClick={handleCardClick}
        style={isQuick ? { cursor: "default", borderColor: "#8B5CF640" } : undefined}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{item.title}</h3>

              {isQuick && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99, background: "#8B5CF620", color: "#a78bfa", border: "1px solid #8B5CF640" }}>
                  <Zap size={11} /> Serviço Rápido
                </span>
              )}

              {!isQuick && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              )}

              {!isQuick && tab === "proposals" && item.proposedPrice && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "#378ADD20", color: "#378ADD" }}>
                  Proposta: {fKz(item.proposedPrice)}
                </span>
              )}

              {hasOtherProp && tab === "available" && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "#EF9F2720", color: "#EF9F27", border: "1px solid #EF9F2740" }}>
                  Em negociação
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4a6a6a", flexWrap: "wrap" }}>
              {item.clientName && <span style={{ color: "#8a9ab0", fontWeight: 500 }}>{item.clientName}</span>}
              <span style={{ color: "#2a3a4a" }}>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Tag size={11} /> {item.category}</span>
              {item.address && (
                <>
                  <span style={{ color: "#2a3a4a" }}>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} /> {item.address}</span>
                </>
              )}
              <span style={{ color: "#2a3a4a" }}>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={11} /> {fmt(item.createdAt)}</span>
            </div>
          </div>

          {!isQuick && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#EF9F27" }}>{fKz(item.budget)}</p>
              {item.agreedPrice && item.agreedPrice !== item.budget && (
                <p style={{ fontSize: 12, color: "#1D9E75", fontWeight: 600 }}>Acordado: {fKz(item.agreedPrice)}</p>
              )}
            </div>
          )}
        </div>

        {item.description && !isQuick && (
          <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.6, marginBottom: 14, padding: "10px 14px", background: "#0d1117", borderRadius: 10, border: "1px solid #1a2535" }}>
            {item.description.length > 140 ? item.description.slice(0, 140) + "…" : item.description}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} onClick={(e) => isQuick && e.stopPropagation()}>
          {isQuick && !item.quickAlreadyActed && tab === "available" && (
            <>
              <button
                onClick={() => setShowProposeModal(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "#8B5CF6", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                <DollarSign size={14} /> Propor valor
              </button>
              <button
                onClick={handleDismissQuick}
                disabled={dismissing}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "1px solid #1a2535", background: "#0d1117", color: "#8a9ab0", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              >
                {dismissing ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <X size={14} />}
                Recusar
              </button>
            </>
          )}

          {isQuick && item.quickAlreadyActed && tab === "available" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#0d1117", borderRadius: 10, fontSize: 12, color: "#4a6a6a" }}>
              <Clock size={13} /> Já respondeste a este pedido. A aguardar decisão do cliente.
            </div>
          )}

          {!isQuick && isAvailable && !hasOtherProp && (
            <button
              disabled={accepting}
              onClick={handleAcceptNormal}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: "#EF9F27", color: "#0d1117", fontSize: 13, fontWeight: 700, cursor: accepting ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: accepting ? 0.6 : 1 }}
            >
              {accepting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} />}
              {accepting ? "A aceitar…" : `Aceitar — ${fKz(item.budget)}`}
            </button>
          )}

          {!isQuick && isAvailable && !hasOtherProp && (
            <button
              onClick={() => router.push(`/provider/services/${item.id}?action=propose`)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "1px solid #EF9F2740", background: "#EF9F2715", color: "#EF9F27", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              <MessageSquare size={14} /> Propor valor
            </button>
          )}

          {!isQuick && (
            <button
              onClick={() => router.push(`/provider/services/${item.id}`)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "1px solid #1a2535", background: "#0d1117", color: "#8a9ab0", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >
              Ver detalhe <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {showProposeModal && (
        <ProposeValueModal
          loading={proposing}
          onClose={() => setShowProposeModal(false)}
          onSubmit={handleProposeQuick}
        />
      )}
    </>
  );
}
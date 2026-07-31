"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, CheckCircle, AlertCircle, ChevronRight, Zap,
  Tag, MapPin, Calendar, MessageSquare, X, Loader2, User, DollarSign,
} from "lucide-react";
import { ServiceListItem } from "@/lib/service-list-item";
import { subcategoryServicesApi } from "@/lib/subcategory-services.api";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  requested:          { label: "Solicitado",          color: "#64748B", bg: "#F1F5F9",   icon: Clock },
  accepted:           { label: "Aceite",               color: "#378ADD", bg: "#378ADD20", icon: CheckCircle },
  payment_held:       { label: "Pago — protegido",     color: "#8B5CF6", bg: "#8B5CF620", icon: CheckCircle },
  in_progress:        { label: "Em execução",          color: "#EF9F27", bg: "#EF9F2720", icon: Clock },
  provider_completed: { label: "Aguarda confirmação",  color: "#EF9F27", bg: "#EF9F2720", icon: Clock },
  completed:          { label: "Concluído",            color: "#0E7A5F", bg: "#0E7A5F20", icon: CheckCircle },
  cancelled:          { label: "Cancelado",            color: "#E24B4A", bg: "#E24B4A20", icon: AlertCircle },
  refunded:           { label: "Reembolsado",          color: "#E24B4A", bg: "#E24B4A20", icon: AlertCircle },
  disputed:           { label: "Em disputa",           color: "#D4537E", bg: "#D4537E20", icon: AlertCircle },
  rejected:           { label: "Recusado",             color: "#E24B4A", bg: "#E24B4A20", icon: AlertCircle },
};

function fKz(v: number) {
  return new Intl.NumberFormat("pt-PT").format(v) + " Kz";
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

interface ServiceCardProps {
  item: ServiceListItem;
  detailBasePath: string; // "/services" para o cliente, "/provider/services" para o prestador
  onQuickActionComplete?: () => void; // chamado depois de aceitar/recusar um pedido rápido
}

export default function ServiceCard({ item, detailBasePath, onQuickActionComplete }: ServiceCardProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.requested;
  const Icon = cfg.icon;
  const isQuick = item.sourceType === "quick";
  const hasQuickProposals = isQuick && (item.quickProposals?.length ?? 0) > 0;

  const handleCardClick = () => {
    // Um SubcategoryService pré-conversão não tem página de detalhe
    // própria — a decisão acontece directamente neste card (Aceitar/
    // Recusar por proposta). Um Service normal continua a abrir
    // /services/[id] como sempre.
    if (isQuick) return;
    router.push(`${detailBasePath}/${item.id}`);
  };

  const handleAcceptProposal = async (proposalId: string) => {
    setAccepting(proposalId);
    try {
      const service = await subcategoryServicesApi.acceptProposal(item.id, proposalId);
      router.push(`${detailBasePath}/${service.id}`);
    } catch (e: any) {
      alert(e.message || "Erro ao aceitar proposta.");
      setAccepting(null);
    }
  };

  const handleRejectQuick = async () => {
    if (!confirm("Isto vai cancelar completamente este pedido rápido. Tens a certeza?")) return;
    setRejecting(true);
    try {
      await subcategoryServicesApi.reject(item.id);
      onQuickActionComplete?.();
    } catch (e: any) {
      alert(e.message || "Erro ao recusar.");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div
      className="scard"
      onClick={handleCardClick}
      style={isQuick ? { cursor: "default", borderColor: "#8B5CF660" } : undefined}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{item.title}</h3>

            {isQuick && (
              <span style={{
                display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700,
                padding: "2px 9px", borderRadius: 99, background: "#8B5CF620", color: "#7C3AED",
                border: "1px solid #8B5CF640",
              }}>
                <Zap size={11} /> Serviço Rápido
              </span>
            )}

            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
              background: cfg.bg, color: cfg.color, display: "flex", alignItems: "center", gap: 4,
            }}>
              <Icon size={11} />
              {isQuick && !hasQuickProposals ? "Aguardando resposta" : cfg.label}
            </span>
          </div>

          <p style={{ fontSize: 13, color: "#4B5563", marginBottom: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {item.providerName ?? "Sem prestador"} <span style={{ color: "#CBD5E1" }}>·</span>
            <Tag size={11} /> {item.category}
            {item.address && (
              <>
                <span style={{ color: "#CBD5E1" }}>·</span>
                <MapPin size={11} /> {item.address}
              </>
            )}
          </p>

          <p style={{ fontSize: 12, color: "#6B7280", display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={11} /> {fmt(item.createdAt)}
          </p>
        </div>

        {!isQuick && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#0E7A5F" }}>
              {fKz(item.agreedPrice ?? item.budget)}
            </p>
            <ChevronRight size={16} style={{ color: "#94A3B8", marginTop: 8 }} />
          </div>
        )}
      </div>

      {/* ── Propostas de um pedido rápido — Aceitar / Recusar ── */}
      {isQuick && (
        <div style={{ marginTop: 14 }}>
          {!hasQuickProposals ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FFFFFF", borderRadius: 10, fontSize: 12, color: "#64748B" }}>
              <Clock size={14} /> A aguardar que algum prestador proponha um valor.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {item.quickProposals!.map((p) => (
                <div
                  key={p.id}
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", background: "#FFFFFF", borderRadius: 12 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <User size={14} style={{ color: "#64748B", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.providerName ?? "Prestador"}
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0E7A5F" }}>{fKz(p.proposedPrice)}</p>
                    </div>
                  </div>
                  <button
                    disabled={accepting !== null}
                    onClick={() => handleAcceptProposal(p.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 9,
                      border: "none", background: "#0E7A5F", color: "white", fontSize: 12, fontWeight: 700,
                      cursor: accepting === null ? "pointer" : "not-allowed", fontFamily: "inherit", flexShrink: 0,
                    }}
                  >
                    {accepting === p.id ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
                    Aceitar
                  </button>
                </div>
              ))}
              <button
                disabled={rejecting}
                onClick={(e) => { e.stopPropagation(); handleRejectQuick(); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 14px", borderRadius: 10, border: "1px solid #E24B4A40",
                  background: "#FEF2F2", color: "#DC2626", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {rejecting ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <X size={13} />}
                Recusar e cancelar pedido
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
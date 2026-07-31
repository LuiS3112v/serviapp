"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Plus, Briefcase, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { servicesApi } from "@/lib/services.api";
import { subcategoryServicesApi } from "@/lib/subcategory-services.api";
import { buildUnifiedList, ServiceListItem } from "@/lib/service-list-item";
import { getToken, getSession } from "@/lib/auth.api";
import ServiceCard from "@/components/services/ServiceCard";

const TABS = [
  { label: "Todos",       value: "" },
  { label: "Pendente",    value: "pending" },
  { label: "Em execução", value: "in_progress" },
  { label: "Concluído",   value: "completed" },
  { label: "Cancelado",   value: "cancelled" },
];

// Serviços rápidos ainda sem prestador atribuído mapeiam para
// status="requested" (ver mapQuickService) — por isso já caem
// naturalmente dentro de "pending" sem precisar de nenhuma entrada nova.
const TAB_STATUSES: Record<string, string[]> = {
  "":            [],
  pending:       ["requested", "accepted", "payment_held"],
  in_progress:   ["in_progress", "provider_completed"],
  completed:     ["completed"],
  cancelled:     ["cancelled", "refunded", "rejected"],
};

type PageStatus = "initial-loading" | "refreshing" | "idle";

export default function ServicesPage() {
  const router = useRouter();
  const [tab, setTab] = useState("");
  const [items, setItems] = useState<ServiceListItem[]>([]);
  const [pageStatus, setPageStatus] = useState<PageStatus>("initial-loading");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const isRefreshRef = useRef(false);

  const loading = pageStatus !== "idle";
  const refreshing = pageStatus === "refreshing";

  useEffect(() => {
    const user = getSession();
    if (!getToken()) { router.push("/"); return; }
    if (user?.role === "provider" || user?.role === "company") {
      router.replace("/provider/services");
    }
  }, []);

  // ── Única colecção: busca as duas fontes em paralelo, funde numa
  // lista já unificada via buildUnifiedList — a partir daqui a página
  // não sabe nem precisa de saber que existem dois sistemas.
  const load = useCallback(async () => {
    const token = getToken();
    const user = getSession();
    if (!token || user?.role !== "client") { setPageStatus("idle"); return; }

    setPageStatus(isRefreshRef.current ? "refreshing" : "initial-loading");
    setError("");
    try {
      const [normal, quick] = await Promise.all([
        servicesApi.getMyServices(),
        subcategoryServicesApi.getMyServices().catch(() => []),
        new Promise((res) => setTimeout(res, 2000)),
      ]) as [Awaited<ReturnType<typeof servicesApi.getMyServices>>, Awaited<ReturnType<typeof subcategoryServicesApi.getMyServices>>, unknown];

      setItems(buildUnifiedList(normal, quick));
    } catch (e: any) {
      setError(
        e.message?.includes("Forbidden")
          ? "Sem permissão. Certifica-te que estás logado como cliente."
          : e.message || "Erro ao carregar serviços."
      );
    } finally {
      setPageStatus("idle");
      isRefreshRef.current = false;
    }
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => {
    isRefreshRef.current = true;
    setPageStatus("refreshing");
    setRefreshKey((k) => k + 1);
  };

  const visibleItems = tab === ""
    ? items
    : items.filter((s) => (TAB_STATUSES[tab] ?? [tab]).includes(s.status));

  return (
    <>
      <style>{`
        .sv-wrap{display:flex;min-height:100vh;background:#FFFFFF}
        .sv-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .sv-inner{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:20px}
        .tabs{display:flex;gap:4px;background:#F1F5F9;border-radius:12px;padding:4px;border:1px solid #E2E8F0;width:fit-content;flex-wrap:wrap}
        .tab{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:none;color:#64748B;transition:all 0.15s;font-family:inherit}
        .tab.on{background:#0E7A5F;color:white}
        .scard{background:#E2E8F0;border:1px solid #CBD5E1;border-radius:16px;padding:20px;cursor:pointer;transition:all 0.2s;margin-bottom:12px;box-shadow:0 1px 3px rgba(15,23,42,0.06)}
        .scard:hover{border-color:#0E7A5F;box-shadow:0 10px 22px rgba(15,23,42,0.10)}
        .empty-state{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;text-align:center}
        .error-box{background:#FEF2F2;border:1px solid #FCA5A5;border-radius:12px;padding:16px;display:flex;align-items:center;gap:12px}

        @keyframes do-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .spinning      { display:inline-flex; animation:do-spin 0.7s linear infinite; }
        .not-spinning  { display:inline-flex; }
        .page-spinning { display:inline-flex; animation:do-spin 1s linear infinite; }

        .refresh-btn {
          display:flex;align-items:center;gap:6px;padding:10px 16px;
          border-radius:12px;border:1px solid #E2E8F0;background:#FFFFFF;
          color:#475569;font-size:13px;font-family:inherit;
          min-width:128px;justify-content:center;
          transition:color 0.15s, border-color 0.15s;
        }
        .refresh-btn:not(:disabled) { cursor:pointer; }
        .refresh-btn:not(:disabled):hover { border-color:#0E7A5F60; color:#0E7A5F; }
        .refresh-btn:disabled { opacity:0.6; cursor:not-allowed; }

        @media(max-width:1024px){.sv-main{margin-left:0}}
        @media(max-width:640px){.sv-inner{padding:70px 16px 20px}}
      `}</style>

      <div className="sv-wrap">
        <Sidebar />
        <div className="sv-main">
          <Navbar />
          <div className="sv-inner">

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Os meus serviços</h1>
                <p style={{ fontSize: 13, color: "#4B5563" }}>
                  {loading ? "A carregar..." : `${visibleItems.length} pedido${visibleItems.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleRefresh} disabled={loading} className="refresh-btn">
                  <span className={refreshing ? "spinning" : "not-spinning"}>
                    <RefreshCw size={14} />
                  </span>
                  {refreshing ? "A actualizar..." : "Actualizar"}
                </button>
                <button
                  onClick={() => router.push("/services/new")}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, border: "none", background: "#0E7A5F", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  <Plus size={16} /> Novo serviço
                </button>
              </div>
            </div>

            <div className="tabs">
              {TABS.map((t) => (
                <button key={t.value} className={`tab${tab === t.value ? " on" : ""}`} onClick={() => setTab(t.value)}>
                  {t.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="error-box">
                <AlertCircle size={18} style={{ color: "#DC2626", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: "#B91C1C", marginBottom: 6 }}>{error}</p>
                  <button
                    onClick={() => router.push("/")}
                    style={{ fontSize: 12, color: "#B91C1C", background: "none", border: "1px solid #FCA5A5", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Fazer login novamente
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 12 }}>
                <span className="page-spinning">
                  <Loader2 size={24} style={{ color: "#0E7A5F" }} />
                </span>
                <span style={{ fontSize: 14, color: "#4B5563" }}>A carregar serviços...</span>
              </div>
            ) : !error && visibleItems.length === 0 ? (
              <div className="empty-state">
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "#E2E8F0", border: "1px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Briefcase size={28} style={{ color: "#94A3B8" }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Sem pedidos ainda</p>
                <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6, maxWidth: 320 }}>
                  Os teus pedidos vão aparecer aqui. Cria o primeiro para começar.
                </p>
                <button
                  onClick={() => router.push("/services/new")}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, border: "none", background: "#0E7A5F", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                >
                  <Plus size={16} /> Criar primeiro pedido
                </button>
              </div>
            ) : (
              <div>
                {visibleItems.map((item) => (
                  <ServiceCard
                    key={item.id}
                    item={item}
                    detailBasePath="/services"
                    onQuickActionComplete={() => setRefreshKey((k) => k + 1)}
                  />
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
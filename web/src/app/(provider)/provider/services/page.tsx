"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase, AlertCircle, RefreshCw, Loader2, Filter, X,
} from "lucide-react";
import { servicesApi, AvailableFilter } from "@/lib/services.api";
import { subcategoryServicesApi } from "@/lib/subcategory-services.api";
import { buildUnifiedList, ServiceListItem } from "@/lib/service-list-item";
import { getToken, getSession } from "@/lib/auth.api";
import ProviderServiceActionCard from "@/components/services/ProviderServiceActionCard";

const CATEGORIES = ["", "Limpeza", "Climatização", "Canalização", "Eletricista", "TI & Redes", "Jardinagem", "Mudanças", "Beleza", "Automóvel", "Pintura", "Construção", "Segurança"];
const PROVINCES  = ["", "Luanda", "Benguela", "Huambo", "Huíla", "Malanje", "Namibe", "Kwanza Sul", "Kwanza Norte", "Bié", "Moxico", "Lunda Norte", "Lunda Sul", "Cunene", "Cabinda", "Zaire", "Uíge", "Bengo", "Cuando Cubango"];

const TABS = [
  { label: "Mercado",     value: "available",   desc: "Pedidos de clientes disponíveis" },
  { label: "Propostas",   value: "proposals",   desc: "As tuas contra-propostas pendentes" },
  { label: "Aceites",     value: "accepted",    desc: "Trabalhos que aceitaste" },
  { label: "Em execução", value: "in_progress", desc: "A decorrer agora" },
  { label: "Concluídos",  value: "completed",   desc: "Trabalhos terminados" },
  { label: "Cancelados",  value: "cancelled",   desc: "Cancelados" },
];

const TAB_STATUSES: Record<string, string[]> = {
  accepted:    ["accepted", "payment_held"],
  in_progress: ["in_progress", "provider_completed"],
  completed:   ["completed"],
  cancelled:   ["cancelled", "refunded", "rejected"],
};

function PageSpinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px", gap: 12 }}>
      <Loader2 size={24} style={{ color: "#EF9F27", animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 14, color: "#4a6a6a" }}>A carregar...</span>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ProviderServicesInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const tabParam     = searchParams.get("tab");
  const initTab      = tabParam === "mine" ? "accepted" : (tabParam ?? "available");

  const [tab, setTab]                 = useState(initTab);
  const [items, setItems]             = useState<ServiceListItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter]           = useState<AvailableFilter>({});

  // Usamos ref para cancelar carregamentos desatualizados
  const loadIdRef = useRef(0);

  const isLoggedIn = !!getToken();
  const currentUserId = getSession()?.id ?? "";

  async function load(currentTab: string, currentFilter: AvailableFilter) {
    if (!isLoggedIn) { setLoading(false); return; }

    // Cada chamada tem um ID único — se uma chamada mais recente chegar
    // primeiro, a mais antiga descarta o resultado em vez de sobrescrever.
    const thisLoadId = ++loadIdRef.current;

    setLoading(true);
    setError("");

    try {
      let unified: ServiceListItem[];

      if (currentTab === "available") {
        const [regular, quick] = await Promise.all([
          servicesApi.getAvailable(currentFilter),
          subcategoryServicesApi.getAvailable(),
        ]);

        // Se já existe uma chamada mais recente em curso, descarta
        if (thisLoadId !== loadIdRef.current) return;

        unified = buildUnifiedList(regular, quick, { forProviderId: currentUserId });

      } else if (currentTab === "proposals") {
        const data = await servicesApi.getMyProposals();
        if (thisLoadId !== loadIdRef.current) return;
        unified = buildUnifiedList(data, []);

      } else {
        const all = await servicesApi.getProviderServices();
        if (thisLoadId !== loadIdRef.current) return;
        const wanted = TAB_STATUSES[currentTab] ?? [currentTab];
        const filtered = all.filter((s) => wanted.includes(s.status));
        unified = buildUnifiedList(filtered, []);
      }

      setItems(unified);
    } catch (e: any) {
      if (thisLoadId !== loadIdRef.current) return;
      setError(e.message || "Erro ao carregar.");
    } finally {
      if (thisLoadId === loadIdRef.current) setLoading(false);
    }
  }

  // Carrega sempre que tab ou filter mudam
  useEffect(() => {
    load(tab, filter);
  }, [tab, JSON.stringify(filter)]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(tab, filter).finally(() => setTimeout(() => setRefreshing(false), 600));
  };

  const activeFilters = Object.values(filter).filter(Boolean).length;

  return (
    <>
      <style>{`
        .psv{padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:800px}
        .tabs-row{display:flex;gap:4px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}
        .tabs-row::-webkit-scrollbar{display:none}
        .ptab{padding:8px 16px;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;background:#131b27;border:1px solid #1a2535;color:#6a7a8a;transition:all 0.15s;font-family:inherit;white-space:nowrap;flex-shrink:0}
        .ptab.on{background:#EF9F27;border-color:#EF9F27;color:#0d1117}
        .ocard{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px;transition:all 0.2s;margin-bottom:12px}
        .ocard:hover{border-color:#2a3a4a}
        .feed{display:flex;flex-direction:column;overflow-y:auto;max-height:calc(100vh - 320px)}
        .feed::-webkit-scrollbar{width:4px}
        .feed::-webkit-scrollbar-thumb{background:#1a2535;border-radius:4px}
        .empty-s{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;text-align:center}
        .ebox{background:#E24B4A15;border:1px solid #E24B4A30;border-radius:12px;padding:16px;display:flex;align-items:flex-start;gap:12px}
        .rbtn{display:flex;align-items:center;gap:6px;padding:10px 16px;border-radius:12px;border:1px solid #1a2535;background:#131b27;color:#6a7a8a;font-size:13px;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .rbtn:hover{border-color:#EF9F27;color:#EF9F27}
        .rbtn:disabled{opacity:0.6;cursor:not-allowed}
        .fpanel{background:#131b27;border:1px solid #1a2535;border-radius:14px;padding:16px;display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end}
        .fsel{padding:10px 14px;border-radius:10px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;cursor:pointer;min-width:140px}
        .finp{padding:10px 14px;border-radius:10px;background:#0d1117;border:1px solid #1a2535;color:#e2e8f0;font-size:13px;outline:none;font-family:inherit;width:120px}
        .flabel{font-size:11px;font-weight:600;color:#4a5a6a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px}
        @media(max-width:640px){.psv{padding:16px;gap:16px}.feed{max-height:none}.fpanel{flex-direction:column}.fsel,.finp{width:100%!important;min-width:unset}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>

      <div className="psv">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
              {TABS.find((t) => t.value === tab)?.label ?? "Pedidos"}
            </h1>
            <p style={{ fontSize: 13, color: "#4a6a6a" }}>
              {loading ? "A carregar..." : `${items.length} resultado${items.length !== 1 ? "s" : ""} · ${TABS.find((t) => t.value === tab)?.desc}`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {tab === "available" && (
              <button
                onClick={() => setShowFilters((f) => !f)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 12,
                  border: `1px solid ${showFilters ? "#EF9F27" : "#1a2535"}`,
                  background: showFilters ? "#EF9F2720" : "#131b27",
                  color: showFilters ? "#EF9F27" : "#6a7a8a",
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  position: "relative", transition: "all 0.15s",
                }}
              >
                <Filter size={14} />
                Filtros
                {activeFilters > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", background: "#EF9F27", color: "#0d1117", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {activeFilters}
                  </span>
                )}
              </button>
            )}
            <button className="rbtn" disabled={loading} onClick={handleRefresh}>
              <RefreshCw size={14} style={{ animation: loading || refreshing ? "spin 1s linear infinite" : "none" }} />
              {refreshing ? "A actualizar..." : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="tabs-row">
          {TABS.map((t) => (
            <button key={t.value} className={`ptab${tab === t.value ? " on" : ""}`} onClick={() => setTab(t.value)}>
              {t.label}
            </button>
          ))}
        </div>

        {showFilters && tab === "available" && (
          <div className="fpanel">
            <div>
              <p className="flabel">Categoria</p>
              <select className="fsel" value={filter.category ?? ""} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value || undefined }))}>
                <option value="">Todas as categorias</option>
                {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <p className="flabel">Província</p>
              <select className="fsel" value={filter.province ?? ""} onChange={(e) => setFilter((f) => ({ ...f, province: e.target.value || undefined }))}>
                <option value="">Todas as províncias</option>
                {PROVINCES.filter(Boolean).map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <p className="flabel">Orçamento mín. (Kz)</p>
              <input className="finp" type="number" placeholder="0" min="0"
                value={filter.minBudget ?? ""} onChange={(e) => setFilter((f) => ({ ...f, minBudget: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            <div>
              <p className="flabel">Orçamento máx. (Kz)</p>
              <input className="finp" type="number" placeholder="Sem limite" min="0"
                value={filter.maxBudget ?? ""} onChange={(e) => setFilter((f) => ({ ...f, maxBudget: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
            {activeFilters > 0 && (
              <button onClick={() => setFilter({})} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 10, border: "1px solid #E24B4A40", background: "#E24B4A15", color: "#E24B4A", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                <X size={12} /> Limpar
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="ebox">
            <AlertCircle size={18} style={{ color: "#E24B4A", flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: "#E24B4A" }}>{error}</p>
          </div>
        )}

        {loading ? <PageSpinner /> : items.length === 0 ? (
          <div className="empty-s">
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#131b27", border: "1px solid #1a2535", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Briefcase size={28} style={{ color: "#2a3a4a" }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0" }}>
              {tab === "available"    ? "Sem pedidos de clientes disponíveis" :
               tab === "proposals"    ? "Sem propostas enviadas" :
               tab === "accepted"     ? "Sem trabalhos aceites" :
               tab === "in_progress"  ? "Nenhum trabalho em execução" :
               tab === "completed"    ? "Sem trabalhos concluídos" : "Sem cancelamentos"}
            </p>
            <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.6, maxWidth: 340 }}>
              {tab === "available"
                ? "Quando clientes publicarem pedidos, vão aparecer aqui para aceitares ou propores um valor."
                : tab === "proposals"
                ? "Quando propores um preço alternativo, aparece aqui enquanto o cliente não responde."
                : tab === "accepted"
                ? "Quando aceitares pedidos, aparecem aqui. Podes então iniciar o trabalho."
                : tab === "in_progress"
                ? "Quando iniciares um trabalho aceite, aparece aqui até ser concluído."
                : "Os teus registos aparecem aqui para consulta."}
            </p>
          </div>
        ) : (
          <div className="feed">
            {items.map((item) => (
              <ProviderServiceActionCard
                key={item.id}
                item={item}
                tab={tab}
                onActionComplete={() => load(tab, filter)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ProviderServicesPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ProviderServicesInner />
    </Suspense>
  );
}
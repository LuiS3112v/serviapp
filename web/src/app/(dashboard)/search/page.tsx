"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  Search, Filter, Briefcase, FileText,
  Wifi, WifiOff, Loader2, X, RefreshCw,
  Package, CheckCircle, Building2, User,
} from "lucide-react";
import { getToken } from "@/lib/auth.api";
import { chatApi } from "@/lib/chat.api";
import { servicesApi } from "@/lib/services.api";
import { CATEGORY_NAMES, CATEGORY_BY_NAME, DEFAULT_CATEGORY_ICON } from "@/lib/categories";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const CATS  = ["Todos", ...CATEGORY_NAMES];
const SORTS = ["Mais próximo","Melhor avaliação","Menor preço"];

const COMPANY_CATEGORY_KEYWORDS: Record<string, string[]> = {
  "TI & Redes":   ["ti", "tecnologia", "technology", "tech", "redes", "software", "informatica", "digital", "it", "sistemas", "tic"],
  "Construção":   ["constru", "obra", "engenharia", "civil", "arquitetura", "imobil"],
  "Limpeza":      ["limpeza", "cleaning", "higiene", "clean", "desinfe"],
  "Climatização": ["climati", "avac", "ar condicion", "refriger", "hvac", "cooling"],
  "Canalização":  ["canaliz", "plumb", "encanament", "hidraul", "agua"],
  "Eletricidade": ["eletric", "electri", "energia", "electrical", "eletro"],
  "Jardinagem":   ["jardim", "garden", "paisag", "verde", "plant"],
  "Mudanças":     ["mudan", "transport", "logistic", "cargo", "frete"],
  "Beleza":       ["beleza", "estetica", "cabelei", "beauty", "spa", "saude", "cosmet"],
  "Automóvel":    ["automovel", "auto", "mecanica", "carro", "vehicle", "motor"],
  "Pintura":      ["pintura", "decorac", "paint", "tinta", "artist"],
  "Segurança":    ["seguran", "security", "vigilan", "protec", "guard"],
};

interface SearchResult {
  key:                 string;
  providerId:          string;
  providerName:        string;
  providerAvatar?:     string;
  companyLogoUrl?:     string;
  isOnline?:           boolean;
  category?:           string;
  bio?:                string;
  catalogItemId?:      string;
  catalogTitle?:       string;
  catalogDescription?: string;
  pricePerHour?:       number;
  address?:            string;
  source:              "provider" | "catalog";
  cardType:            "provider" | "company";
  isCompany:           boolean;
  companyId?:          string | null;
}

type SolicitState = "idle" | "loading" | "done" | "error";

function isCompanyCard(item: SearchResult): boolean {
  return item.cardType === "company" || item.isCompany === true;
}

function SearchInner() {
  const router = useRouter();
  const sp     = useSearchParams();

  const [query, setQuery]               = useState(sp.get("q") ?? "");
  const [cat, setCat]                   = useState(sp.get("category") ?? "Todos");
  const [sort, setSort]                 = useState("Mais próximo");
  const [showFilters, setShowFilters]   = useState(false);
  const [results, setResults]           = useState<SearchResult[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [solicitStates, setSolicitStates] = useState<Record<string, SolicitState>>({});
  const [quoteLoadingId, setQuoteLoadingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token   = getToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const catQ    = cat !== "Todos" ? `?category=${encodeURIComponent(cat)}` : "";

      const [pRes, cRes] = await Promise.allSettled([
        fetch(`${API_URL}/users/providers${catQ}`, { headers }),
        fetch(`${API_URL}/catalog${catQ}`,         { headers }),
      ]);

      const rawProviders: any[] = pRes.status === "fulfilled" && pRes.value.ok
        ? await pRes.value.json() : [];
      const rawCatalog: any[]   = cRes.status === "fulfilled" && cRes.value.ok
        ? await cRes.value.json() : [];

      const merged: SearchResult[] = [];
      const providerIdsWithCatalog = new Set<string>();

      rawCatalog.forEach((item, idx) => {
        const pid = item.providerId ?? item.provider?.id;
        if (!pid) return;
        providerIdsWithCatalog.add(pid);
        merged.push({
          key:                `catalog_${item.id ?? `${pid}_${idx}`}`,
          providerId:         pid,
          providerName:       item.provider?.fullName ?? "Prestador",
          providerAvatar:     item.provider?.avatarUrl,
          isOnline:           item.provider?.isOnline ?? false,
          category:           item.category,
          catalogItemId:      item.id,
          catalogTitle:       item.title,
          catalogDescription: item.description,
          pricePerHour:       item.pricePerHour ? Number(item.pricePerHour) : undefined,
          address:            item.address,
          source:             "catalog",
          cardType:           "provider",
          isCompany:          false,
          companyId:          null,
        });
      });

      for (const p of rawProviders) {
        if (p.cardType === "company" || p.isCompany === true) {
          merged.push({
            key:            `company_${p.companyId ?? p.id}`,
            providerId:     p.id,
            providerName:   p.fullName,
            companyLogoUrl: p.companyLogoUrl,
            isOnline:       false,
            category:       p.category,
            bio:            p.bio,
            source:         "provider",
            cardType:       "company",
            isCompany:      true,
            companyId:      p.companyId,
          });
        } else if (!providerIdsWithCatalog.has(p.id)) {
          merged.push({
            key:           `provider_${p.id}`,
            providerId:    p.id,
            providerName:  p.fullName,
            providerAvatar: p.avatarUrl,
            isOnline:      p.isOnline,
            category:      p.category,
            bio:           p.bio,
            source:        "provider",
            cardType:      "provider",
            isCompany:     false,
            companyId:     null,
          });
        }
      }

      setResults(merged);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar prestadores.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [cat]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = results.filter(r => {
    const isComp = isCompanyCard(r);

    if (isComp && cat !== "Todos") {
      const cardCat  = (r.category ?? "").toLowerCase();
      const keywords = COMPANY_CATEGORY_KEYWORDS[cat] ?? [cat.toLowerCase()];
      const matches  = cardCat === cat.toLowerCase() ||
                       keywords.some(kw => cardCat.includes(kw));
      if (!matches) return false;
    }

    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.providerName.toLowerCase().includes(q) ||
      r.category?.toLowerCase().includes(q) ||
      r.bio?.toLowerCase().includes(q) ||
      r.catalogTitle?.toLowerCase().includes(q) ||
      r.catalogDescription?.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    if (sort === "Mais próximo") {
      const aScore = isCompanyCard(a) ? 2 : (a.isOnline ? 1 : 0);
      const bScore = isCompanyCard(b) ? 2 : (b.isOnline ? 1 : 0);
      return bScore - aScore;
    }
    if (sort === "Menor preço") return (a.pricePerHour ?? 999999) - (b.pricePerHour ?? 999999);
    return 0;
  });

  const handleSolicitar = async (item: SearchResult) => {
    if (!item.catalogItemId || solicitStates[item.key] === "done") return;
    setSolicitStates(p => ({ ...p, [item.key]: "loading" }));
    try {
      await servicesApi.create({
        title:            item.catalogTitle!,
        description:      item.catalogDescription || item.catalogTitle!,
        category:         item.category!,
        address:          item.address || "Luanda, Angola",
        budget:           item.pricePerHour || 0,
        targetProviderId: item.providerId,
        catalogItemId:    item.catalogItemId,
      });
      setSolicitStates(p => ({ ...p, [item.key]: "done" }));
    } catch {
      setSolicitStates(p => ({ ...p, [item.key]: "error" }));
      setTimeout(() => setSolicitStates(p => ({ ...p, [item.key]: "idle" })), 2000);
    }
  };

  const handleOrcamento = async (itemKey: string, providerId: string) => {
    setQuoteLoadingId(itemKey);
    try {
      const { room } = await chatApi.createOrGetRoom({ participantId: providerId });
      await chatApi.sendMessage(room.id, "Olá! Gostaria de solicitar um orçamento. Podem ajudar-me?");
      router.push(`/chat/${room.id}`);
    } catch {
      router.push("/chat");
    } finally {
      setQuoteLoadingId(null);
    }
  };

  const handleViewProfile = (providerId: string) => {
    router.push(`/prestador/${providerId}`);
  };

  return (
    <>
      <style>{`
        *{box-sizing:border-box}
        .sw{display:flex;min-height:100vh;background:#f8fafc}
        .sm{flex:1;margin-left:240px;min-width:0;display:flex;flex-direction:column}
        .si{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:20px;min-width:0}
        .sbar{display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:14px;background:#ffffff;border:1px solid #eef1f5;width:100%;box-shadow:0 1px 3px rgba(15,23,42,0.04);transition:border-color .15s,box-shadow .15s}
        .sbar:focus-within{border-color:#1D9E75;box-shadow:0 4px 14px rgba(29,158,117,0.10)}
        .sinput{flex:1;background:none;border:none;outline:none;font-size:14px;color:#0f172a;font-family:inherit;min-width:0}
        .sinput::placeholder{color:#94a3b8}
        .cscroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none}
        .cscroll::-webkit-scrollbar{display:none}
        @media(min-width:1025px){
          .cscroll{scrollbar-width:thin;scrollbar-color:#e2e8f0 transparent;padding-bottom:8px}
          .cscroll::-webkit-scrollbar{display:block;height:4px}
          .cscroll::-webkit-scrollbar-track{background:transparent}
          .cscroll::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:99px}
          .cscroll::-webkit-scrollbar-thumb:hover{background:#cbd5e1}
        }
        .cpill{padding:7px 14px;border-radius:99px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;border:1px solid #e2e8f0;background:#ffffff;color:#64748b;transition:all 0.15s;flex-shrink:0;font-family:inherit}
        .cpill:hover{border-color:#bbf7e8;color:#0E7A5F}
        .cpill.on{background:linear-gradient(135deg,#1D9E75,#159163);border-color:#1D9E75;color:white;box-shadow:0 4px 12px rgba(29,158,117,0.25)}
        .fbtn{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:10px;font-size:12px;cursor:pointer;border:1px solid #e2e8f0;background:#ffffff;color:#64748b;font-family:inherit;flex-shrink:0;transition:all 0.15s}
        .fbtn:hover{border-color:#bbf7e8;color:#0E7A5F}
        .fbtn.on{background:#e3f5ee;border-color:#1D9E75;color:#0E7A5F}
        .fpanel{display:flex;gap:20px;flex-wrap:wrap;padding:16px;border-radius:14px;background:#ffffff;border:1px solid #eef1f5;box-shadow:0 1px 3px rgba(15,23,42,0.04)}
        .fchip{padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;transition:all 0.15s}
        .fchip:hover{border-color:#bbf7e8;color:#0E7A5F}
        .fchip.on{background:#1D9E75;border-color:#1D9E75;color:white}
        .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
        .pcard{background:#E2E8F0;border:1px solid #cbd5e1;border-radius:16px;padding:20px;transition:transform 0.18s ease,box-shadow 0.18s ease,border-color 0.18s ease;cursor:default;box-shadow:0 1px 4px rgba(15,23,42,0.06)}
        .pcard:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(15,23,42,0.12);border-color:#1D9E75}
        .pcard.company-card{border-color:#c7c5fb}
        .pcard.company-card:hover{border-color:#4F46E5;box-shadow:0 12px 28px rgba(79,70,229,0.16)}
        .sol-idle{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:10px;flex:1;border:none;background:linear-gradient(135deg,#1D9E75,#159163);color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.2s;box-shadow:0 3px 10px rgba(29,158,117,0.28)}
        .sol-idle:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(29,158,117,0.4)}
        .sol-load{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:10px;flex:1;border:1px solid #a7ddc9;background:#cdece0;color:#0E7A5F;font-size:13px;font-weight:600;font-family:inherit;pointer-events:none}
        .sol-done{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:10px;flex:1;border:1px solid #159163;background:linear-gradient(135deg,#1D9E75,#0E7A5F);color:white;font-size:13px;font-weight:700;font-family:inherit;pointer-events:none;box-shadow:0 4px 14px rgba(29,158,117,0.32)}
        .sol-err{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:10px;flex:1;border:1px solid #fca5a5;background:#fee2e2;color:#b91c1c;font-size:13px;font-weight:600;font-family:inherit;pointer-events:none}
        .orc-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:10px;border:1.5px solid #0D9488;background:#ffffff;color:#0D9488;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .orc-btn:hover:not(:disabled){background:#0D9488;color:white;box-shadow:0 4px 14px rgba(13,148,136,0.32)}
        .orc-btn:disabled{opacity:0.5;cursor:not-allowed}
        .orc-full{flex:1}
        .ver-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:10px;border:none;background:linear-gradient(135deg,#4F46E5,#4338ca);color:white;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;flex:1;box-shadow:0 3px 10px rgba(79,70,229,0.28)}
        .ver-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(79,70,229,0.4)}
        .perfil-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:10px;border:1.5px solid #1D9E75;background:#ffffff;color:#1D9E75;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s}
        .perfil-btn:hover{background:#1D9E75;color:white;box-shadow:0 4px 14px rgba(29,158,117,0.32)}
        .empty-s{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;gap:16px;text-align:center}
        .sk{background:#e2e8f0;border-radius:8px;animation:sk 1.5s infinite}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:1024px){.sm{margin-left:0}.si{padding:80px 20px 24px}}
        @media(max-width:640px){.si{padding:72px 12px 24px;gap:14px}.pgrid{grid-template-columns:1fr}}
      `}</style>

      <div className="sw">
        <Sidebar/>
        <div className="sm">
          <Navbar/>
          <div className="si">

            <div>
              <h1 style={{fontSize:22,fontWeight:700,color:"#0f172a",marginBottom:4}}>Pesquisar prestadores</h1>
              <p style={{fontSize:13,color:"#64748b"}}>
                {loading ? "A carregar..." : error ? "" :
                  filtered.length > 0 ? `${filtered.length} resultado${filtered.length!==1?"s":""}` : "Encontra o profissional certo"}
              </p>
            </div>

            <div className="sbar">
              <Search size={16} style={{color:"#94a3b8",flexShrink:0}}/>
              <input className="sinput" placeholder="Pesquisa por nome, empresa, serviço ou categoria..." value={query} onChange={e => setQuery(e.target.value)}/>
              {query && (
                <button onClick={() => setQuery("")} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",display:"flex"}}>
                  <X size={14}/>
                </button>
              )}
              <button className={`fbtn${showFilters?" on":""}`} onClick={() => setShowFilters(f => !f)}>
                <Filter size={13}/> Filtros
              </button>
            </div>

            {showFilters && (
              <div className="fpanel">
                <div>
                  <p style={{fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Ordenar</p>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {SORTS.map(s=><button key={s} className={`fchip${sort===s?" on":""}`} onClick={()=>setSort(s)}>{s}</button>)}
                  </div>
                </div>
                <button onClick={fetchAll} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#64748b",fontSize:12,cursor:"pointer",fontFamily:"inherit",alignSelf:"flex-end"}}>
                  <RefreshCw size={12}/> Actualizar
                </button>
              </div>
            )}

            <div className="cscroll">
              {CATS.map(c => (
                <button key={c} className={`cpill${cat===c?" on":""}`} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>

            {loading ? (
              <div className="pgrid">
                {[1,2,3,4,5,6].map(i=>(
                  <div key={i} style={{background:"#E2E8F0",border:"1px solid #cbd5e1",borderRadius:16,padding:20}}>
                    <div style={{display:"flex",gap:12,marginBottom:14}}>
                      <div className="sk" style={{width:52,height:52,borderRadius:"50%",flexShrink:0,background:"#cbd5e1"}}/>
                      <div style={{flex:1}}>
                        <div className="sk" style={{width:"60%",height:14,marginBottom:8,background:"#cbd5e1"}}/>
                        <div className="sk" style={{width:"40%",height:11,background:"#cbd5e1"}}/>
                      </div>
                    </div>
                    <div className="sk" style={{width:"80%",height:11,marginBottom:14,background:"#cbd5e1"}}/>
                    <div style={{display:"flex",gap:8}}>
                      <div className="sk" style={{flex:1,height:38,borderRadius:10,background:"#cbd5e1"}}/>
                      <div className="sk" style={{flex:1,height:38,borderRadius:10,background:"#cbd5e1"}}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:12}}>
                <p style={{fontSize:13,color:"#dc2626",flex:1}}>{error}</p>
                <button onClick={fetchAll} style={{fontSize:12,color:"#dc2626",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Tentar novamente</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-s">
                <div style={{width:64,height:64,borderRadius:20,background:"#ffffff",border:"1px solid #eef1f5",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Briefcase size={28} style={{color:"#cbd5e1"}}/>
                </div>
                <p style={{fontSize:16,fontWeight:700,color:"#334155"}}>
                  {query||cat!=="Todos" ? "Nenhum resultado encontrado" : "Prestadores em breve"}
                </p>
                <p style={{fontSize:13,color:"#64748b",lineHeight:1.6,maxWidth:320}}>
                  {query||cat!=="Todos" ? "Tenta outra pesquisa ou categoria." : "Os prestadores verificados aparecem aqui após completarem o KYC."}
                </p>
                {(query||cat!=="Todos") && (
                  <button onClick={()=>{setQuery("");setCat("Todos");}} style={{fontSize:13,color:"#1D9E75",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="pgrid">
                {filtered.map(item => {
                  const sol        = solicitStates[item.key] ?? "idle";
                  const isCompany  = isCompanyCard(item);
                  const isCatalog  = item.source === "catalog";
                  const catMeta    = CATEGORY_BY_NAME[item.category ?? ""];
                  const CatIcon    = catMeta?.Icon ?? DEFAULT_CATEGORY_ICON.Icon;
                  const catColor   = catMeta?.color ?? DEFAULT_CATEGORY_ICON.color;
                  const imageUrl   = isCompany ? item.companyLogoUrl : item.providerAvatar;

                  return (
                    <div
                      className={`pcard${isCompany ? " company-card" : ""}`}
                      key={item.key}
                    >
                      <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14}}>
                        <div style={{
                          width:52, height:52, flexShrink:0, position:"relative",
                          borderRadius: isCompany ? 12 : "50%",
                          background: isCompany ? "#eeecfe" : (item.isOnline ? "#dcfce7" : "#f1f5f9"),
                          border: isCompany ? "1px solid #c7c5fb" : "1px solid #f8fafc",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          overflow:"hidden",
                        }}>
                          {imageUrl
                            ? <img src={imageUrl} alt={item.providerName} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                            : isCompany
                              ? <Building2 size={22} style={{color:"#4F46E5"}}/>
                              : <CatIcon size={22} style={{color:catColor}}/>
                          }
                          {!isCompany && (
                            <div style={{
                              position:"absolute", bottom:1, right:1,
                              width:13, height:13, borderRadius:"50%",
                              background: item.isOnline ? "#1D9E75" : "#94a3b8",
                              border:"2px solid #E2E8F0",
                            }}/>
                          )}
                        </div>

                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:6,marginBottom:3}}>
                            <p style={{fontSize:15,fontWeight:700,color:"#0f172a",margin:0}}>
                              {item.providerName}
                            </p>
                            {isCompany && (
                              <span style={{
                                fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:99,
                                background:"#eeecfe", color:"#4F46E5", border:"1px solid #d7d5fb",
                                display:"flex", alignItems:"center", gap:3, flexShrink:0,
                              }}>
                                <Building2 size={9}/> Empresa
                              </span>
                            )}
                            {!isCompany && isCatalog && (
                              <span style={{
                                fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:99,
                                background:"#f5f3ff", color:"#7C3AED", border:"1px solid #ddd6fe",
                                display:"flex", alignItems:"center", gap:3, flexShrink:0,
                              }}>
                                <Package size={9}/> Catálogo
                              </span>
                            )}
                          </div>

                          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                            {item.category && (
                              <span style={{fontSize:12,padding:"2px 8px",borderRadius:99,background:"#ffffff",color:"#475569",border:"1px solid #cbd5e1"}}>
                                {item.category}
                              </span>
                            )}
                            {!isCompany && (
                              <span style={{fontSize:11,display:"flex",alignItems:"center",gap:3,color:item.isOnline?"#0E7A5F":"#64748b",fontWeight:600}}>
                                {item.isOnline ? <Wifi size={11}/> : <WifiOff size={11}/>}
                                {item.isOnline ? "Online" : "Offline"}
                              </span>
                            )}
                            {!isCompany && item.pricePerHour && (
                              <span style={{fontSize:12,color:"#B45309",fontWeight:800}}>
                                {Number(item.pricePerHour).toLocaleString("pt-PT")} Kz/h
                              </span>
                            )}
                          </div>

                          {!isCompany && (item.catalogTitle || item.bio) && (
                            <p style={{
                              fontSize:12, color:"#475569", lineHeight:1.5, margin:0,
                              overflow:"hidden", textOverflow:"ellipsis",
                              display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                            }}>
                              {item.catalogTitle ?? item.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>

                        {isCompany ? (
                          <button className="ver-btn" onClick={() => item.companyId && router.push(`/company/${item.companyId}`)}>
                            <Building2 size={13}/> Ver empresa
                          </button>

                        ) : (
                          <>
                            <button className="perfil-btn" onClick={() => handleViewProfile(item.providerId)}>
                              <User size={13}/> Ver Perfil
                            </button>

                            {isCatalog ? (
                              <>
                                {sol === "idle" && (
                                  <button className="sol-idle" onClick={() => handleSolicitar(item)}>
                                    <Package size={14}/> Solicitar
                                  </button>
                                )}
                                {sol === "loading" && (
                                  <div className="sol-load">
                                    <Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>
                                    A solicitar...
                                  </div>
                                )}
                                {sol === "done" && (
                                  <div className="sol-done">
                                    <CheckCircle size={14}/> Solicitado
                                  </div>
                                )}
                                {sol === "error" && (
                                  <div className="sol-err">Erro — tenta novamente</div>
                                )}
                                <button
                                  className="orc-btn"
                                  disabled={quoteLoadingId === item.key}
                                  onClick={() => handleOrcamento(item.key, item.providerId)}
                                >
                                  {quoteLoadingId === item.key
                                    ? <Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>
                                    : <FileText size={14}/>}
                                  {quoteLoadingId === item.key ? "A abrir..." : "Orçamento"}
                                </button>
                              </>
                            ) : (
                              <button
                                className="orc-btn"
                                disabled={quoteLoadingId === item.key}
                                onClick={() => handleOrcamento(item.key, item.providerId)}
                              >
                                {quoteLoadingId === item.key
                                  ? <Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>
                                  : <FileText size={14}/>}
                                {quoteLoadingId === item.key ? "A abrir..." : "Orçamento"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f8fafc"}}>
        <Loader2 size={24} style={{color:"#1D9E75",animation:"spin 1s linear infinite"}}/>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <SearchInner/>
    </Suspense>
  );
}
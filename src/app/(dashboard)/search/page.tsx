"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Search, MapPin, Star, Clock, Filter, Briefcase } from "lucide-react";

const cats = ["Todos", "Limpeza", "Climatização", "Canalização", "Eletricista", "TI & Redes", "Jardinagem", "Mudanças", "Beleza", "Automóvel", "Pintura", "Construção", "Segurança"];
const distances = ["5km", "10km", "20km", "50km"];
const sorts = ["Mais próximo", "Melhor avaliação", "Menor preço"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Todos");
  const [dist, setDist] = useState("10km");
  const [sort, setSort] = useState("Mais próximo");
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      <style>{`
        .search-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .search-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .search-inner { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; }
        .search-bar { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-radius: 14px; background: #131b27; border: 1px solid #1a2535; }
        .search-input { flex: 1; background: none; border: none; outline: none; font-size: 15px; color: #e2e8f0; }
        .search-input::placeholder { color: #4a5a6a; }
        .cats-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .cats-scroll::-webkit-scrollbar { display: none; }
        .cat-pill { padding: 8px 16px; border-radius: 99px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; border: 1px solid #1a2535; background: #131b27; color: #6a7a8a; transition: all 0.15s; flex-shrink: 0; }
        .cat-pill.active { background: #1D9E75; border-color: #1D9E75; color: white; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; gap: 16px; text-align: center; }
        @media (max-width: 1024px) { .search-main { margin-left: 0; } }
        @media (max-width: 640px) { .search-inner { padding: 16px; } }
      `}</style>
      <div className="search-wrap">
        <Sidebar />
        <div className="search-main">
          <Navbar />
          <div className="search-inner">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Pesquisar prestadores</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Encontra o profissional certo perto de ti</p>
            </div>

            <div className="search-bar">
              <Search size={18} style={{ color: "#4a7070", flexShrink: 0 }} />
              <input className="search-input" placeholder="Pesquisa por nome ou serviço..." value={query} onChange={e => setQuery(e.target.value)} />
              <button onClick={() => setShowFilters(!showFilters)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: showFilters ? "#1d9e7520" : "#0d1117", border: `1px solid ${showFilters ? "#1D9E75" : "#1a2535"}`, color: showFilters ? "#1D9E75" : "#6a7a8a", fontSize: 13, cursor: "pointer" }}>
                <Filter size={14} /> Filtros
              </button>
            </div>

            {showFilters && (
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", padding: 16, borderRadius: 14, background: "#131b27", border: "1px solid #1a2535" }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#4a5a6a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Distância</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {distances.map(d => (
                      <button key={d} onClick={() => setDist(d)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: dist === d ? "#1D9E75" : "#0d1117", color: dist === d ? "white" : "#6a7a8a", border: `1px solid ${dist === d ? "#1D9E75" : "#1a2535"}` }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#4a5a6a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ordenar</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {sorts.map(s => (
                      <button key={s} onClick={() => setSort(s)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer", background: sort === s ? "#1D9E75" : "#0d1117", color: sort === s ? "white" : "#6a7a8a", border: `1px solid ${sort === s ? "#1D9E75" : "#1a2535"}` }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="cats-scroll">
              {cats.map(c => (
                <button key={c} className={`cat-pill${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>

            <div className="empty-state">
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "#131b27", border: "1px solid #1a2535", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Briefcase size={28} style={{ color: "#2a3a4a" }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#c0d0e0" }}>Prestadores em breve</p>
              <p style={{ fontSize: 13, color: "#4a6a6a", lineHeight: 1.6, maxWidth: 320 }}>
                Estamos a integrar prestadores verificados na plataforma. Usa os filtros acima para pesquisar quando estiverem disponíveis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
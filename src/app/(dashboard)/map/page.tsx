"use client";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { MapPin, Search, Filter, Navigation } from "lucide-react";

export default function MapPage() {
  return (
    <>
      <style>{`
        .map-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .map-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .map-inner { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; }
        .map-container { border-radius: 20px; overflow: hidden; border: 1px solid #1a2535; position: relative; min-height: 480px; background: #0b1a1a; }
        .map-grid { position: absolute; inset: 0; opacity: 0.08; background-image: linear-gradient(#1D9E75 1px, transparent 1px), linear-gradient(90deg, #1D9E75 1px, transparent 1px); background-size: 40px 40px; }
        .map-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
        .map-search { position: absolute; top: 16px; left: 16px; right: 72px; }
        .map-search-inner { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; background: #131b27; border: 1px solid #1a2535; }
        .map-controls { position: absolute; top: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; }
        .map-ctrl-btn { width: 40px; height: 40px; border-radius: 10px; background: #131b27; border: 1px solid #1a2535; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8a9ab0; }
        .map-legend { display: flex; gap: 16px; flex-wrap: wrap; }
        @media (max-width: 1024px) { .map-main { margin-left: 0; } }
        @media (max-width: 640px) { .map-inner { padding: 16px; } }
      `}</style>
      <div className="map-wrap">
        <Sidebar />
        <div className="map-main">
          <Navbar />
          <div className="map-inner">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Mapa de prestadores</h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>Activa a localização para ver prestadores perto de ti</p>
            </div>

            <div className="map-legend">
              {[
                { label: "Online", color: "#1D9E75" },
                { label: "Ocupado", color: "#EF9F27" },
                { label: "Offline", color: "#4a5a6a" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, background: "#131b27", border: "1px solid #1a2535" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  <span style={{ fontSize: 13, color: "#8a9ab0" }}>{s.label}</span>
                </div>
              ))}
            </div>

            <div className="map-container">
              <div className="map-grid" />
              <div className="map-center">
                <div style={{ width: 64, height: 64, borderRadius: 20, background: "#131b27", border: "1px solid #1a2535", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Navigation size={28} style={{ color: "#2a3a4a" }} />
                </div>
                <p style={{ fontSize: 14, color: "#2a3545", fontWeight: 600 }}>Mapa interactivo</p>
                <p style={{ fontSize: 12, color: "#1a2535", maxWidth: 240, textAlign: "center" }}>Activa a localização para ver prestadores disponíveis no teu raio</p>
                <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, border: "none", background: "#1D9E75", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <MapPin size={15} /> Activar localização
                </button>
              </div>
              <div className="map-search">
                <div className="map-search-inner">
                  <Search size={15} style={{ color: "#4a7070" }} />
                  <input placeholder="Pesquisa no mapa..." style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "#8a9ab0" }} />
                </div>
              </div>
              <div className="map-controls">
                <div className="map-ctrl-btn"><Filter size={16} /></div>
                <div className="map-ctrl-btn"><Navigation size={16} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  ChevronRight, X, MapPin, Loader2, Check,
  Sparkles, Wind, Wrench, Zap, Monitor, Leaf,
  Package, Scissors, Car, Paintbrush, HardHat, Lock,
} from "lucide-react";
import { getToken } from "@/lib/auth.api";
import { SUBCATEGORIES } from "@/lib/subcategories-data";
import { subcategoryServicesApi } from "@/lib/subcategory-services.api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const ACCENTS = ["#2563eb", "#1D9E75", "#EF9F27"];

const CATEGORIES = [
  { Icon: Sparkles,   label: "Limpeza",      desc: "Limpeza residencial e comercial",     color: ACCENTS[0] },
  { Icon: Wind,       label: "Climatização", desc: "Instalação e manutenção de AC",        color: ACCENTS[1] },
  { Icon: Wrench,     label: "Canalização",  desc: "Fugas, instalações e reparações",      color: ACCENTS[2] },
  { Icon: Zap,        label: "Eletricidade", desc: "Instalações eléctricas e reparações",  color: ACCENTS[0] },
  { Icon: Monitor,    label: "TI & Redes",   desc: "Suporte técnico e redes",              color: ACCENTS[1] },
  { Icon: Leaf,       label: "Jardinagem",   desc: "Poda, manutenção e paisagismo",        color: ACCENTS[2] },
  { Icon: Package,    label: "Mudanças",     desc: "Transporte e mudanças de casa",        color: ACCENTS[0] },
  { Icon: Scissors,   label: "Beleza",       desc: "Cabeleireiro, manicure e estética",    color: ACCENTS[1] },
  { Icon: Car,        label: "Automóvel",    desc: "Mecânica e manutenção auto",           color: ACCENTS[2] },
  { Icon: Paintbrush, label: "Pintura",      desc: "Pintura de interiores e exteriores",   color: ACCENTS[0] },
  { Icon: HardHat,    label: "Construção",   desc: "Obras, remodelações e acabamentos",    color: ACCENTS[1] },
  { Icon: Lock,       label: "Segurança",    desc: "Vigilância e sistemas de segurança",   color: ACCENTS[2] },
];

function SubcategoriesModal({
  category, color, onClose,
}: { category: string; color: string; onClose: () => void }) {
  const router = useRouter();
  const items = SUBCATEGORIES[category] ?? [];

  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChamar = async () => {
    if (!selectedSub || !address.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await subcategoryServicesApi.create({
        category,
        subcategory: selectedSub,
        address: address.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push("/services");
      }, 1400);
    } catch (e: any) {
      setError(e.message || "Erro ao criar o pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff", borderRadius: 20, padding: 0, maxWidth: 520, width: "100%",
          maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(15,23,42,0.25)",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid #eef1f5",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              {category}
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
              {selectedSub ? "Confirma o pedido" : "Escolhe o serviço"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10, background: "#f1f5f9", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <X size={16} style={{ color: "#64748b" }} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {success ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 0" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: `${color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={26} style={{ color }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Pedido enviado!</p>
              <p style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>
                Os prestadores de {selectedSub} perto de ti vão receber o teu pedido.
              </p>
            </div>
          ) : !selectedSub ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {items.map((sub) => {
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.name}
                    onClick={() => setSelectedSub(sub.name)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
                      padding: "16px 14px", borderRadius: 14, border: "1px solid #eef1f5",
                      background: "#ffffff", cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}08`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#eef1f5"; e.currentTarget.style.background = "#ffffff"; }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: `${color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>
                      {sub.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button
                onClick={() => setSelectedSub(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                  color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", width: "fit-content",
                }}
              >
                ← Voltar às subcategorias
              </button>

              <div style={{
                padding: "14px 16px", borderRadius: 12, background: `${color}10`,
                border: `1px solid ${color}30`, display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color }}>{selectedSub}</span>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <MapPin size={14} style={{ color: "#64748b" }} /> Morada
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua Comandante Valódia, Maianga, Luanda"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    border: "1px solid #e2e8f0", background: "#f8fafc",
                    color: "#0f172a", fontSize: 14, outline: "none", fontFamily: "inherit",
                  }}
                />
              </div>

              {error && (
                <div style={{ padding: "10px 12px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 9, fontSize: 12, color: "#b91c1c" }}>
                  {error}
                </div>
              )}

              <button
                disabled={!address.trim() || submitting}
                onClick={handleChamar}
                style={{
                  width: "100%", padding: 14, borderRadius: 12, border: "none",
                  background: address.trim() ? color : "#e2e8f0",
                  color: address.trim() ? "#ffffff" : "#94a3b8",
                  fontSize: 14, fontWeight: 700, cursor: address.trim() && !submitting ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  fontFamily: "inherit",
                }}
              >
                {submitting && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                {submitting ? "A enviar..." : "Chamar"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const router = useRouter();
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalCategory, setModalCategory] = useState<{ label: string; color: string } | null>(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_URL}/users/category-counts`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { category: string; count: number }[]) => {
        setTotal(data.reduce((sum, d) => sum + d.count, 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        .cw{display:flex;min-height:100vh;background:#f8fafc}
        .cm{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .ci{flex:1;padding:28px 32px}

        .cgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:24px}

        .ccard{position:relative;overflow:hidden;border-radius:14px;padding:20px 18px 18px;background:#ffffff;border:1px solid #eef1f5;box-shadow:0 1px 3px rgba(15,23,42,0.04);transition:all 0.22s ease;display:flex;flex-direction:column}
        .ccard::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg, var(--cc) 0%, transparent 58%);opacity:0.07;pointer-events:none;transition:opacity 0.22s}
        .ccard:hover{transform:translateY(-3px);border-color:color-mix(in srgb, var(--cc) 40%, transparent);box-shadow:0 10px 26px color-mix(in srgb, var(--cc) 16%, transparent)}
        .ccard:hover::before{opacity:0.12}

        .cico{position:relative;z-index:1;width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;flex-shrink:0;background:color-mix(in srgb, var(--cc) 16%, transparent);border:1px solid color-mix(in srgb, var(--cc) 30%, transparent);transition:transform 0.2s;cursor:pointer}
        .ccard:hover .cico{transform:scale(1.08)}

        .cghost{position:absolute;right:-8px;bottom:-8px;opacity:0.05;pointer-events:none;z-index:0;transition:opacity 0.22s,transform 0.22s}
        .ccard:hover .cghost{opacity:0.1;transform:scale(1.06) rotate(-5deg)}

        .carr{position:absolute;top:14px;right:14px;width:26px;height:26px;border-radius:8px;background:rgba(15,23,42,0.05);display:flex;align-items:center;justify-content:center;transition:background 0.18s;cursor:pointer}
        .ccard:hover .carr{background:rgba(15,23,42,0.09)}

        .csub-btn{
          display:flex;align-items:center;justify-content:center;gap:6px;
          margin-top:12px;padding:9px 12px;border-radius:10px;
          font-size:12px;font-weight:700;cursor:pointer;
          background:color-mix(in srgb, var(--cc) 12%, white);
          border:1px solid color-mix(in srgb, var(--cc) 30%, transparent);
          color:var(--cc);position:relative;z-index:1;transition:all 0.15s;
        }
        .csub-btn:hover{background:var(--cc);color:#ffffff}

        .sk{background:#e2e8f0;border-radius:6px;animation:sk 1.5s infinite;display:inline-block}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}

        @media(max-width:1200px){.cgrid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:1024px){.cm{margin-left:0}.cgrid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:768px){.ci{padding:80px 16px 24px}.cgrid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.ci{padding:70px 12px 20px}.cgrid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:360px){.cgrid{grid-template-columns:1fr}}
      `}</style>

      <div className="cw">
        <Sidebar />
        <div className="cm">
          <Navbar />
          <div className="ci">

            <div style={{ marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                Todas as categorias
              </h1>
              <p style={{ fontSize: 13, color: "#64748b" }}>
                {CATEGORIES.length} categorias ·{" "}
                {loading
                  ? <span className="sk" style={{ width: 60, height: 12 }} />
                  : `${total} prestador${total !== 1 ? "es" : ""} no total`}
              </p>
            </div>

            <div className="cgrid">
              {CATEGORIES.map((c, i) => {
                const Icon = c.Icon;
                return (
                  <div
                    key={i}
                    className="ccard"
                    style={{ "--cc": c.color } as React.CSSProperties}
                  >
                    <div className="cico" onClick={() => router.push(`/search?category=${encodeURIComponent(c.label)}`)}>
                      <Icon size={22} style={{ color: c.color }} />
                    </div>

                    <p
                      onClick={() => router.push(`/search?category=${encodeURIComponent(c.label)}`)}
                      style={{
                        fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3, lineHeight: 1.2,
                        position: "relative", zIndex: 1, cursor: "pointer",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      {c.label}
                    </p>
                    <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.45, position: "relative", zIndex: 1 }}>
                      {c.desc}
                    </p>

                    <button
                      className="csub-btn"
                      onClick={() => setModalCategory({ label: c.label, color: c.color })}
                    >
                      Ver Subcategorias
                    </button>

                    <span className="cghost">
                      <Icon size={80} style={{ color: c.color }} />
                    </span>

                    <div className="carr" onClick={() => router.push(`/search?category=${encodeURIComponent(c.label)}`)}>
                      <ChevronRight size={14} style={{ color: "rgba(15,23,42,0.4)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {modalCategory && (
        <SubcategoriesModal
          category={modalCategory.label}
          color={modalCategory.color}
          onClose={() => setModalCategory(null)}
        />
      )}
    </>
  );
}
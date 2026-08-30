"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, X, MapPin, Loader2, Check, ArrowLeft } from "lucide-react";
import { getToken } from "@/lib/auth.api";
import { CATEGORIES } from "@/lib/categories";
import { SUBCATEGORIES } from "@/lib/subcategories-data";
import { subcategoryServicesApi } from "@/lib/subcategory-services.api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function SubcategoriesModal({
  category, onClose,
}: { category: string; onClose: () => void }) {
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
      setError(e instanceof Error ? e.message : "Erro ao criar o pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.55)",
        zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff", borderRadius: 20, padding: 0,
          maxWidth: 520, width: "100%", maxHeight: "85vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(15,23,42,0.25)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid #eef1f5",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              {category}
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
              {selectedSub ? "Confirma o pedido" : "Escolhe o serviço"}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10, background: "#f1f5f9",
              border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <X size={16} style={{ color: "#64748b" }} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {success ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 0" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "#f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={26} style={{ color: "#0f172a" }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Pedido enviado!</p>
              <p style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>
                Os prestadores de {selectedSub} perto de ti vão receber o teu pedido.
              </p>
            </div>

          ) : !selectedSub ? (
            /* ═══ GRID DE SUBCATEGORIAS ═══ */
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {items.map((sub) => {
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.name}
                    onClick={() => setSelectedSub(sub.name)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start",
                      gap: 10, padding: "16px 14px", borderRadius: 14,
                      border: "1px solid #eef1f5", background: "#ffffff",
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#eef1f5";
                      e.currentTarget.style.background = "#ffffff";
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, background: "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={18} style={{ color: "#475569" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>
                      {sub.name}
                    </span>
                  </button>
                );
              })}
            </div>

          ) : (
            /* ═══ CONFIRMAÇÃO DO PEDIDO ═══ */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button
                onClick={() => setSelectedSub(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "none", border: "none", color: "#64748b",
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit", width: "fit-content",
                }}
              >
                ← Voltar às subcategorias
              </button>

              <div style={{
                padding: "14px 16px", borderRadius: 12, background: "#f8fafc",
                border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{selectedSub}</span>
              </div>

              <div>
                <label style={{
                  fontSize: 13, fontWeight: 600, color: "#334155",
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
                }}>
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
                <div style={{
                  padding: "10px 12px", background: "#fef2f2",
                  border: "1px solid #fca5a5", borderRadius: 9, fontSize: 12, color: "#b91c1c",
                }}>
                  {error}
                </div>
              )}

              <button
                disabled={!address.trim() || submitting}
                onClick={handleChamar}
                style={{
                  width: "100%", padding: 14, borderRadius: 12, border: "none",
                  background: address.trim() ? "#0f172a" : "#e2e8f0",
                  color: address.trim() ? "#ffffff" : "#94a3b8",
                  fontSize: 14, fontWeight: 700,
                  cursor: address.trim() && !submitting ? "pointer" : "not-allowed",
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
  const [modalCategory, setModalCategory] = useState<string | null>(null);

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
        .cm{flex:1;display:flex;flex-direction:column}
        .ci{flex:1;padding:28px 32px}

        .cgrid{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:10px;
          margin-top:24px;
        }

        .ccard{
          position:relative;overflow:hidden;border-radius:14px;
          padding:20px 18px 18px;background:#ffffff;
          border:1px solid #eef1f5;
          box-shadow:0 1px 3px rgba(15,23,42,0.04);
          transition:all 0.22s ease;
          display:flex;flex-direction:column;
        }
        .ccard:hover{
          transform:translateY(-3px);
          border-color:#cbd5e1;
          box-shadow:0 10px 26px rgba(15,23,42,0.08);
        }

        /* ícone da categoria */
        .cico{
          position:relative;z-index:1;
          width:46px;height:46px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          margin-bottom:14px;flex-shrink:0;
          background:#f1f5f9;border:1px solid #e2e8f0;
          transition:transform 0.2s, background 0.2s;
          cursor:pointer;
        }
        .ccard:hover .cico{
          transform:scale(1.08);
          background:#e8f5f1;
          border-color:#a7ddc9;
        }
        /* ícone SVG dentro do .cico — troca de cor no hover */
        .cico svg{
          transition:stroke 0.2s;
        }
        .ccard:hover .cico svg{
          stroke:#1D9E75;
        }

        /* ícone fantasma de fundo */
        .cghost{
          position:absolute;right:-8px;bottom:-8px;
          opacity:0.04;pointer-events:none;z-index:0;
          transition:opacity 0.22s, transform 0.22s;
        }
        .ccard:hover .cghost{
          opacity:0.07;
          transform:scale(1.06) rotate(-5deg);
        }
        .cghost svg{
          stroke:#94a3b8;
        }

        /* seta */
        .carr{
          position:absolute;top:14px;right:14px;
          width:26px;height:26px;border-radius:8px;
          background:rgba(15,23,42,0.05);
          display:flex;align-items:center;justify-content:center;
          transition:background 0.18s;cursor:pointer;
        }
        .ccard:hover .carr{background:rgba(15,23,42,0.09)}

        /* botão subcategorias */
        .csub-btn{
          display:flex;align-items:center;justify-content:center;gap:6px;
          margin-top:12px;padding:9px 12px;border-radius:10px;
          font-size:12px;font-weight:700;cursor:pointer;
          background:#f1f5f9;border:1px solid #e2e8f0;color:#334155;
          position:relative;z-index:1;transition:all 0.15s;
        }
        .csub-btn:hover{background:#0f172a;border-color:#0f172a;color:#ffffff}

        .sk{background:#e2e8f0;border-radius:6px;animation:sk 1.5s infinite;display:inline-block}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}

        @media(max-width:1200px){.cgrid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:1024px){.cgrid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:768px){.ci{padding:80px 16px 24px}.cgrid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.ci{padding:70px 12px 20px}.cgrid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:360px){.cgrid{grid-template-columns:1fr}}
      `}</style>

      <div className="cw">
        <div className="cm">
          <div className="ci">

            <button
              onClick={() => router.push("/home")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 600, color: "#475569",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", padding: 0, marginBottom: 16,
              }}
            >
              <ArrowLeft size={15} /> Voltar
            </button>

            <div style={{ marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                Serviços rápidos
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
                  <div key={i} className="ccard">

                    {/* Ícone clicável */}
                    <div
                      className="cico"
                      onClick={() => router.push(`/search?category=${encodeURIComponent(c.name)}`)}
                    >
                      <Icon size={22} color="#475569" />
                    </div>

                    {/* Nome */}
                    <p
                      onClick={() => router.push(`/search?category=${encodeURIComponent(c.name)}`)}
                      style={{
                        fontSize: 13, fontWeight: 700, color: "#0f172a",
                        marginBottom: 3, lineHeight: 1.2,
                        position: "relative", zIndex: 1, cursor: "pointer",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}
                    >
                      {c.name}
                    </p>

                    {/* Descrição */}
                    <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.45, position: "relative", zIndex: 1 }}>
                      {c.desc}
                    </p>

                    {/* Botão subcategorias */}
                    <button className="csub-btn" onClick={() => setModalCategory(c.name)}>
                      Ver Subcategorias
                    </button>

                    {/* Ícone fantasma de fundo */}
                    <span className="cghost">
                      <Icon size={80} color="#94a3b8" />
                    </span>

                    {/* Seta */}
                    <div
                      className="carr"
                      onClick={() => router.push(`/search?category=${encodeURIComponent(c.name)}`)}
                    >
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
          category={modalCategory}
          onClose={() => setModalCategory(null)}
        />
      )}
    </>
  );
}
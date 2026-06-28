"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  ChevronRight,
  Sparkles, Wind, Wrench, Zap, Monitor, Leaf,
  Package, Scissors, Car, Paintbrush, HardHat, Lock,
} from "lucide-react";
import { getToken } from "@/lib/auth.api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Cores e ícones exactamente iguais ao homepage — única source of truth
const CATEGORIES = [
  { Icon: Sparkles,   label: "Limpeza",      desc: "Limpeza residencial e comercial",     color: "#1D9E75" },
  { Icon: Wind,       label: "Climatização", desc: "Instalação e manutenção de AC",        color: "#38bdf8" },
  { Icon: Wrench,     label: "Canalização",  desc: "Fugas, instalações e reparações",      color: "#a78bfa" },
  { Icon: Zap,        label: "Eletricista",  desc: "Instalações eléctricas e reparações",  color: "#fbbf24" },
  { Icon: Monitor,    label: "TI & Redes",   desc: "Suporte técnico e redes",              color: "#60a5fa" },
  { Icon: Leaf,       label: "Jardinagem",   desc: "Poda, manutenção e paisagismo",        color: "#34d399" },
  { Icon: Package,    label: "Mudanças",     desc: "Transporte e mudanças de casa",        color: "#fb923c" },
  { Icon: Scissors,   label: "Beleza",       desc: "Cabeleireiro, manicure e estética",    color: "#f472b6" },
  { Icon: Car,        label: "Automóvel",    desc: "Mecânica e manutenção auto",           color: "#93c5fd" },
  { Icon: Paintbrush, label: "Pintura",      desc: "Pintura de interiores e exteriores",   color: "#e879f9" },
  { Icon: HardHat,    label: "Construção",   desc: "Obras, remodelações e acabamentos",    color: "#fb923c" },
  { Icon: Lock,       label: "Segurança",    desc: "Vigilância e sistemas de segurança",   color: "#818cf8" },
];

export default function CategoriesPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_URL}/users/category-counts`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : [])
      .then((data: { category: string; count: number }[]) => {
        const map: Record<string, number> = {};
        let sum = 0;
        data.forEach(d => { map[d.category] = d.count; sum += d.count; });
        setCounts(map);
        setTotal(sum);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        .cw{display:flex;min-height:100vh;background:#0d1117}
        .cm{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .ci{flex:1;padding:28px 32px}

        /* Grid — 4 colunas no desktop, igual ao homepage */
        .cgrid{
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:10px;
          margin-top:24px;
        }

        /* Card — mesma linguagem do .cat do homepage */
        .ccard{
          position:relative;overflow:hidden;
          border-radius:14px;
          padding:20px 18px 18px;
          cursor:pointer;
          background:#0f1825;
          border:1px solid #1a2535;
          transition:all 0.22s ease;
          display:flex;flex-direction:column;
        }

        /* Gradiente de cor suave — igual ao ::before do homepage */
        .ccard::before{
          content:"";position:absolute;inset:0;
          background:linear-gradient(135deg, var(--cc) 0%, transparent 58%);
          opacity:0.1;pointer-events:none;
          transition:opacity 0.22s;
        }
        .ccard:hover{
          transform:translateY(-3px);
          border-color:color-mix(in srgb, var(--cc) 40%, transparent);
          box-shadow:0 6px 22px color-mix(in srgb, var(--cc) 12%, transparent);
        }
        .ccard:hover::before{opacity:0.16}

        /* Ícone — igual ao .cat-ico do homepage */
        .cico{
          position:relative;z-index:1;
          width:46px;height:46px;border-radius:12px;
          display:flex;align-items:center;justify-content:center;
          margin-bottom:14px;flex-shrink:0;
          background:color-mix(in srgb, var(--cc) 16%, transparent);
          border:1px solid color-mix(in srgb, var(--cc) 30%, transparent);
          transition:transform 0.2s;
        }
        .ccard:hover .cico{transform:scale(1.08)}

        /* Ghost watermark — igual ao .cat-ghost do homepage */
        .cghost{
          position:absolute;right:-8px;bottom:-8px;
          opacity:0.07;pointer-events:none;z-index:0;
          transition:opacity 0.22s,transform 0.22s;
        }
        .ccard:hover .cghost{opacity:0.13;transform:scale(1.06) rotate(-5deg)}

        /* Seta top-right */
        .carr{
          position:absolute;top:14px;right:14px;
          width:26px;height:26px;border-radius:8px;
          background:rgba(255,255,255,0.07);
          display:flex;align-items:center;justify-content:center;
          transition:background 0.18s;
        }
        .ccard:hover .carr{background:rgba(255,255,255,0.13)}

        /* Badge de contagem */
        .cbadge{
          display:inline-flex;align-items:center;
          padding:3px 10px;border-radius:99px;
          font-size:11px;font-weight:700;
          background:rgba(255,255,255,0.07);
          border:1px solid rgba(255,255,255,0.1);
          margin-top:10px;width:fit-content;
          position:relative;z-index:1;
        }

        /* Skeleton */
        .sk{background:#1a2535;border-radius:6px;animation:sk 1.5s infinite;display:inline-block}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}

        /* Responsive */
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
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
                Todas as categorias
              </h1>
              <p style={{ fontSize: 13, color: "#4a6a6a" }}>
                {CATEGORIES.length} categorias ·{" "}
                {loading
                  ? <span className="sk" style={{ width: 60, height: 12 }} />
                  : `${total} prestador${total !== 1 ? "es" : ""} no total`}
              </p>
            </div>

            <div className="cgrid">
              {CATEGORIES.map((c, i) => {
                const Icon  = c.Icon;
                const count = counts[c.label] ?? 0;

                return (
                  <div
                    key={i}
                    className="ccard"
                    style={{ "--cc": c.color } as React.CSSProperties}
                    onClick={() => router.push(`/search?category=${encodeURIComponent(c.label)}`)}
                  >
                    {/* Ícone */}
                    <div className="cico">
                      <Icon size={22} style={{ color: c.color }} />
                    </div>

                    {/* Texto */}
                    <p style={{
                      fontSize: 13, fontWeight: 700, color: "#e2e8f0",
                      marginBottom: 3, lineHeight: 1.2,
                      position: "relative", zIndex: 1,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {c.label}
                    </p>
                    <p style={{
                      fontSize: 11, color: "#4a6a6a", lineHeight: 1.45,
                      position: "relative", zIndex: 1,
                    }}>
                      {c.desc}
                    </p>

                    {/* Contagem */}
                    <div className="cbadge" style={{ color: c.color }}>
                      {loading
                        ? <span className="sk" style={{ width: 50, height: 10 }} />
                        : `${count} prestador${count !== 1 ? "es" : ""}`}
                    </div>

                    {/* Ghost watermark */}
                    <span className="cghost">
                      <Icon size={80} style={{ color: c.color }} />
                    </span>

                    {/* Seta */}
                    <div className="carr">
                      <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import {
  ChevronRight, Loader2,
  Sparkles, Wind, Wrench, Zap, Monitor, Leaf,
  Package, Scissors, Car, Paintbrush, HardHat, Lock,
} from "lucide-react";
import { getToken } from "@/lib/auth.api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const CATEGORIES = [
  { Icon: Sparkles,   label:"Limpeza",       desc:"Limpeza residencial e comercial",       color:"#1D9E75", bg:"linear-gradient(135deg,#0b3d2e,#0e5038)", border:"rgba(29,158,117,0.4)"  },
  { Icon: Wind,       label:"Climatização",  desc:"Instalação e manutenção de AC",         color:"#38bdf8", bg:"linear-gradient(135deg,#062038,#083050)", border:"rgba(56,189,248,0.4)"  },
  { Icon: Wrench,     label:"Canalização",   desc:"Fugas, instalações e reparações",       color:"#a78bfa", bg:"linear-gradient(135deg,#1a0b38,#220d48)", border:"rgba(167,139,250,0.4)"  },
  { Icon: Zap,        label:"Eletricista",   desc:"Instalações eléctricas e reparações",   color:"#fbbf24", bg:"linear-gradient(135deg,#2d1d05,#3a2408)", border:"rgba(251,191,36,0.4)"   },
  { Icon: Monitor,    label:"TI & Redes",    desc:"Suporte técnico e redes",               color:"#60a5fa", bg:"linear-gradient(135deg,#071838,#0a1e48)", border:"rgba(96,165,250,0.4)"   },
  { Icon: Leaf,       label:"Jardinagem",    desc:"Poda, manutenção e paisagismo",         color:"#34d399", bg:"linear-gradient(135deg,#063020,#083a28)", border:"rgba(52,211,153,0.4)"   },
  { Icon: Package,    label:"Mudanças",      desc:"Transporte e mudanças de casa",         color:"#fb923c", bg:"linear-gradient(135deg,#2d1805,#3a2008)", border:"rgba(251,146,60,0.4)"   },
  { Icon: Scissors,   label:"Beleza",        desc:"Cabeleireiro, manicure e estética",     color:"#f472b6", bg:"linear-gradient(135deg,#2a0820,#380a28)", border:"rgba(244,114,182,0.4)"  },
  { Icon: Car,        label:"Automóvel",     desc:"Mecânica e manutenção auto",            color:"#93c5fd", bg:"linear-gradient(135deg,#101c30,#142240)", border:"rgba(147,197,253,0.4)"  },
  { Icon: Paintbrush, label:"Pintura",       desc:"Pintura de interiores e exteriores",    color:"#e879f9", bg:"linear-gradient(135deg,#220830,#2c0a3c)", border:"rgba(232,121,249,0.4)"  },
  { Icon: HardHat,    label:"Construção",    desc:"Obras, remodelações e acabamentos",     color:"#fb923c", bg:"linear-gradient(135deg,#2d1205,#3a1808)", border:"rgba(249,115,22,0.4)"   },
  { Icon: Lock,       label:"Segurança",     desc:"Vigilância e sistemas de segurança",    color:"#818cf8", bg:"linear-gradient(135deg,#0c1038,#101440)", border:"rgba(129,140,248,0.4)"  },
];

export default function CategoriesPage() {
  const router = useRouter();
  const [counts, setCounts]   = useState<Record<string, number>>({});
  const [total, setTotal]     = useState(0);
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

        .cgrid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
          gap:14px;margin-top:24px;
        }

        /* Card base */
        .ccard{
          position:relative;overflow:hidden;
          border-radius:18px;padding:22px 20px 20px;
          cursor:pointer;
          border:1px solid transparent;
          transition:all 0.25s ease;
          display:flex;flex-direction:column;gap:0;
        }
        .ccard:hover{
          transform:translateY(-4px);
          border-color:var(--cborder);
        }

        /* Ghost icon watermark */
        .cghost{
          position:absolute;right:-10px;bottom:-10px;
          opacity:0.1;pointer-events:none;
          transition:opacity 0.25s,transform 0.25s;
        }
        .ccard:hover .cghost{opacity:0.18;transform:scale(1.08) rotate(-6deg)}

        /* Icon badge */
        .cico{
          width:54px;height:54px;border-radius:16px;
          display:flex;align-items:center;justify-content:center;
          margin-bottom:14px;flex-shrink:0;
          background:rgba(255,255,255,0.1);
          border:1px solid rgba(255,255,255,0.14);
          transition:transform 0.2s;
        }
        .ccard:hover .cico{transform:scale(1.08)}

        /* Count badge */
        .cbadge{
          display:inline-flex;align-items:center;
          padding:3px 10px;border-radius:99px;
          font-size:11px;font-weight:700;
          background:rgba(255,255,255,0.12);
          margin-top:10px;width:fit-content;
        }

        /* Skeleton */
        .sk{background:rgba(255,255,255,0.15);border-radius:6px;animation:sk 1.5s infinite;display:inline-block}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}

        /* Responsive */
        @media(max-width:1024px){.cm{margin-left:0}}
        @media(max-width:768px){.ci{padding:80px 16px 24px}.cgrid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:480px){.cgrid{grid-template-columns:1fr}.ci{padding:70px 12px 20px}}
      `}</style>

      <div className="cw">
        <Sidebar />
        <div className="cm">
          <Navbar />
          <div className="ci">

            <div style={{ marginBottom:8 }}>
              <h1 style={{ fontSize:22, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>
                Todas as categorias
              </h1>
              <p style={{ fontSize:13, color:"#4a6a6a" }}>
                {CATEGORIES.length} categorias ·{" "}
                {loading
                  ? <span className="sk" style={{ width:60, height:12 }} />
                  : `${total} prestador${total !== 1 ? "es" : ""} no total`
                }
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
                    style={{
                      background: c.bg,
                      ["--cborder" as any]: c.border,
                    }}
                    onClick={() => router.push(`/search?category=${encodeURIComponent(c.label)}`)}
                  >
                    {/* Ghost watermark */}
                    <span className="cghost">
                      <Icon size={96} style={{ color: c.color }} />
                    </span>

                    {/* Icon badge */}
                    <div className="cico">
                      <Icon size={26} style={{ color: c.color }} />
                    </div>

                    {/* Text */}
                    <p style={{ fontSize:15, fontWeight:700, color:"#f1f5f9", marginBottom:4, lineHeight:1.2 }}>
                      {c.label}
                    </p>
                    <p style={{ fontSize:12, color:"rgba(200,220,230,0.65)", lineHeight:1.5 }}>
                      {c.desc}
                    </p>

                    {/* Count badge */}
                    <div className="cbadge" style={{ color: c.color }}>
                      {loading
                        ? <span className="sk" style={{ width:50, height:10 }} />
                        : `${count} prestador${count !== 1 ? "es" : ""}`
                      }
                    </div>

                    {/* Arrow */}
                    <div style={{
                      position:"absolute", top:16, right:16,
                      width:28, height:28, borderRadius:8,
                      background:"rgba(255,255,255,0.1)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      <ChevronRight size={15} style={{ color:"rgba(255,255,255,0.6)" }} />
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
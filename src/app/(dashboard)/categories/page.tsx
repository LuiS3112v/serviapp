"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { ChevronRight, Loader2 } from "lucide-react";
import { getToken } from "@/lib/auth.api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const CATEGORIES = [
  { icon:"🧹", label:"Limpeza",       desc:"Limpeza residencial e comercial",          bg:"#0e2d2d", color:"#1D9E75" },
  { icon:"❄️", label:"Climatização",  desc:"Instalação e manutenção de AC",             bg:"#0e2020", color:"#378ADD" },
  { icon:"🔧", label:"Canalização",   desc:"Fugas, instalações e reparações",           bg:"#1a2232", color:"#5a7aDD" },
  { icon:"⚡", label:"Eletricista",   desc:"Instalações eléctricas e reparações",       bg:"#2a1e08", color:"#EF9F27" },
  { icon:"💻", label:"TI & Redes",    desc:"Suporte técnico e redes",                   bg:"#1a2232", color:"#8B5CF6" },
  { icon:"🌿", label:"Jardinagem",    desc:"Poda, manutenção e paisagismo",             bg:"#0e2d0e", color:"#22C55E" },
  { icon:"📦", label:"Mudanças",      desc:"Transporte e mudanças de casa",             bg:"#2a1808", color:"#F97316" },
  { icon:"💆", label:"Beleza",        desc:"Cabeleireiro, manicure e estética",         bg:"#1e1a2e", color:"#D4537E" },
  { icon:"🚗", label:"Automóvel",     desc:"Mecânica e manutenção auto",                bg:"#1a1a2e", color:"#60A5FA" },
  { icon:"🎨", label:"Pintura",       desc:"Pintura de interiores e exteriores",        bg:"#2a1a1a", color:"#F87171" },
  { icon:"🏗️", label:"Construção",   desc:"Obras, remodelações e acabamentos",         bg:"#1a2020", color:"#34D399" },
  { icon:"🔐", label:"Segurança",     desc:"Vigilância e sistemas de segurança",        bg:"#1a1a2a", color:"#A78BFA" },
];

export default function CategoriesPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
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
        .cats-wrap{display:flex;min-height:100vh;background:#0d1117}
        .cats-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .cats-inner{flex:1;padding:28px 32px}
        .cats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-top:24px}
        .cat-card{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:16px}
        .cat-card:hover{border-color:#1D9E75;transform:translateY(-2px)}
        .cat-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
        .skeleton{background:#1a2535;border-radius:6px;animation:sk 1.5s infinite;display:inline-block}
        @keyframes sk{0%,100%{opacity:1}50%{opacity:0.4}}
        @media(max-width:1024px){.cats-main{margin-left:0}}
        @media(max-width:640px){.cats-inner{padding:70px 16px 20px}.cats-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="cats-wrap">
        <Sidebar/>
        <div className="cats-main">
          <Navbar/>
          <div className="cats-inner">
            <div style={{marginBottom:8}}>
              <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Todas as categorias</h1>
              <p style={{fontSize:13,color:"#4a6a6a"}}>
                {CATEGORIES.length} categorias ·{" "}
                {loading
                  ? <span className="skeleton" style={{width:60,height:12}}/>
                  : `${total} prestador${total!==1?"es":""} no total`}
              </p>
            </div>

            <div className="cats-grid">
              {CATEGORIES.map((c,i)=>{
                const count = counts[c.label] ?? 0;
                return (
                  <div
                    className="cat-card"
                    key={i}
                    onClick={()=>router.push(`/search?category=${encodeURIComponent(c.label)}`)}
                  >
                    <div className="cat-icon" style={{background:c.bg}}>{c.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:15,fontWeight:700,color:"#e2e8f0",marginBottom:3}}>{c.label}</p>
                      <p style={{fontSize:12,color:"#4a6a6a",marginBottom:6}}>{c.desc}</p>
                      {loading
                        ? <span className="skeleton" style={{width:80,height:10}}/>
                        : (
                          <span style={{fontSize:11,fontWeight:600,color:c.color,background:c.bg,padding:"2px 8px",borderRadius:99}}>
                            {count} prestador{count!==1?"es":""}
                          </span>
                        )
                      }
                    </div>
                    <ChevronRight size={16} style={{color:"#2a3a4a",flexShrink:0}}/>
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
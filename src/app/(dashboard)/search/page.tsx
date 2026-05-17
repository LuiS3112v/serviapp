"use client";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { Search, Filter, Briefcase } from "lucide-react";
 
const cats = ["Todos","Limpeza","Climatização","Canalização","Eletricista","TI & Redes","Jardinagem","Mudanças","Beleza","Automóvel","Pintura","Construção","Segurança"];
const distances = ["5km","10km","20km","50km"];
const sorts = ["Mais próximo","Melhor avaliação","Menor preço"];
 
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Todos");
  const [dist, setDist] = useState("10km");
  const [sort, setSort] = useState("Mais próximo");
  const [showFilters, setShowFilters] = useState(false);
 
  return (
    <>
      <style>{`
        *{box-sizing:border-box}
 
        .search-wrap{
          display:flex;
          min-height:100vh;
          background:#0d1117;
        }
 
        /* ── Desktop: sidebar has 240px ── */
        .search-main{
          flex:1;
          margin-left:240px;
          min-width:0;
          max-width:calc(100vw - 240px);
          display:flex;
          flex-direction:column;
        }
 
        .search-inner{
          flex:1;
          padding:28px 32px;
          display:flex;
          flex-direction:column;
          gap:20px;
          min-width:0;
          overflow-x:hidden;
        }
 
        /* ── Search bar ── */
        .search-bar{
          display:flex;
          align-items:center;
          gap:10px;
          padding:12px 16px;
          border-radius:14px;
          background:#131b27;
          border:1px solid #1a2535;
          width:100%;
          min-width:0;
        }
 
        .search-input{
          flex:1;
          background:none;
          border:none;
          outline:none;
          font-size:14px;
          color:#e2e8f0;
          font-family:inherit;
          min-width:0;
          width:100%;
        }
        .search-input::placeholder{color:#4a5a6a}
 
        /* ── Category pills — scrollable row, never clips ── */
        .cats-scroll{
          display:flex;
          gap:8px;
          overflow-x:auto;
          overflow-y:visible;
          padding-bottom:6px;
          width:100%;
          /* prevent flex parent from squishing this */
          flex-shrink:0;
          /* smooth momentum scroll on iOS */
          -webkit-overflow-scrolling:touch;
          scroll-behavior:smooth;
        }
        /* thin visible scrollbar so users know they can scroll */
        .cats-scroll::-webkit-scrollbar{height:3px}
        .cats-scroll::-webkit-scrollbar-track{background:transparent}
        .cats-scroll::-webkit-scrollbar-thumb{background:#1a2535;border-radius:99px}
 
        .cat-pill{
          padding:7px 14px;
          border-radius:99px;
          font-size:12px;
          font-weight:500;
          cursor:pointer;
          white-space:nowrap;
          border:1px solid #1a2535;
          background:#131b27;
          color:#6a7a8a;
          transition:all 0.15s;
          flex-shrink:0;
          font-family:inherit;
        }
        .cat-pill.active{background:#1D9E75;border-color:#1D9E75;color:white}
 
        /* ── Filter button ── */
        .filter-btn{
          display:flex;
          align-items:center;
          gap:5px;
          padding:7px 12px;
          border-radius:10px;
          font-size:12px;
          cursor:pointer;
          border:1px solid #1a2535;
          background:#0d1117;
          color:#6a7a8a;
          font-family:inherit;
          flex-shrink:0;
          transition:all 0.15s;
          white-space:nowrap;
        }
        .filter-btn.on{background:#1d9e7520;border-color:#1D9E75;color:#1D9E75}
 
        /* ── Filter panel ── */
        .filter-panel{
          display:flex;
          gap:20px;
          flex-wrap:wrap;
          padding:16px;
          border-radius:14px;
          background:#131b27;
          border:1px solid #1a2535;
          width:100%;
        }
        .filter-group-label{
          font-size:11px;
          font-weight:600;
          color:#4a5a6a;
          margin-bottom:8px;
          text-transform:uppercase;
          letter-spacing:0.06em;
        }
        .filter-chip{
          padding:6px 12px;
          border-radius:8px;
          font-size:12px;
          cursor:pointer;
          font-family:inherit;
          border:1px solid #1a2535;
          background:#0d1117;
          color:#6a7a8a;
          transition:all 0.15s;
        }
        .filter-chip.on{background:#1D9E75;border-color:#1D9E75;color:white}
 
        /* ── Empty state ── */
        .empty-state{
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          padding:80px 20px;
          gap:16px;
          text-align:center;
        }
 
        /* ══════════════════════════════
           TABLET  (sidebar hidden)
        ══════════════════════════════ */
        @media(max-width:1024px){
          .search-main{
            margin-left:0;
            max-width:100vw;
          }
          .search-inner{
            padding:80px 20px 24px;
          }
        }
 
        /* ══════════════════════════════
           MOBILE
        ══════════════════════════════ */
        @media(max-width:640px){
          .search-inner{
            padding:72px 12px 24px;
            gap:14px;
          }
          .search-bar{
            padding:10px 12px;
          }
          .search-input{
            font-size:13px;
          }
          .filter-panel{
            gap:10px;
            padding:12px;
          }
          .filter-chip{
            padding:5px 10px;
            font-size:11px;
          }
          .cat-pill{
            padding:6px 12px;
            font-size:11px;
          }
          .empty-state{
            padding:48px 12px;
          }
        }
 
        /* ══════════════════════════════
           VERY SMALL (320px — older phones)
        ══════════════════════════════ */
        @media(max-width:380px){
          .search-inner{
            padding:68px 10px 20px;
            gap:12px;
          }
          .cat-pill{
            padding:5px 10px;
            font-size:10px;
          }
          .filter-chip{
            padding:4px 8px;
            font-size:10px;
          }
        }
      `}</style>
 
      <div className="search-wrap">
        <Sidebar/>
        <div className="search-main">
          <Navbar/>
          <div className="search-inner">
 
            <div>
              <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Pesquisar prestadores</h1>
              <p style={{fontSize:13,color:"#4a6a6a"}}>Encontra o profissional certo perto de ti</p>
            </div>
 
            <div className="search-bar">
              <Search size={16} style={{color:"#4a7070",flexShrink:0}}/>
              <input
                className="search-input"
                placeholder="Pesquisa por nome ou serviço..."
                value={query}
                onChange={e=>setQuery(e.target.value)}
              />
              <button className={`filter-btn${showFilters?" on":""}`} onClick={()=>setShowFilters(!showFilters)}>
                <Filter size={13}/> Filtros
              </button>
            </div>
 
            {showFilters&&(
              <div className="filter-panel">
                <div>
                  <p className="filter-group-label">Distância</p>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {distances.map(d=>(
                      <button key={d} className={`filter-chip${dist===d?" on":""}`} onClick={()=>setDist(d)}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="filter-group-label">Ordenar</p>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {sorts.map(s=>(
                      <button key={s} className={`filter-chip${sort===s?" on":""}`} onClick={()=>setSort(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
 
            <div className="cats-scroll">
              {cats.map(c=>(
                <button key={c} className={`cat-pill${cat===c?" active":""}`} onClick={()=>setCat(c)}>{c}</button>
              ))}
            </div>
 
            <div className="empty-state">
              <div style={{width:64,height:64,borderRadius:20,background:"#131b27",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Briefcase size={28} style={{color:"#2a3a4a"}}/>
              </div>
              <p style={{fontSize:16,fontWeight:700,color:"#c0d0e0"}}>Prestadores em breve</p>
              <p style={{fontSize:13,color:"#4a6a6a",lineHeight:1.6,maxWidth:320}}>
                Estamos a integrar prestadores verificados na plataforma.
              </p>
            </div>
 
          </div>
        </div>
      </div>
    </>
  );
}
 
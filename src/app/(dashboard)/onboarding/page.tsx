"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield, Star, MapPin, ArrowRight } from "lucide-react";

const slides = [
  { icon: <Search size={36} style={{color:"#1D9E75"}}/>, bg:"#0b2a2a", title:"Encontra prestadores", desc:"Pesquisa por categoria ou localização e encontra o profissional certo perto de ti em segundos." },
  { icon: <Shield size={36} style={{color:"#378ADD"}}/>, bg:"#0a1a2e", title:"Paga com segurança", desc:"O valor fica retido na plataforma e só é libertado ao prestador após confirmares que o serviço foi concluído." },
  { icon: <Star size={36} style={{color:"#EF9F27"}}/>, bg:"#2a1e08", title:"Avalia e cresce", desc:"Após cada serviço podes avaliar o prestador. As avaliações constroem reputação e confiança na plataforma." },
  { icon: <MapPin size={36} style={{color:"#D4537E"}}/>, bg:"#2a0a1e", title:"Geolocalização real", desc:"Vê os prestadores disponíveis no mapa, com distância e tempo estimado de chegada até ti." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const last = current === slides.length - 1;
  const s = slides[current];
  return (
    <>
      <style>{`
        .ob-wrap{min-height:100vh;background:#0d1117;display:flex;align-items:center;justify-content:center;padding:24px}
        .ob-card{width:100%;max-width:440px;background:#131b27;border:1px solid #1a2535;border-radius:24px;padding:48px 36px;display:flex;flex-direction:column;align-items:center;text-align:center}
        .ob-dots{display:flex;gap:8px;margin-bottom:40px}
        .ob-dot{height:4px;border-radius:99px;transition:all 0.3s;background:#1a2535}
        .ob-dot.on{background:#1D9E75}
        .ob-btn{width:100%;padding:15px;border-radius:12px;border:none;background:#1D9E75;color:white;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;font-family:inherit}
        .ob-skip{background:none;border:none;cursor:pointer;font-size:13px;color:#3a4a5a;margin-top:16px;font-family:inherit}
        @media(max-width:480px){.ob-card{padding:32px 20px}}
      `}</style>
      <div className="ob-wrap">
        <div className="ob-card">
          <div className="ob-dots">
            {slides.map((_,i)=>(
              <div key={i} className={`ob-dot${i===current?" on":""}`} style={{width:i===current?24:8}}/>
            ))}
          </div>
          <div style={{width:80,height:80,borderRadius:24,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:28}}>
            {s.icon}
          </div>
          <h2 style={{fontSize:24,fontWeight:700,color:"#e2e8f0",marginBottom:14}}>{s.title}</h2>
          <p style={{fontSize:14,color:"#4a7a7a",lineHeight:1.75,marginBottom:40,maxWidth:320}}>{s.desc}</p>
          <button className="ob-btn" onClick={()=>last?router.push("/home"):setCurrent(c=>c+1)}>
            {last?"Começar agora":"Próximo"} <ArrowRight size={16}/>
          </button>
          {!last&&<button className="ob-skip" onClick={()=>router.push("/home")}>Saltar introdução</button>}
        </div>
      </div>
    </>
  );
}
"use client";
import { useRouter } from "next/navigation";
import { Bell, Search, MapPin } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  return (
    <nav style={{ position:"sticky",top:0,zIndex:30,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",height:64,background:"#080e1a",borderBottom:"1px solid #1a2535" }}>
      <div style={{ display:"flex",alignItems:"center",gap:10,background:"#0d1520",border:"1px solid #1a2535",borderRadius:12,padding:"10px 16px",flex:1,maxWidth:480 }}>
        <Search size={16} style={{ color:"#4a7070",flexShrink:0 }} />
        <input placeholder="Pesquise um serviço — canalizador, eletricista, limpeza..." style={{ background:"none",border:"none",outline:"none",fontSize:14,color:"#8a9ab0",width:"100%",fontFamily:"inherit" }} />
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginLeft:20 }}>
        <div style={{ display:"flex",alignItems:"center",gap:6,background:"#0d1520",border:"1px solid #1a2535",borderRadius:10,padding:"8px 14px" }}>
          <MapPin size={14} style={{ color:"#1D9E75" }} />
          <span style={{ fontSize:13,color:"#8a9ab0" }}>Luanda, Angola</span>
        </div>
        <div style={{ position:"relative",cursor:"pointer" }} onClick={() => router.push("/notifications")}>
          <div style={{ width:40,height:40,borderRadius:12,background:"#0d1520",border:"1px solid #1a2535",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <Bell size={18} style={{ color:"#8a9ab0" }} />
          </div>
          <span style={{ position:"absolute",top:8,right:8,width:8,height:8,borderRadius:"50%",background:"#EF9F27",border:"2px solid #080e1a" }} />
        </div>
        <div onClick={() => router.push("/profile/client")} style={{ width:40,height:40,borderRadius:12,background:"#1a3a2a",border:"1px solid #1d9e7440",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#1D9E75",cursor:"pointer" }}>U</div>
      </div>
    </nav>
  );
}
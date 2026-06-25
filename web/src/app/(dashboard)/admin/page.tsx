"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStats } from "@/hooks/useAdminStats";
import { AdminKyc } from "@/lib/api/admin";
import {
  Users, Briefcase, Wallet, Shield, TrendingUp,
  AlertCircle, RefreshCw, Check, X, Building2,
} from "lucide-react";

function formatKz(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M Kz`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(0)}K Kz`;
  return new Intl.NumberFormat("pt-PT").format(value) + " Kz";
}

function SkeletonCard() {
  return (
    <div style={{ background:"#131b27", border:"1px solid #1a2535", borderRadius:16, padding:20 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ width:80, height:14, borderRadius:6, background:"#1a2535" }}/>
        <div style={{ width:36, height:36, borderRadius:10, background:"#1a2535" }}/>
      </div>
      <div style={{ width:60, height:28, borderRadius:8, background:"#1a2535" }}/>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { stats, recentUsers, pendingKyc, loading, error, refresh, approveKyc, rejectKyc } = useAdminStats();

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/");
  }, [user, authLoading, router]);

  if (authLoading || (!authLoading && user?.role !== "admin")) return null;

  const statCards = [
    { label:"Utilizadores",    value: stats ? String(stats.totalUsers)             : null, icon:Users,    color:"#1D9E75", bg:"#1d9e7520" },
    { label:"Serviços activos", value: stats ? String(stats.activeServices)         : null, icon:Briefcase,color:"#378ADD", bg:"#378ADD20" },
    { label:"Volume total",     value: stats ? formatKz(stats.totalVolume)          : null, icon:Wallet,   color:"#EF9F27", bg:"#EF9F2720" },
    { label:"Pendentes KYC",    value: stats ? String(stats.pendingKyc)             : null, icon:Shield,   color:"#D4537E", bg:"#D4537E20" },
  ];

  return (
    <>
      <style>{`
        .adm-wrap{display:flex;min-height:100vh;background:#0d1117}
        .adm-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .adm-inner{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:24px}
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .stat-card{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px}
        .adm-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .adm-card{background:#131b27;border:1px solid #1a2535;border-radius:16px;padding:20px}
        .user-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1a2535}
        .user-row:last-child{border-bottom:none}
        .kyc-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1a2535}
        .kyc-row:last-child{border-bottom:none}
        .kyc-btn{border:none;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .empty-list{display:flex;flex-direction:column;align-items:center;padding:32px;gap:8px;text-align:center}
        .role-badge{padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600}
        .type-badge{padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;flex-shrink:0}
        @media(max-width:1024px){.adm-main{margin-left:0}.stats-grid{grid-template-columns:repeat(2,1fr)}.adm-grid{grid-template-columns:1fr}}
        @media(max-width:640px){.adm-inner{padding:16px}.stats-grid{grid-template-columns:1fr 1fr}}
      `}</style>

      <div className="adm-wrap">
        <Sidebar />
        <div className="adm-main">
          <Navbar />
          <div className="adm-inner">

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>Painel de administração</h1>
                <p style={{ fontSize:13, color:"#4a6a6a" }}>Visão geral da plataforma Serviapp</p>
              </div>
              <button onClick={refresh} style={{ display:"flex", alignItems:"center", gap:8, background:"#131b27", border:"1px solid #1a2535", borderRadius:10, padding:"8px 16px", cursor:"pointer", color:"#8a9ab0", fontSize:13 }}>
                <RefreshCw size={14}/> Atualizar
              </button>
            </div>

            {error && (
              <div style={{ background:"#2a0e0e", border:"1px solid #E24B4A40", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#E24B4A" }}>
                {error}
              </div>
            )}

            {/* Stats */}
            <div className="stats-grid">
              {loading ? [0,1,2,3].map(i => <SkeletonCard key={i}/>) : (
                statCards.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div className="stat-card" key={i}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                        <p style={{ fontSize:13, color:"#4a6a6a" }}>{s.label}</p>
                        <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Icon size={16} style={{ color:s.color }}/>
                        </div>
                      </div>
                      <p style={{ fontSize:26, fontWeight:700, color:s.color }}>{s.value ?? "—"}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="adm-grid">

              {/* Últimos registos */}
              <div className="adm-card">
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                  <TrendingUp size={16} style={{ color:"#1D9E75" }}/>
                  <h2 style={{ fontSize:15, fontWeight:700, color:"#c0d0e0" }}>Últimos registos</h2>
                </div>
                {loading ? [0,1,2].map(i => (
                  <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #1a2535" }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#1a2535", flexShrink:0 }}/>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                      <div style={{ width:"60%", height:12, borderRadius:6, background:"#1a2535" }}/>
                      <div style={{ width:"40%", height:10, borderRadius:6, background:"#1a2535" }}/>
                    </div>
                  </div>
                )) : recentUsers.length === 0 ? (
                  <div className="empty-list">
                    <Users size={28} style={{ color:"#2a3a4a" }}/>
                    <p style={{ fontSize:14, fontWeight:600, color:"#c0d0e0" }}>Sem registos ainda</p>
                    <p style={{ fontSize:12, color:"#4a6a6a" }}>Os novos utilizadores vão aparecer aqui.</p>
                  </div>
                ) : (
                  recentUsers.map(u => {
                    const roleColor = u.role === "admin" ? "#D4537E" : (u.role === "provider" || u.role === "company") ? "#EF9F27" : "#1D9E75";
                    const roleBg    = u.role === "admin" ? "#D4537E20" : (u.role === "provider" || u.role === "company") ? "#EF9F2720" : "#1d9e7520";
                    return (
                      <div className="user-row" key={u.id}>
                        <div style={{ width:36, height:36, borderRadius:"50%", background:"#1a2535", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#8a9ab0", flexShrink:0 }}>
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{u.fullName}</p>
                          <p style={{ fontSize:11, color:"#4a5a6a" }}>{new Date(u.createdAt).toLocaleDateString("pt-PT")}</p>
                        </div>
                        <span className="role-badge" style={{ color:roleColor, background:roleBg }}>{u.role}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* KYC pendentes — individual + empresa juntos */}
              <div className="adm-card">
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                  <AlertCircle size={16} style={{ color:"#EF9F27" }}/>
                  <h2 style={{ fontSize:15, fontWeight:700, color:"#c0d0e0" }}>KYC pendentes</h2>
                </div>
                {loading ? [0,1,2].map(i => (
                  <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid #1a2535" }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"#1a2535", flexShrink:0 }}/>
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                      <div style={{ width:"60%", height:12, borderRadius:6, background:"#1a2535" }}/>
                      <div style={{ width:"40%", height:10, borderRadius:6, background:"#1a2535" }}/>
                    </div>
                  </div>
                )) : pendingKyc.length === 0 ? (
                  <div className="empty-list">
                    <Shield size={28} style={{ color:"#2a3a4a" }}/>
                    <p style={{ fontSize:14, fontWeight:600, color:"#c0d0e0" }}>Sem verificações pendentes</p>
                    <p style={{ fontSize:12, color:"#4a6a6a" }}>Pedidos de KYC vão aparecer aqui.</p>
                  </div>
                ) : (
                  pendingKyc.map((k: AdminKyc) => (
                    <div className="kyc-row" key={k.id}>
                      <div style={{
                        width:36, height:36, borderRadius:"50%", flexShrink:0,
                        background: k.type === "company" ? "#071830" : "#2a1e08",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:13, fontWeight:700,
                        color: k.type === "company" ? "#378ADD" : "#EF9F27",
                      }}>
                        {k.type === "company"
                          ? <Building2 size={16} style={{ color:"#378ADD" }}/>
                          : k.userName.charAt(0).toUpperCase()
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", margin:0 }}>{k.userName}</p>
                          {/* Badge visível para distinguir empresa de individual */}
                          <span
                            className="type-badge"
                            style={{
                              color:      k.type === "company" ? "#378ADD" : "#EF9F27",
                              background: k.type === "company" ? "#378ADD18" : "#EF9F2718",
                              border:     `1px solid ${k.type === "company" ? "#378ADD40" : "#EF9F2740"}`,
                            }}
                          >
                            {k.type === "company" ? "🏢 Empresa" : "👤 Individual"}
                          </span>
                        </div>
                        <p style={{ fontSize:11, color:"#4a5a6a", margin:0 }}>{k.documentStatus}</p>
                      </div>
                      <button
                        className="kyc-btn"
                        style={{ background:"#1d9e7520" }}
                        onClick={() => approveKyc(k)}
                        title="Aprovar"
                      >
                        <Check size={14} style={{ color:"#1D9E75" }}/>
                      </button>
                      <button
                        className="kyc-btn"
                        style={{ background:"#E24B4A20" }}
                        onClick={() => rejectKyc(k)}
                        title="Rejeitar"
                      >
                        <X size={14} style={{ color:"#E24B4A" }}/>
                      </button>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
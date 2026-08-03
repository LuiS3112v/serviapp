"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Star, CheckCircle, BadgeCheck, Calendar,
  User, Briefcase, Image as ImageIcon, Loader2, MessageCircle,
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { providerProfileApi } from "@/lib/provider-profile.api";
import { chatApi } from "@/lib/chat.api";
import { getToken } from "@/lib/auth.api";
import { ProviderPublicProfile } from "@/types/provider-profile.types";

function fKz(v: number) {
  return new Intl.NumberFormat("pt-PT").format(v) + " Kz";
}

function fmtMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
}

function fmtReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

const REVIEWS_PREVIEW = 3;
const GALLERY_PREVIEW = 8;

export default function ProviderPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [profile, setProfile] = useState<ProviderPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const [showAllGallery, setShowAllGallery] = useState(false);
  const [extraGallery, setExtraGallery] = useState<ProviderPublicProfile["gallery"]>([]);
  const [loadingMoreGallery, setLoadingMoreGallery] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const isLoggedIn = !!getToken();

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const data = await providerProfileApi.getPublicProfile(id);
        setProfile(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleShowAllGallery = useCallback(async () => {
    if (!profile) return;
    setShowAllGallery(true);
    if (profile.galleryTotal <= profile.gallery.length) return;
    setLoadingMoreGallery(true);
    try {
      const more = await providerProfileApi.getMoreGallery(profile.id, profile.gallery.length);
      setExtraGallery(more);
    } catch {
      // silencioso — a galeria inicial já mostrada continua visível
    } finally {
      setLoadingMoreGallery(false);
    }
  }, [profile]);

  const handleChat = async () => {
    if (!profile) return;
    setChatLoading(true);
    try {
      const { room } = await chatApi.createOrGetRoom({ participantId: profile.id });
      router.push(`/chat/${room.id}`);
    } catch {
      router.push("/chat");
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#FFFFFF" }}>
      <Sidebar/>
      <div style={{ flex:1, marginLeft:240, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Loader2 size={28} style={{ color:"#0E7A5F", animation:"spin 1s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (notFound || !profile) return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#FFFFFF" }}>
      <Sidebar/>
      <div style={{ flex:1, marginLeft:240, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:40 }}>
        <User size={48} style={{ color:"#cbd5e1" }}/>
        <p style={{ fontSize:18, fontWeight:700, color:"#0F172A", margin:0 }}>Prestador não encontrado</p>
        <button onClick={() => router.back()} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:10, background:"#E2E8F0", border:"1px solid #cbd5e1", color:"#334155", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
          <ArrowLeft size={14}/> Voltar
        </button>
      </div>
    </div>
  );

  const visibleGallery = showAllGallery ? [...profile.gallery, ...extraGallery] : profile.gallery.slice(0, GALLERY_PREVIEW);
  const visibleReviews = showAllReviews ? profile.reviews : profile.reviews.slice(0, REVIEWS_PREVIEW);

  return (
    <>
      <style>{`
        *{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        .pp-wrap{display:flex;min-height:100vh;background:#FFFFFF}
        .pp-main{flex:1;margin-left:240px;display:flex;flex-direction:column}
        .pp-inner{flex:1;padding:28px 32px;display:flex;flex-direction:column;gap:20px;max-width:820px}
        .pp-card{background:#E2E8F0;border:1px solid #cbd5e1;border-radius:18px;padding:24px;box-shadow:0 1px 4px rgba(15,23,42,0.05)}
        .sec-title{font-size:15px;font-weight:700;color:#0F172A;margin-bottom:14px;margin-top:0;display:flex;align-items:center;gap:8px}
        .btn-back{display:flex;align-items:center;gap:8px;background:none;border:none;color:#64748B;cursor:pointer;font-size:13px;font-family:inherit;width:fit-content;padding:4px 0;transition:color 0.15s}
        .btn-back:hover{color:#0F172A}
        .btn-chat{display:flex;align-items:center;gap:8px;padding:13px 20px;border-radius:12px;border:1px solid #99E0D6;background:#E6F7F4;color:#0D9488;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap;transition:all 0.2s}
        .btn-chat:hover:not(:disabled){background:#0D9488;color:white}
        .btn-chat:disabled{opacity:0.6;cursor:not-allowed}
        .stat-mini-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .stat-mini{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px;text-align:center}
        .gallery-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .gallery-item{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#F8FAFC;border:1px solid #E2E8F0}
        .gallery-item img{width:100%;height:100%;object-fit:cover}
        .price-row{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px}
        .review-item{padding:14px 0;border-bottom:1px solid #cbd5e1}
        .review-item:last-child{border-bottom:none}
        .review-avatar{width:36px;height:36px;border-radius:50%;background:#EEECFE;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#4F46E5;font-weight:700;font-size:13px}
        .see-all-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px;border-radius:10px;border:1px solid #cbd5e1;background:#F8FAFC;color:#334155;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;width:100%;margin-top:12px;transition:all 0.15s}
        .see-all-btn:hover{border-color:#0D9488;color:#0D9488}
        @media(max-width:1024px){.pp-main{margin-left:0}.pp-inner{padding:80px 20px 24px}}
        @media(max-width:768px){.pp-inner{padding:72px 16px 24px}.gallery-grid{grid-template-columns:repeat(3,1fr)}.stat-mini-grid{gap:8px}}
        @media(max-width:480px){.pp-inner{padding:68px 12px 20px}.gallery-grid{grid-template-columns:repeat(2,1fr)}.stat-mini-grid{grid-template-columns:1fr;gap:8px}}
      `}</style>

      <div className="pp-wrap">
        <Sidebar/>
        <div className="pp-main">
          <Navbar/>
          <div className="pp-inner">

            <button className="btn-back" onClick={() => router.back()}>
              <ArrowLeft size={15}/> Voltar
            </button>

            {/* ── Cabeçalho ── */}
            <div className="pp-card">
              <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                <div style={{
                  width:72, height:72, borderRadius:"50%", flexShrink:0,
                  background:"#dcfce7", border:"1px solid #f8fafc",
                  display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden",
                }}>
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.fullName} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <User size={30} style={{ color:"#0E7A5F" }}/>}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:6 }}>
                    <h1 style={{ fontSize:22, fontWeight:800, color:"#0F172A", margin:0 }}>{profile.fullName}</h1>
                    {profile.isVerified && (
                      <span style={{ fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:99, background:"#D4A01718", color:"#B45309", border:"1px solid #D4A01740", display:"flex", alignItems:"center", gap:4 }}>
                        <BadgeCheck size={12}/> Verificado
                      </span>
                    )}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                    {profile.category && (
                      <span style={{ fontSize:13, color:"#64748B", display:"flex", alignItems:"center", gap:5 }}>
                        <Briefcase size={13}/>{profile.category}
                      </span>
                    )}
                    <span style={{ fontSize:13, color:"#64748B", display:"flex", alignItems:"center", gap:5 }}>
                      <Calendar size={13}/>Membro desde {fmtMemberSince(profile.memberSince)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-mini-grid" style={{ marginTop:20 }}>
                <div className="stat-mini">
                  <p style={{ fontSize:18, fontWeight:800, color:"#1D9E75", margin:"0 0 2px" }}>{profile.completedServicesCount}</p>
                  <p style={{ fontSize:11, color:"#64748B", margin:0 }}>Serviços concluídos</p>
                </div>
                <div className="stat-mini">
                  <p style={{ fontSize:18, fontWeight:800, color:"#B45309", margin:"0 0 2px", display:"flex", alignItems:"center", justifyContent:"center", gap:4 }}>
                    {profile.reviewStats.average != null ? profile.reviewStats.average.toFixed(1) : "—"}
                    {profile.reviewStats.average != null && <Star size={14} fill="#B45309" style={{ color:"#B45309" }}/>}
                  </p>
                  <p style={{ fontSize:11, color:"#64748B", margin:0 }}>
                    {profile.reviewStats.total > 0 ? `${profile.reviewStats.total} avaliações` : "Sem avaliações"}
                  </p>
                </div>
                <div className="stat-mini">
                  <p style={{ fontSize:18, fontWeight:800, color:"#4F46E5", margin:"0 0 2px" }}>{profile.services.length}</p>
                  <p style={{ fontSize:11, color:"#64748B", margin:0 }}>Serviços oferecidos</p>
                </div>
              </div>

              {isLoggedIn && (
                <div style={{ marginTop:20 }}>
                  <button className="btn-chat" disabled={chatLoading} onClick={handleChat}>
                    {chatLoading
                      ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/>
                      : <MessageCircle size={15}/>}
                    {chatLoading ? "A abrir..." : "Conversar"}
                  </button>
                </div>
              )}
            </div>

            {/* ── Sobre ── */}
            {profile.bio && (
              <div className="pp-card">
                <p className="sec-title"><User size={15} style={{ color:"#378ADD" }}/> Sobre</p>
                <p style={{ fontSize:14, color:"#1e293b", lineHeight:1.7, margin:0 }}>{profile.bio}</p>
              </div>
            )}

            {/* ── Galeria ── */}
            {profile.gallery.length > 0 && (
              <div className="pp-card">
                <p className="sec-title"><ImageIcon size={15} style={{ color:"#8B5CF6" }}/> Galeria de trabalhos</p>
                <div className="gallery-grid">
                  {visibleGallery.map(img => (
                    <div className="gallery-item" key={img.id}>
                      <img src={img.url} alt={img.caption ?? "Trabalho"} loading="lazy"/>
                    </div>
                  ))}
                </div>
                {!showAllGallery && profile.galleryTotal > GALLERY_PREVIEW && (
                  <button className="see-all-btn" onClick={handleShowAllGallery} disabled={loadingMoreGallery}>
                    {loadingMoreGallery
                      ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/>
                      : `Ver mais (${profile.galleryTotal - GALLERY_PREVIEW})`}
                  </button>
                )}
              </div>
            )}

            {/* ── Serviços e preços ── */}
            {profile.services.length > 0 && (
              <div className="pp-card">
                <p className="sec-title"><Briefcase size={15} style={{ color:"#0D9488" }}/> Serviços e preços</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {profile.services.map(s => (
                    <div className="price-row" key={s.id}>
                      <span style={{ fontSize:13, color:"#334155", fontWeight:600 }}>{s.name}</span>
                      <span style={{ fontSize:13, color:"#0D9488", fontWeight:800 }}>{fKz(s.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Avaliações ── */}
            {profile.reviews.length > 0 && (
              <div className="pp-card">
                <p className="sec-title"><Star size={15} style={{ color:"#B45309" }}/> Avaliações</p>
                <div>
                  {visibleReviews.map(r => (
                    <div className="review-item" key={r.id}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                        <div className="review-avatar">{r.clientName.charAt(0).toUpperCase()}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
                            <span style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{r.clientName}</span>
                            <span style={{ fontSize:11, color:"#94a3b8" }}>{fmtReviewDate(r.completedAt)}</span>
                          </div>
                          <div style={{ display:"flex", gap:2, margin:"4px 0" }}>
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={12} fill={n <= r.rating ? "#B45309" : "none"} style={{ color:"#B45309" }}/>
                            ))}
                          </div>
                          {r.review && (
                            <p style={{ fontSize:13, color:"#475569", lineHeight:1.6, margin:0 }}>{r.review}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {!showAllReviews && profile.reviews.length > REVIEWS_PREVIEW && (
                  <button className="see-all-btn" onClick={() => setShowAllReviews(true)}>
                    Ver todas ({profile.reviews.length})
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
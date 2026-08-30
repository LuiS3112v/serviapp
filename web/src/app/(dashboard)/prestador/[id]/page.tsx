"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Star, CheckCircle, BadgeCheck, Calendar,
  User, Briefcase, Image as ImageIcon, Loader2, MessageCircle,
} from "lucide-react";
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
      <div style={{ flex:1, marginLeft:240, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Loader2 size={28} style={{ color:"#0E7A5F", animation:"spin 1s linear infinite" }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (notFound || !profile) return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#FFFFFF" }}>
      <div style={{ flex:1, marginLeft:240, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:40 }}>
        <User size={48} style={{ color:"#cbd5e1" }}/>
        <p style={{ fontSize:18, fontWeight:700, color:"#0F172A", margin:0 }}>Prestador não encontrado</p>
        <button onClick={() => router.back()} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:10, background:"#E2E8F0", border:"1px solid #cbd5e1", color:"#334155", cursor:"pointer", fontSize:13.5, fontFamily:"inherit" }}>
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
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

        .pp-wrap{display:flex;min-height:100vh;background:#FFFFFF}
        .pp-main{flex:1;display:flex;flex-direction:column}
        .pp-inner{flex:1;display:flex;flex-direction:column;max-width:1080px;width:100%;margin:0 auto;padding-bottom:64px}
        .pp-px{padding-left:24px;padding-right:24px}

        /* ── Hero: banner + botão voltar flutuante sobreposto ── */
        .pp-hero{position:relative;margin-top:16px;animation:fadeUp 0.4s ease both}
        .pp-back-btn{
          position:absolute;top:14px;left:14px;z-index:6;
          width:36px;height:36px;border-radius:50%;border:none;
          background:rgba(255,255,255,0.92);backdrop-filter:blur(4px);
          display:flex;align-items:center;justify-content:center;cursor:pointer;
          box-shadow:0 3px 10px rgba(15,23,42,0.18);transition:background 0.15s,transform 0.15s;
          color:#334155;
        }
        .pp-back-btn:hover{background:#FFFFFF;transform:translateY(-1px)}

        /* ── Banner institucional (verde ServiApp) ── */
        .pp-banner{
          height:168px;border-radius:20px;position:relative;overflow:hidden;
          background:linear-gradient(135deg,#0D9488 0%,#0E7A5F 55%,#0B6B52 100%);
        }
        .pp-banner::after{
          content:"";position:absolute;inset:0;
          background:radial-gradient(120% 140% at 15% -10%, rgba(255,255,255,0.16), transparent 55%);
          pointer-events:none;
        }

        /* ── Cabeçalho: avatar sobreposto ao banner, texto sempre abaixo ── */
        .pp-header{padding-bottom:28px;display:flex;flex-direction:column;gap:20px;animation:fadeUp 0.45s ease both}
        .pp-header-top{display:flex;flex-direction:column;align-items:flex-start;gap:18px;margin-top:-52px;padding:0 4px}
        .pp-identity{display:flex;flex-direction:column;align-items:flex-start;gap:14px;width:100%}
        .pp-avatar{
          width:104px;height:104px;border-radius:50%;flex-shrink:0;
          background:#EEF6F2;border:4px solid #FFFFFF;
          display:flex;align-items:center;justify-content:center;overflow:hidden;
          box-shadow:0 10px 26px rgba(15,23,42,0.16);
          position:relative;z-index:2;
        }
        .pp-avatar img{width:100%;height:100%;object-fit:cover;display:block}
        .pp-identity-text{width:100%;margin-top:2px}
        .pp-name-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
        .pp-name{font-size:25px;font-weight:800;color:#0F172A;margin:0;letter-spacing:-0.015em;line-height:1.15}
        .pp-verified{
          font-size:12px;font-weight:700;padding:5px 10px 5px 8px;border-radius:9px;
          background:#0D948812;color:#0E7A5F;border:1px solid #0D948838;
          display:inline-flex;align-items:center;gap:5px;
        }
        .pp-meta-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;row-gap:8px}
        .pp-meta-item{font-size:13.5px;color:#64748B;display:flex;align-items:center;gap:6px}

        .pp-actions-row{padding:0 4px;width:100%}
        .btn-chat{
          display:flex;align-items:center;gap:8px;padding:12px 22px;border-radius:12px;border:none;
          background:linear-gradient(135deg,#0D9488,#0E7A5F);color:white;font-size:14px;font-weight:700;
          cursor:pointer;font-family:inherit;white-space:nowrap;box-shadow:0 4px 14px rgba(13,148,136,0.24);
          transition:all 0.2s;flex-shrink:0;
        }
        .btn-chat:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 18px rgba(13,148,136,0.32)}
        .btn-chat:disabled{opacity:0.6;cursor:not-allowed}

        /* ── Estatísticas: linha compacta, alinhada, tipo Stripe ── */
        .pp-stats-row{display:flex;gap:0;border:1px solid #EEF1F5;border-radius:16px;overflow:hidden;margin:0 4px}
        .pp-stat{flex:1;padding:16px 20px;display:flex;flex-direction:column;gap:3px;align-items:flex-start;justify-content:center;min-height:64px}
        .pp-stat + .pp-stat{border-left:1px solid #EEF1F5}
        .pp-stat b{font-size:20px;font-weight:800;line-height:1.2;display:flex;align-items:center;gap:5px}
        .pp-stat span{font-size:12px;color:#8A948E}

        .pp-divider{height:1px;background:#EEF1F5}

        .pp-section{padding-top:28px;padding-bottom:28px;animation:fadeUp 0.45s ease both}
        .pp-section + .pp-section{border-top:1px solid #EEF1F5}
        .sec-title{font-size:12.5px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#8A948E;margin-bottom:16px;margin-top:0;display:flex;align-items:center;gap:8px}
        .pp-bio{font-size:15px;color:#334155;line-height:1.75;margin:0;max-width:680px}

        /* ── Galeria estilo Airbnb: mosaico com peça em destaque ── */
        .gallery-grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:150px;gap:10px}
        .gallery-item{position:relative;border-radius:14px;overflow:hidden;background:#F8FAFC}
        .gallery-item:first-child{grid-column:span 2;grid-row:span 2}
        .gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform 0.35s ease}
        .gallery-item:hover img{transform:scale(1.045)}

        .price-row{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-radius:14px;background:#FAFBFC;border:1px solid #F1F5F9}
        .price-row + .price-row{margin-top:8px}
        .price-name{font-size:14.5px;color:#1e293b;font-weight:600}
        .price-value{font-size:15px;color:#0D9488;font-weight:800;white-space:nowrap}

        /* ── Avaliações: aparência premium ── */
        .review-item{padding:20px 0;border-bottom:1px solid #F1F5F9}
        .review-item:last-child{border-bottom:none}
        .review-avatar{width:40px;height:40px;border-radius:50%;background:#EEECFE;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#4F46E5;font-weight:700;font-size:14.5px}

        .see-all-btn{
          display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:11px;
          border:1px solid #E2E8F0;background:#FFFFFF;color:#334155;font-size:13.5px;font-weight:600;
          cursor:pointer;font-family:inherit;width:100%;margin-top:16px;transition:all 0.15s;
        }
        .see-all-btn:hover{border-color:#0D9488;color:#0D9488;background:#F0FAF8}
        .see-all-btn:disabled{opacity:0.6;cursor:not-allowed}

        @media(max-width:1024px){
          .pp-main{margin-left:0}
          .pp-hero{margin-top:72px}
          .pp-px{padding-left:20px;padding-right:20px}
        }
        @media(max-width:768px){
          .gallery-grid{grid-template-columns:repeat(3,1fr);grid-auto-rows:120px}
          .pp-stats-row{flex-wrap:wrap}
          .pp-stat{flex:1 1 50%;border-left:none !important}
          .pp-stat:nth-child(odd){border-right:1px solid #EEF1F5}
          .pp-stat:nth-child(n+3){border-top:1px solid #EEF1F5}
        }
        @media(max-width:640px){
          .pp-px{padding-left:16px;padding-right:16px}
          .pp-hero{margin-top:64px}
          .pp-banner{height:120px;border-radius:16px}
          .pp-back-btn{top:10px;left:10px;width:32px;height:32px}
          .pp-header{padding-bottom:22px;gap:14px}
          .pp-header-top{margin-top:-40px;gap:14px}
          .pp-identity{gap:12px}
          .pp-avatar{width:80px;height:80px;border-width:3px}
          .pp-identity-text{margin-top:0}
          .pp-name{font-size:19px}
          .btn-chat{width:100%;justify-content:center}
          .pp-section{padding-top:22px;padding-bottom:22px}
          .gallery-grid{grid-template-columns:repeat(2,1fr);grid-auto-rows:130px}
          .gallery-item:first-child{grid-column:span 2;grid-row:span 1}
        }
      `}</style>

      <div className="pp-wrap">
        <div className="pp-main">
          <div className="pp-inner pp-px">

            {/* ── Hero: banner com botão voltar flutuante ── */}
            <div className="pp-hero">
              <button className="pp-back-btn" onClick={() => router.back()} aria-label="Voltar">
                <ArrowLeft size={17}/>
              </button>
              <div className="pp-banner"/>
            </div>

            {/* ── Cabeçalho ── */}
            <div className="pp-header">
              <div className="pp-header-top">
                <div className="pp-identity">
                  <div className="pp-avatar">
                    {profile.avatarUrl
                      ? <img src={profile.avatarUrl} alt={profile.fullName}/>
                      : <User size={40} style={{ color:"#0E7A5F" }}/>}
                  </div>

                  <div className="pp-identity-text">
                    <div className="pp-name-row">
                      <h1 className="pp-name">{profile.fullName}</h1>
                      {profile.isVerified && (
                        <span className="pp-verified"><BadgeCheck size={13}/> Verificado</span>
                      )}
                    </div>
                    <div className="pp-meta-row">
                      {profile.category && (
                        <span className="pp-meta-item"><Briefcase size={13}/>{profile.category}</span>
                      )}
                      <span className="pp-meta-item"><Calendar size={13}/>Membro desde {fmtMemberSince(profile.memberSince)}</span>
                    </div>
                  </div>
                </div>

                {isLoggedIn && (
                  <div className="pp-actions-row">
                    <button className="btn-chat" disabled={chatLoading} onClick={handleChat}>
                      {chatLoading
                        ? <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }}/>
                        : <MessageCircle size={16}/>}
                      {chatLoading ? "A abrir..." : "Conversar"}
                    </button>
                  </div>
                )}
              </div>

              <div className="pp-stats-row">
                <div className="pp-stat">
                  <b style={{ color:"#1D9E75" }}>{profile.completedServicesCount}</b>
                  <span>Serviços concluídos</span>
                </div>
                <div className="pp-stat">
                  <b style={{ color:"#B45309" }}>
                    {profile.reviewStats.average != null ? profile.reviewStats.average.toFixed(1) : "—"}
                    {profile.reviewStats.average != null && <Star size={13} fill="#B45309" style={{ color:"#B45309" }}/>}
                  </b>
                  <span>{profile.reviewStats.total > 0 ? `${profile.reviewStats.total} avaliações` : "Sem avaliações"}</span>
                </div>
                <div className="pp-stat">
                  <b style={{ color:"#4F46E5" }}>{profile.services.length}</b>
                  <span>Serviços oferecidos</span>
                </div>
              </div>
            </div>

            {/* ── Sobre ── */}
            {profile.bio && (
              <div className="pp-section">
                <p className="sec-title">Sobre</p>
                <p className="pp-bio">{profile.bio}</p>
              </div>
            )}

            {/* ── Galeria ── */}
            {profile.gallery.length > 0 && (
              <div className="pp-section">
                <p className="sec-title">Galeria de trabalhos</p>
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
              <div className="pp-section">
                <p className="sec-title">Serviços e preços</p>
                <div>
                  {profile.services.map(s => (
                    <div className="price-row" key={s.id}>
                      <span className="price-name">{s.name}</span>
                      <span className="price-value">{fKz(s.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Avaliações ── */}
            {profile.reviews.length > 0 && (
              <div className="pp-section">
                <p className="sec-title">Avaliações</p>
                <div>
                  {visibleReviews.map(r => (
                    <div className="review-item" key={r.id}>
                      <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                        <div className="review-avatar">{r.clientName.charAt(0).toUpperCase()}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
                            <span style={{ fontSize:14.5, fontWeight:700, color:"#0F172A" }}>{r.clientName}</span>
                            <span style={{ fontSize:12, color:"#94a3b8" }}>{fmtReviewDate(r.completedAt)}</span>
                          </div>
                          <div style={{ display:"flex", gap:2, margin:"6px 0 9px" }}>
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} size={12} fill={n <= r.rating ? "#B45309" : "none"} style={{ color:"#B45309" }}/>
                            ))}
                          </div>
                          {r.review && (
                            <p style={{ fontSize:14, color:"#475569", lineHeight:1.65, margin:0 }}>{r.review}</p>
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
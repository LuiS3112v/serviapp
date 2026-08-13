"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProofViewerModal from "@/components/shared/ProofViewerModal";
import { servicesDetailApi } from "@/lib/api/services-detail.api";
import { paymentProofApi, PaymentProof } from "@/lib/api/payment-proof.api";
import { chatApi } from "@/lib/chat.api";
import { useProviderActiveServiceLocationBroadcast } from '@/hooks/useProviderActiveServiceLocationBroadcast';
import {
  CheckCircle, Clock, Loader2, ArrowLeft,
  X, MessageCircle, AlertTriangle, Key, Eye, FileText,
} from "lucide-react";

const STATUS: Record<string, { label: string; color: string }> = {
  requested:          { label: "Pedido recebido",                   color: "#D97706" },
  rejected:           { label: "Recusado",                          color: "#E24B4A" },
  accepted:           { label: "Aceite — a aguardar pagamento",     color: "#378ADD" },
  payment_pending:    { label: "A aguardar transferência",          color: "#D97706" },
  payment_held:       { label: "Pagamento protegido",               color: "#0E7A5F" },
  in_progress:        { label: "Em execução",                       color: "#8B5CF6" },
  provider_completed: { label: "A aguardar confirmação do cliente", color: "#D97706" },
  completed:          { label: "Concluído",                         color: "#0E7A5F" },
  disputed:           { label: "Em disputa",                        color: "#E24B4A" },
  cancelled:          { label: "Cancelado",                         color: "#E24B4A" },
  refunded:           { label: "Reembolsado",                       color: "#0E7A5F" },
};

const TL: Record<string, string> = {
  SERVICE_CREATED:         "📋 Pedido recebido",
  PROVIDER_ACCEPTED:       "✅ Aceitaste o pedido",
  PROVIDER_REJECTED:       "❌ Recusaste o pedido",
  BANK_DETAILS_SHOWN:      "🏦 Cliente recebeu dados bancários",
  PROOF_UPLOADED:          "📎 Cliente enviou comprovativo",
  ADMIN_CONFIRMED_PAYMENT: "👨‍💼 Administrador confirmou pagamento",
  ADMIN_REJECTED_PROOF:    "❌ Comprovativo do cliente foi rejeitado",
  PAYMENT_HELD:            "🔒 Pagamento protegido",
  PIN_GENERATED:           "🔑 Cliente gerou PIN",
  SERVICE_STARTED:         "🚀 Serviço iniciado",
  PROVIDER_COMPLETED:      "🏁 Marcaste como concluído",
  CLIENT_CONFIRMED:        "👍 Cliente confirmou a conclusão",
  COMMISSION_CALCULATED:   "💸 Comissão calculada",
  PAYOUT_COMPLETED:        "🎉 Transferência realizada — pagamento concluído",
  SERVICE_CANCELLED:       "❌ Serviço cancelado",
  DISPUTE_OPENED:          "⚠️ Disputa aberta",
};

// Estados em que o prestador deve estar a transmitir a sua localização
// para este serviço: enquanto está a caminho (accepted/payment_held,
// antes de o PIN ser validado) e enquanto está a executar o trabalho
// (in_progress). Fora destes estados — requested, rejected,
// payment_pending, provider_completed, completed, disputed, cancelled,
// refunded — não faz sentido gastar bateria/dados do prestador com GPS.
const LOCATION_BROADCAST_STATUSES = ["accepted", "payment_held", "in_progress"];

function fKz(v: number) { return new Intl.NumberFormat("pt-PT").format(v) + " Kz"; }
function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "agora"; if (m < 60) return `${m}min`;
  const h = Math.floor(m/60); if (h < 24) return `${h}h`;
  return new Date(d).toLocaleDateString("pt-PT");
}

function PinModal({ onSubmit, onClose, loading }: { onSubmit:(p:string)=>void; onClose:()=>void; loading:boolean }) {
  const [digits, setDigits] = useState(["","","","","",""]);
  const change = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const n = [...digits]; n[i] = v; setDigits(n);
    if (v && i < 5) document.getElementById(`pd-${i+1}`)?.focus();
  };
  const pin = digits.join("");
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)",
      zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#E2E8F0", border:"1px solid #CBD5E1",
        borderRadius:20, padding:32, maxWidth:340, width:"100%", textAlign:"center", boxShadow:"0 20px 48px rgba(15,23,42,0.18)" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🔑</div>
        <p style={{ fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:6 }}>Inserir PIN</p>
        <p style={{ fontSize:13, color:"#4B5563", marginBottom:24, lineHeight:1.5 }}>
          Pede o PIN de 6 dígitos ao cliente para confirmar que chegaste ao local.
        </p>
        <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:24 }}>
          {digits.map((d,i) => (
            <input key={i} id={`pd-${i}`} value={d} maxLength={1}
              onChange={e => change(i, e.target.value)}
              style={{ width:44, height:52, textAlign:"center", fontSize:22, fontWeight:700,
                borderRadius:10, background:"#FFFFFF",
                border:`2px solid ${d ? "#8B5CF6" : "#CBD5E1"}`,
                color:"#111827", outline:"none", fontFamily:"monospace" }} />
          ))}
        </div>
        <button disabled={pin.length < 6 || loading} onClick={() => onSubmit(pin)}
          style={{ width:"100%", padding:13, borderRadius:11, border:"none",
            background: pin.length === 6 ? "linear-gradient(135deg,#8B5CF6,#7C3AED)" : "#CBD5E1",
            color: pin.length === 6 ? "white" : "#94A3B8",
            fontSize:14, fontWeight:700, cursor: pin.length === 6 ? "pointer" : "not-allowed",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"inherit" }}>
          {loading && <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} />}
          {loading ? "A validar..." : "Iniciar serviço"}
        </button>
      </div>
    </div>
  );
}

export default function ProviderServiceDetailPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();

  const [service, setService]   = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [payment, setPayment]   = useState<any>(null);
  const [providerProof, setProviderProof] = useState<PaymentProof | null>(null);
  const [proofLoading, setProofLoading]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [actL, setActL]         = useState<string|null>(null);
  const [showPin, setShowPin]   = useState(false);
  const [showProofViewer, setShowProofViewer] = useState(false);
  const [warranty, setWarranty] = useState<number|"">("");
  const [priceIn, setPriceIn]   = useState("");
  const [chatL, setChatL]       = useState(false);

  useProviderActiveServiceLocationBroadcast(
    id,
    LOCATION_BROADCAST_STATUSES.includes(service?.status),
  );

  const load = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([
        servicesDetailApi.get(id),
        servicesDetailApi.timeline(id),
      ]);
      setService(s); setTimeline(t);
      setPriceIn(String(s.budget ?? ""));

      // Carrega o estado do pagamento (sem dados bancários — o prestador
      // nunca vê a conta da Mestroo nem a sua própria seria mostrada
      // aqui, isso fica só na área do admin).
      const existingPayment = await servicesDetailApi.getPayment(id).catch(() => null);
      if (existingPayment) {
        setPayment(existingPayment);
      }
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (key: string, fn: () => Promise<any>) => {
    setActL(key);
    try { await fn(); await load(); }
    catch (e: any) { alert(e.message || "Erro. Tenta novamente."); }
    finally { setActL(null); }
  };

  const handleChat = async () => {
    if (!service?.clientId) return;
    setChatL(true);
    try {
      const { room } = await chatApi.createOrGetRoom({ participantId: service.clientId });
      router.push(`/provider/chat/${room.id}`);
    } catch { router.push("/provider/chat"); }
    finally { setChatL(false); }
  };

  // ── Ver comprovativo do cliente — carrega no clique, só uma vez ────────────
  const handleViewProof = async () => {
    if (!payment) return;
    if (providerProof) { setShowProofViewer(true); return; }
    setProofLoading(true);
    try {
      const proof = await paymentProofApi.getForProvider(payment.id);
      setProviderProof(proof);
      setShowProofViewer(true);
    } catch (e: any) {
      alert(e.message || "O cliente ainda não enviou comprovativo.");
    } finally {
      setProofLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
      <Loader2 size={28} style={{ color:"#D97706", animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!service) return null;

  const cfg    = STATUS[service.status] ?? STATUS.requested;
  const amount = Number(service.agreedPrice ?? service.budget);
  const ended  = ["completed","cancelled","refunded","rejected"].includes(service.status);

  // Botão "Ver comprovativo" só faz sentido depois de existir Payment e
  // depois do cliente ter tido oportunidade de enviar algo — mostra-se
  // sempre que payment existir e o status já não seja o inicial "pending"
  // sem nada enviado ainda, mas o próprio pedido ao backend já trata o
  // caso de "ainda não enviou" com uma mensagem clara.
  const canViewProof = !!payment && ["proof_submitted", "confirmed", "pending_payout", "completed"].includes(payment.status);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pd-body { padding: 28px 32px; display: flex; flex-direction: column;
                   gap: 20px; max-width: 760px; width: 100%; background: #FFFFFF; }
        .pd-card { background: #E2E8F0; border: 1px solid #CBD5E1;
                   border-radius: 18px; padding: 24px; box-shadow: 0 2px 10px rgba(15,23,42,0.06); }
        .ab { display: flex; align-items: center; justify-content: center; gap: 8px;
              padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 700;
              cursor: pointer; font-family: inherit; border: none; transition: all .2s; width: 100%; }
        .ab:disabled { opacity: .5; cursor: not-allowed; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { background: #FFFFFF; border-radius: 10px; padding: 10px 14px; }
        .pr-input { width: 100%; padding: 11px 14px; border-radius: 10px; background: #FFFFFF;
                    border: 1px solid #CBD5E1; color: #111827; font-size: 14px; outline: none;
                    font-family: inherit; transition: border-color .15s; }
        .pr-input:focus { border-color: #D97706; }
        .tl-wrap { display: flex; flex-direction: column; }
        .tl-item { display: flex; gap: 12px; padding-bottom: 16px; position: relative; }
        .tl-item:last-child { padding-bottom: 0; }
        .tl-line { position: absolute; left: 9px; top: 20px; bottom: 0;
                   width: 1px; background: #94A3B8; }
        .tl-dot  { width: 20px; height: 20px; border-radius: 50%; background: #D97706;
                   border: 3px solid #FDE8C8; display: flex; align-items: center;
                   justify-content: center; flex-shrink: 0; z-index: 1; }
        @media(max-width:640px)  { .pd-body { padding: 20px 16px; gap: 14px; }
                                   .info-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="pd-body">

        <button onClick={() => router.push("/provider/services")}
          style={{ display:"flex", alignItems:"center", gap:8, background:"none",
            border:"none", color:"#475569", cursor:"pointer", fontSize:13,
            fontFamily:"inherit", width:"fit-content" }}>
          <ArrowLeft size={15} /> Voltar
        </button>

        {/* ── Header ── */}
        <div className="pd-card">
          <div style={{ display:"flex", alignItems:"flex-start",
            justifyContent:"space-between", gap:12, marginBottom:16 }}>
            <div>
              <h1 style={{ fontSize:18, fontWeight:700, color:"#0F172A", marginBottom:8 }}>
                {service.title}
              </h1>
              <span style={{ display:"inline-flex", alignItems:"center", gap:6,
                padding:"4px 10px", borderRadius:99, fontSize:12, fontWeight:700,
                background:`${cfg.color}20`, color:cfg.color, border:`1px solid ${cfg.color}40` }}>
                {cfg.label}
              </span>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <p style={{ fontSize:24, fontWeight:800, color:"#D97706" }}>{fKz(amount)}</p>
              <p style={{ fontSize:11, color:"#4B5563", marginTop:2 }}>Valor acordado</p>
            </div>
          </div>

          <div className="info-grid">
            {[
              { l:"Cliente",   v: service.client?.fullName ?? "—" },
              { l:"Categoria", v: service.category },
              { l:"Morada",    v: service.address },
              { l:"Data",      v: new Date(service.createdAt).toLocaleDateString("pt-PT") },
            ].map((x,i) => (
              <div className="info-item" key={i}>
                <p style={{ fontSize:11, color:"#4B5563", marginBottom:2 }}>{x.l}</p>
                <p style={{ fontSize:13, color:"#111827", fontWeight:600 }}>{x.v}</p>
              </div>
            ))}
          </div>

          {service.description && (
            <p style={{ fontSize:13, color:"#374151", lineHeight:1.6,
              marginTop:14, padding:"12px 14px", background:"#FFFFFF", borderRadius:10 }}>
              {service.description}
            </p>
          )}

          {service.warrantyExpiresAt && (
            <div style={{ marginTop:12, padding:"10px 14px", background:"#FFFBEB",
              border:"1px solid #FDE68A", borderRadius:10, fontSize:12, color:"#92400E" }}>
              ⭐ Garantia válida até {new Date(service.warrantyExpiresAt).toLocaleDateString("pt-PT")}
            </div>
          )}
        </div>

        {/* ── Comprovativo do cliente ── */}
        {canViewProof && (
          <div className="pd-card">
            <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
              <FileText size={16} style={{ color:"#378ADD" }} /> Comprovativo do cliente
            </p>
            <p style={{ fontSize:12, color:"#4B5563", lineHeight:1.6, marginBottom:14 }}>
              O cliente enviou um comprovativo de pagamento. Podes vê-lo para confirmar visualmente que a transferência foi feita.
            </p>
            <button className="ab" disabled={proofLoading}
              style={{ background:"#378ADD20", color:"#378ADD", border:"1px solid #378ADD40" }}
              onClick={handleViewProof}>
              {proofLoading ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <Eye size={15}/>}
              {proofLoading ? "A carregar..." : "Ver comprovativo enviado"}
            </button>
          </div>
        )}

        {/* ── Acções ── */}
        {!ended && (
          <div className="pd-card">
            <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:14 }}>
              Acções disponíveis
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

              {service.status === "requested" && (
                <>
                  <div>
                    <label style={{ fontSize:12, color:"#4B5563", display:"block", marginBottom:6 }}>
                      Preço a propor (orçamento do cliente: {fKz(service.budget)})
                    </label>
                    <input className="pr-input" type="number" value={priceIn}
                      onChange={e => setPriceIn(e.target.value)} placeholder="Valor em Kz" />
                  </div>
                  <button className="ab" disabled={actL==="accept"}
                    style={{ background:"linear-gradient(135deg,#0E7A5F,#0A5F4A)", color:"white",
                             boxShadow:"0 4px 14px rgba(14,122,95,0.3)" }}
                    onClick={() => act("accept", () => servicesDetailApi.accept(id, priceIn ? Number(priceIn) : undefined))}>
                    {actL==="accept" ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <CheckCircle size={15}/>}
                    {actL==="accept" ? "A aceitar..." : "Aceitar pedido"}
                  </button>
                  <button className="ab" disabled={actL==="reject"}
                    style={{ background:"#FEF2F2", color:"#B91C1C", border:"1px solid #FCA5A5" }}
                    onClick={() => {
                      if (confirm("Tens a certeza que queres recusar este pedido?"))
                        act("reject", () => servicesDetailApi.reject(id, "Prestador indisponível"));
                    }}>
                    {actL==="reject" ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <X size={15}/>}
                    Recusar pedido
                  </button>
                </>
              )}

              {["accepted", "payment_pending"].includes(service.status) && !canViewProof && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px",
                  background:"#378ADD10", border:"1px solid #378ADD30", borderRadius:12 }}>
                  <Clock size={18} style={{ color:"#378ADD", flexShrink:0 }} />
                  <p style={{ fontSize:13, color:"#2668b0", lineHeight:1.5 }}>
                    A aguardar que o cliente efectue a transferência de {fKz(amount)}.
                  </p>
                </div>
              )}

              {["accepted", "payment_pending"].includes(service.status) && canViewProof && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px",
                  background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12 }}>
                  <Clock size={18} style={{ color:"#D97706", flexShrink:0 }} />
                  <p style={{ fontSize:13, color:"#92400E", lineHeight:1.5 }}>
                    A aguardar confirmação do comprovativo pelo administrador.
                  </p>
                </div>
              )}

              {service.status === "payment_held" && (
                <button className="ab"
                  style={{ background:"linear-gradient(135deg,#8B5CF6,#7C3AED)", color:"white", boxShadow:"0 4px 14px rgba(139,92,246,0.35)" }}
                  onClick={() => setShowPin(true)}>
                  <Key size={15}/> Inserir PIN e iniciar serviço
                </button>
              )}

              {service.status === "in_progress" && (
                <>
                  <div>
                    <label style={{ fontSize:12, color:"#4B5563", display:"block", marginBottom:6 }}>
                      Garantia (opcional)
                    </label>
                    <select className="pr-input"
                      value={warranty}
                      onChange={e => setWarranty(e.target.value ? Number(e.target.value) : "")}>
                      <option value="">Sem garantia</option>
                      <option value={7}>7 dias</option>
                      <option value={15}>15 dias</option>
                      <option value={30}>30 dias</option>
                      <option value={90}>90 dias</option>
                    </select>
                  </div>
                  <button className="ab" disabled={actL==="complete"}
                    style={{ background:"linear-gradient(135deg,#0E7A5F,#0A5F4A)", color:"white",
                             boxShadow:"0 4px 14px rgba(14,122,95,0.3)" }}
                    onClick={() => act("complete", () => servicesDetailApi.providerComplete(id, warranty ? Number(warranty) : undefined))}>
                    {actL==="complete" ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <CheckCircle size={15}/>}
                    {actL==="complete" ? "A marcar..." : "Marcar como concluído"}
                  </button>
                </>
              )}

              {service.status === "provider_completed" && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px",
                  background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:12 }}>
                  <Clock size={18} style={{ color:"#D97706", flexShrink:0 }} />
                  <p style={{ fontSize:13, color:"#92400E", lineHeight:1.5 }}>
                    A aguardar confirmação do cliente para avançar com o pagamento.
                  </p>
                </div>
              )}

              {service.status === "completed" && payment?.status === "pending_payout" && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px",
                  background:"#8B5CF610", border:"1px solid #8B5CF630", borderRadius:12 }}>
                  <Clock size={18} style={{ color:"#8B5CF6", flexShrink:0 }} />
                  <p style={{ fontSize:13, color:"#5B21B6", lineHeight:1.5 }}>
                    A administração está a preparar a transferência do teu pagamento.
                  </p>
                </div>
              )}

              {isActiveForChat(service.status) && (
                <button className="ab"
                  style={{ background:"#378ADD20", color:"#378ADD", border:"1px solid #378ADD40" }}
                  disabled={chatL}
                  onClick={handleChat}>
                  {chatL ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <MessageCircle size={15}/>}
                  Conversar com cliente
                </button>
              )}

              {["payment_held","in_progress"].includes(service.status) && (
                <button className="ab"
                  style={{ background:"#FEF2F2", color:"#B91C1C", border:"1px solid #FCA5A5", fontSize:13 }}
                  onClick={() => {
                    const r = prompt("Motivo da disputa:");
                    if (r?.trim()) act("dispute", () => servicesDetailApi.openDispute(id, r));
                  }}>
                  <AlertTriangle size={14} /> Abrir disputa
                </button>
              )}

              {service.status === "completed" && payment?.status === "completed" && (
                <div style={{ textAlign:"center", padding:"20px", background:"#F0FDF9", border:"1px solid #A7F3D0", borderRadius:12 }}>
                  <CheckCircle size={24} style={{ color:"#0E7A5F", marginBottom:8 }} />
                  <p style={{ fontSize:14, fontWeight:700, color:"#0E7A5F" }}>Pagamento concluído!</p>
                  <p style={{ fontSize:12, color:"#4B5563", marginTop:4 }}>
                    {fKz(Number(payment.providerAmount))} foi creditado na tua wallet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Timeline ── */}
        {timeline.length > 0 && (
          <div className="pd-card">
            <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:16 }}>Histórico</p>
            <div className="tl-wrap">
              {timeline.map((ev, i) => (
                <div className="tl-item" key={ev.id}>
                  {i < timeline.length-1 && <span className="tl-line" />}
                  <div className="tl-dot">
                    <span style={{ fontSize:8, color:"#FFFFFF" }}>●</span>
                  </div>
                  <div style={{ flex:1, paddingTop:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:"#0F172A" }}>
                        {TL[ev.action] ?? ev.action}
                      </p>
                      <span style={{ fontSize:11, color:"#94A3B8", flexShrink:0 }}>
                        {ago(ev.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontSize:12, color:"#4B5563", marginTop:2 }}>{ev.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showPin && (
        <PinModal
          loading={actL==="start"}
          onClose={() => setShowPin(false)}
          onSubmit={pin => { setShowPin(false); act("start", () => servicesDetailApi.startService(id, pin)); }}
        />
      )}
      {showProofViewer && providerProof && (
        <ProofViewerModal proofId={providerProof.id} fileType={providerProof.fileType} onClose={() => setShowProofViewer(false)} />
      )}
    </>
  );
}

function isActiveForChat(status: string): boolean {
  return !["completed", "cancelled", "refunded", "rejected"].includes(status);
}
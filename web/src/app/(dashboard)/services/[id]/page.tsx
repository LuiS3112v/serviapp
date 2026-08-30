"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProofViewerModal from "@/components/shared/ProofViewerModal";
import { servicesDetailApi, ServicePayment, PaymentBankAccount } from "@/lib/api/services-detail.api";
import { paymentProofApi, PaymentProof } from "@/lib/api/payment-proof.api";
import { bankAccountsApi } from "@/lib/api/bank-accounts.api";
import { chatApi } from "@/lib/chat.api";
import {
  CheckCircle, Clock, AlertCircle, Loader2, ArrowLeft,
  X, Shield, Key, MessageCircle, AlertTriangle, RefreshCw,
  Landmark, Upload, FileText, Eye, Copy, Check,
  CreditCard, TrendingDown, TrendingUp, Star, Send,
} from "lucide-react";

const STATUS: Record<string, { label: string; color: string; step: number }> = {
  requested:          { label: "Pedido enviado",                color: "#EF9F27", step: 1 },
  rejected:           { label: "Recusado",                      color: "#E24B4A", step: 0 },
  accepted:           { label: "Aceite — a aguardar pagamento", color: "#378ADD", step: 2 },
  payment_pending:    { label: "A aguardar transferência",      color: "#EF9F27", step: 2 },
  payment_held:       { label: "Pagamento protegido",           color: "#0E7A5F", step: 3 },
  in_progress:        { label: "Em execução",                   color: "#8B5CF6", step: 4 },
  provider_completed: { label: "A aguardar a tua confirmação",  color: "#EF9F27", step: 5 },
  completed:          { label: "Concluído",                     color: "#0E7A5F", step: 6 },
  disputed:           { label: "Em disputa",                    color: "#E24B4A", step: 0 },
  cancelled:          { label: "Cancelado",                     color: "#E24B4A", step: 0 },
  refunded:           { label: "Reembolsado",                   color: "#0E7A5F", step: 0 },
};

const TL_LABELS: Record<string, string> = {
  SERVICE_CREATED:        "📋 Pedido criado",
  PROVIDER_ACCEPTED:      "✅ Prestador aceitou",
  PROVIDER_REJECTED:      "❌ Prestador recusou",
  BANK_DETAILS_SHOWN:     "🏦 Dados bancários disponibilizados",
  PROOF_UPLOADED:         "📎 Comprovativo enviado",
  ADMIN_CONFIRMED_PAYMENT:"👨‍💼 Administrador confirmou pagamento",
  ADMIN_REJECTED_PROOF:   "❌ Comprovativo rejeitado",
  PAYMENT_HELD:           "🔒 Pagamento protegido",
  PIN_GENERATED:          "🔑 PIN de início gerado",
  SERVICE_STARTED:        "🚀 Serviço iniciado",
  PROVIDER_COMPLETED:     "🏁 Prestador concluiu",
  CLIENT_CONFIRMED:       "👍 Confirmaste a conclusão",
  COMMISSION_CALCULATED:  "💸 Comissão calculada",
  PAYOUT_COMPLETED:       "🎉 Pagamento concluído ao prestador",
  SERVICE_CANCELLED:      "❌ Serviço cancelado",
  DISPUTE_OPENED:         "⚠️ Disputa aberta",
};

const PAYMENT_STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:          { label: "Aguarda transferência",        color: "#EF9F27" },
  proof_submitted:  { label: "Comprovativo em validação",    color: "#378ADD" },
  confirmed:        { label: "Confirmado — protegido",       color: "#0E7A5F" },
  pending_payout:   { label: "A processar transferência",    color: "#8B5CF6" },
  completed:        { label: "Concluído",                    color: "#0E7A5F" },
  refunded:         { label: "Reembolsado",                  color: "#E24B4A" },
};

function fKz(v: number) { return new Intl.NumberFormat("pt-PT").format(v) + " Kz"; }
function ago(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "agora"; if (m < 60) return `${m}min`;
  const h = Math.floor(m/60); if (h < 24) return `${h}h`;
  return new Date(d).toLocaleDateString("pt-PT");
}

function ProgressBar({ step }: { step: number }) {
  const steps = ["Pedido","Aceite","Pagamento","Execução","Confirmação","Concluído"];
  return (
    <div style={{ display:"flex", alignItems:"center", width:"100%", padding:"8px 0" }}>
      {steps.map((s,i) => {
        const n = i + 1;
        const done = n < step; const active = n === step;
        const c = done || active ? "#0E7A5F" : "#CBD5E1";
        return (
          <div key={n} style={{ display:"flex", alignItems:"center", flex:1, minWidth:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", border:`2px solid ${c}`,
                background: done ? "#0E7A5F" : active ? "#0E7A5F30" : "#FFFFFF",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, fontWeight:700, color: done ? "white" : active ? "#0E7A5F" : "#94A3B8",
                transition:"all .3s" }}>
                {done ? "✓" : n}
              </div>
              <p style={{ fontSize:9, color: done||active ? "#0F172A" : "#94A3B8",
                marginTop:3, whiteSpace:"nowrap", fontWeight: active ? 700 : 400 }}>{s}</p>
            </div>
            {i < steps.length-1 && (
              <div style={{ flex:1, height:2, background: done ? "#0E7A5F" : "#CBD5E1",
                marginBottom:14, transition:"all .3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PinModal({ pin, expiresAt, onClose }: { pin: string; expiresAt: string; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
      zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#E2E8F0", border:"1px solid #CBD5E1",
        borderRadius:20, padding:32, maxWidth:340, width:"100%", textAlign:"center", boxShadow:"0 20px 48px rgba(15,23,42,0.18)" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:"#D9F5F0",
          border:"2px solid #0E7A5F", display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 16px" }}>
          <Key size={24} style={{ color:"#0E7A5F" }} />
        </div>
        <p style={{ fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:6 }}>PIN de início</p>
        <p style={{ fontSize:13, color:"#4B5563", marginBottom:20, lineHeight:1.5 }}>
          Fornece este PIN ao prestador quando ele chegar para começar o serviço.
        </p>
        <div style={{ fontSize:40, fontWeight:900, letterSpacing:10, color:"#0E7A5F",
          background:"#FFFFFF", borderRadius:14, padding:"16px 24px", marginBottom:12,
          border:"2px dashed #0E7A5F60", fontFamily:"monospace" }}>
          {pin}
        </div>
        <p style={{ fontSize:11, color:"#6B7280" }}>
          Válido até {new Date(expiresAt).toLocaleString("pt-PT")}
        </p>
        <button onClick={onClose} style={{ marginTop:20, padding:"10px 28px",
          borderRadius:10, background:"#0E7A5F", color:"white", border:"none",
          cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
          Fechar
        </button>
      </div>
    </div>
  );
}

function DisputeModal({ onSubmit, onClose, loading }: { onSubmit: (r:string)=>void; onClose:()=>void; loading:boolean }) {
  const [reason, setReason] = useState("");
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
      zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#E2E8F0", border:"1px solid #CBD5E1",
        borderRadius:20, padding:28, maxWidth:440, width:"100%", boxShadow:"0 20px 48px rgba(15,23,42,0.18)" }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:8 }}>Abrir disputa</h2>
        <p style={{ fontSize:13, color:"#4B5563", marginBottom:16, lineHeight:1.5 }}>
          O pagamento ficará bloqueado até resolução pelo administrador.
        </p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          style={{ width:"100%", minHeight:100, padding:12, borderRadius:10,
            background:"#FFFFFF", border:"1px solid #CBD5E1", color:"#111827",
            fontSize:13, resize:"none", outline:"none", fontFamily:"inherit" }}
          placeholder="Descreve o problema com detalhe..." />
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:10,
            background:"#FFFFFF", color:"#475569", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
            Cancelar
          </button>
          <button disabled={!reason.trim()||loading} onClick={() => onSubmit(reason)}
            style={{ flex:1, padding:12, borderRadius:10, border:"none",
              background: reason.trim() ? "#E24B4A" : "#FEE2E2",
              color: reason.trim() ? "white" : "#FCA5A5",
              cursor: reason.trim() ? "pointer" : "not-allowed",
              fontFamily:"inherit", fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {loading ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> : <AlertTriangle size={14} />}
            Confirmar disputa
          </button>
        </div>
      </div>
    </div>
  );
}

function UploadProofModal({
  hasExisting, onUpload, onClose, uploading,
}: { hasExisting: boolean; onUpload: (f: File) => void; onClose: () => void; uploading: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const handleSubmit = () => {
    if (!file) return;
    if (hasExisting && !confirmReplace) return;
    onUpload(file);
  };

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
      zIndex:250, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#E2E8F0", border:"1px solid #CBD5E1",
        borderRadius:20, padding:28, maxWidth:440, width:"100%", boxShadow:"0 20px 48px rgba(15,23,42,0.18)" }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:"#0F172A", marginBottom:8 }}>
          {hasExisting ? "Substituir comprovativo" : "Enviar comprovativo"}
        </h2>
        <p style={{ fontSize:13, color:"#4B5563", marginBottom:16, lineHeight:1.5 }}>
          Aceita PDF, PNG, JPG ou JPEG. {hasExisting && "Isto substitui o comprovativo anterior — o histórico é guardado."}
        </p>

        <label style={{
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:10, padding:"28px 16px", borderRadius:14, border:"2px dashed #CBD5E1",
          background:"#FFFFFF", cursor:"pointer", marginBottom:16,
        }}>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display:"none" }}
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <Upload size={24} style={{ color: file ? "#0E7A5F" : "#94A3B8" }} />
          <p style={{ fontSize:13, color: file ? "#0E7A5F" : "#4B5563", fontWeight:600, textAlign:"center" }}>
            {file ? file.name : "Clica para escolher o ficheiro"}
          </p>
        </label>

        {hasExisting && file && (
          <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, cursor:"pointer" }}>
            <input type="checkbox" checked={confirmReplace} onChange={e => setConfirmReplace(e.target.checked)} />
            <span style={{ fontSize:12, color:"#B45309" }}>
              Confirmo que quero substituir o comprovativo anterior
            </span>
          </label>
        )}

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:10,
            background:"#FFFFFF", color:"#475569", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
            Cancelar
          </button>
          <button
            disabled={!file || uploading || (hasExisting && !confirmReplace)}
            onClick={handleSubmit}
            style={{ flex:1, padding:12, borderRadius:10, border:"none",
              background: (file && (!hasExisting || confirmReplace)) ? "#0E7A5F" : "#CBD5E1",
              color: (file && (!hasExisting || confirmReplace)) ? "white" : "#94A3B8",
              cursor: (file && (!hasExisting || confirmReplace)) ? "pointer" : "not-allowed",
              fontFamily:"inherit", fontWeight:700,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {uploading ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> : <Upload size={14} />}
            {uploading ? "A enviar..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({
  payment, bankAccount, activeProof, onSendProof, onViewProof, sendingProof,
}: {
  payment: ServicePayment;
  bankAccount: PaymentBankAccount | null;
  activeProof: PaymentProof | null;
  onSendProof: () => void;
  onViewProof: () => void;
  sendingProof: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const cfg = PAYMENT_STATUS_CFG[payment.status] ?? PAYMENT_STATUS_CFG.pending;

  const handleCopyIban = () => {
    if (!bankAccount) return;
    navigator.clipboard.writeText(bankAccount.iban.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const notYetConfirmed = !["confirmed", "pending_payout", "completed", "refunded"].includes(payment.status);
  const hasActiveProof = !!activeProof && activeProof.status !== "replaced";

  const canSendProof    = notYetConfirmed && !hasActiveProof && !!bankAccount;
  const canReplaceProof = notYetConfirmed && hasActiveProof;

  return (
    <div className="sd-card">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", display:"flex", alignItems:"center", gap:8 }}>
          <Landmark size={16} style={{ color:"#378ADD" }} /> Pagamento
        </p>
        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99,
          background:`${cfg.color}20`, color:cfg.color, border:`1px solid ${cfg.color}40` }}>
          {cfg.label}
        </span>
      </div>

      {bankAccount && (
        <div style={{ background:"#FFFFFF", borderRadius:12, padding:16, marginBottom:14 }}>
          {[
            { l:"Banco", v: bankAccount.bankName },
            { l:"Titular", v: bankAccount.accountHolder },
          ].map((x, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0",
              borderBottom: i < 1 ? "1px solid #E2E8F0" : "none" }}>
              <span style={{ fontSize:12, color:"#4B5563" }}>{x.l}</span>
              <span style={{ fontSize:13, color:"#111827", fontWeight:600 }}>{x.v}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 0 0", marginTop:6, borderTop:"1px solid #E2E8F0" }}>
            <span style={{ fontSize:12, color:"#4B5563" }}>IBAN</span>
            <button onClick={handleCopyIban} style={{ display:"flex", alignItems:"center", gap:6,
              background:"none", border:"none", cursor:"pointer", color:"#378ADD",
              fontSize:13, fontWeight:700, fontFamily:"monospace" }}>
              {bankAccount.iban}
              {copied ? <Check size={13} style={{ color:"#0E7A5F" }} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[
          { l:"Valor bruto", v: fKz(Number(payment.amount)), c:"#111827" },
          { l:`Comissão (${Number(payment.commissionPercentageUsed)}%)`, v: `-${fKz(Number(payment.platformFee))}`, c:"#E24B4A" },
          { l:"Valor líquido ao prestador", v: fKz(Number(payment.providerAmount)), c:"#0E7A5F" },
        ].map((x, i) => (
          <div key={i} style={{ background:"#FFFFFF", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
            <p style={{ fontSize:9, color:"#4B5563", marginBottom:3 }}>{x.l}</p>
            <p style={{ fontSize:12, fontWeight:700, color:x.c }}>{x.v}</p>
          </div>
        ))}
      </div>

      {canSendProof && (
        <button className="ab" onClick={onSendProof} disabled={sendingProof}
          style={{ background:"linear-gradient(135deg,#0E7A5F,#0A5F4A)", color:"white",
                   boxShadow:"0 4px 14px rgba(14,122,95,0.3)" }}>
          <Upload size={15} /> Enviar comprovativo
        </button>
      )}

      {canReplaceProof && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <button className="ab" onClick={onViewProof}
            style={{ background:"#378ADD20", color:"#378ADD", border:"1px solid #378ADD40" }}>
            <Eye size={15} /> Ver comprovativo enviado
          </button>
          <button className="ab" onClick={onSendProof} disabled={sendingProof}
            style={{ background:"#FFFFFF", color:"#475569", border:"1px solid #CBD5E1", fontSize:12 }}>
            <RefreshCw size={13} /> Substituir comprovativo
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
            background:"#378ADD10", borderRadius:10, fontSize:12, color:"#2668b0" }}>
            <Clock size={13} style={{ flexShrink:0 }} />
            A aguardar confirmação do administrador.
          </div>
        </div>
      )}

      {!notYetConfirmed && hasActiveProof && (
        <button className="ab" onClick={onViewProof}
          style={{ background:"#0E7A5F20", color:"#0E7A5F", border:"1px solid #0E7A5F40" }}>
          <Eye size={15} /> Ver comprovativo
        </button>
      )}
    </div>
  );
}

function SupportedBanksCard() {
  const banks = ["BAI", "Atlântico", "BFA", "BIC"];
  return (
    <div className="sd-card">
      <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
        <CreditCard size={16} style={{ color:"#8B5CF6" }} /> Bancos suportados
      </p>
      <p style={{ fontSize:12, color:"#4B5563", lineHeight:1.6, marginBottom:14 }}>
        Podes transferir a partir de qualquer um destes bancos para a conta da Mestroo.
      </p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {banks.map(b => (
          <span key={b} style={{ padding:"6px 14px", borderRadius:99, background:"#FFFFFF",
            border:"1px solid #CBD5E1", fontSize:12, fontWeight:600, color:"#111827" }}>
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Cartão: avaliação do serviço (estrelas + mensagem) ──────────────────────
// Só aparece quando o prestador já marcou o serviço como concluído
// (status === "provider_completed") — momento em que o cliente confirma
// a conclusão E, na mesma acção, pode deixar a avaliação. Depois de
// confirmado (status vira "completed"), o cartão mostra a avaliação já
// enviada, em modo só-leitura.
function ReviewCard({
  status, existingRating, existingReview, onSubmit, submitting,
}: {
  status: string;
  existingRating: number | null;
  existingReview: string | null;
  onSubmit: (rating: number, review: string) => void;
  submitting: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const alreadySubmitted = status === "completed" && existingRating != null;
  const canSubmit = status === "provider_completed";

  if (!canSubmit && !alreadySubmitted) return null;

  return (
    <div className="sd-card">
      <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
        <Star size={16} style={{ color:"#EF9F27" }} /> Avaliação do serviço
      </p>

      {alreadySubmitted ? (
        <div>
          <div style={{ display:"flex", gap:4, marginBottom:10 }}>
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={20}
                fill={n <= existingRating! ? "#EF9F27" : "none"}
                color={n <= existingRating! ? "#EF9F27" : "#CBD5E1"} />
            ))}
          </div>
          {existingReview && (
            <p style={{ fontSize:13, color:"#374151", lineHeight:1.6, fontStyle:"italic",
              padding:"12px 14px", background:"#FFFFFF", borderRadius:10 }}>
              "{existingReview}"
            </p>
          )}
          <p style={{ fontSize:11, color:"#4B5563", marginTop:10 }}>
            A tua avaliação já foi enviada ao prestador.
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize:12, color:"#4B5563", marginBottom:14, lineHeight:1.5 }}>
            O prestador marcou o serviço como concluído. Confirma a conclusão em "Outras acções" e deixa aqui a tua avaliação.
          </p>
          <div style={{ display:"flex", gap:6, marginBottom:14, justifyContent:"center" }}>
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:2 }}
              >
                <Star size={30}
                  fill={n <= (hoverRating || rating) ? "#EF9F27" : "none"}
                  color={n <= (hoverRating || rating) ? "#EF9F27" : "#CBD5E1"}
                  style={{ transition:"all 0.1s" }} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Deixa uma mensagem sobre o serviço (opcional)"
            style={{ width:"100%", minHeight:80, padding:12, borderRadius:10,
              background:"#FFFFFF", border:"1px solid #CBD5E1", color:"#111827",
              fontSize:13, resize:"none", outline:"none", fontFamily:"inherit", marginBottom:12 }}
          />
          <button
            disabled={rating === 0 || submitting}
            onClick={() => onSubmit(rating, reviewText.trim())}
            style={{
              width:"100%", padding:12, borderRadius:11, border:"none",
              background: rating > 0 ? "linear-gradient(135deg,#EF9F27,#d4870a)" : "#CBD5E1",
              color: rating > 0 ? "#0F172A" : "#94A3B8",
              fontSize:14, fontWeight:700, cursor: rating > 0 && !submitting ? "pointer" : "not-allowed",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"inherit",
            }}
          >
            {submitting ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} /> : <Send size={15} />}
            {submitting ? "A enviar..." : "Confirmar conclusão e enviar avaliação"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Overlay de zoom da foto do prestador (estilo Instagram) ─────────────────
// Clicar na foto pequena abre isto; clicar em qualquer parte do overlay
// (fundo escurecido ou a própria foto ampliada) fecha e volta ao estado
// normal. Não introduz nenhum novo pedido à API — usa a mesma
// service.provider.avatarUrl já carregada.
function ProviderPhotoZoom({
  avatarUrl, name, onClose,
}: { avatarUrl: string; name: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:300,
        background:"rgba(0,0,0,0.92)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:24, cursor:"zoom-out",
        animation:"fadeInZoom 0.18s ease-out",
      }}
    >
      <img
        src={avatarUrl}
        alt={name}
        onClick={onClose}
        style={{
          width:"min(78vw, 420px)",
          height:"min(78vw, 420px)",
          borderRadius:"50%",
          objectFit:"cover",
          border:"3px solid rgba(255,255,255,0.15)",
          boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
          cursor:"zoom-out",
          animation:"scaleInZoom 0.2s ease-out",
        }}
      />
      <style>{`
        @keyframes fadeInZoom { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleInZoom { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}

export default function ClientServiceDetailPage() {
  const { id } = useParams() as { id: string };
  const router  = useRouter();

  const [service, setService]   = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [payment, setPayment]   = useState<ServicePayment | null>(null);
  const [bankAccount, setBankAccount] = useState<PaymentBankAccount | null>(null);
  const [activeProof, setActiveProof] = useState<PaymentProof | null>(null);
  const [loading, setLoading]   = useState(true);
  const [actL, setActL]         = useState<string|null>(null);
  const [pinData, setPinData]   = useState<{pin:string;expiresAt:string}|null>(null);
  const [dispute, setDispute]   = useState(false);
  const [chatL, setChatL]       = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showProofViewer, setShowProofViewer] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showPhotoZoom, setShowPhotoZoom] = useState(false);

  const load = useCallback(async () => {
    // Timeout de segurança: se o backend demorar mais de 10s a
    // responder (ex: Render a acordar do sleep), força setLoading(false)
    // de qualquer forma — o utilizador vê a página (possivelmente sem
    // dados) em vez de ficar bloqueado com o spinner sem poder navegar.
    const timeout = setTimeout(() => setLoading(false), 10_000);
    try {
      const [s, t] = await Promise.all([
        servicesDetailApi.get(id),
        servicesDetailApi.timeline(id),
      ]);
      setService(s); setTimeline(t);

      const existingPayment = await servicesDetailApi.getPayment(id).catch(() => null);
      if (existingPayment) {
        setPayment(existingPayment);

        const account = await bankAccountsApi.getPlatformAccount().catch(() => null);
        if (account) {
          setBankAccount({
            bankName: account.bankName,
            accountHolder: account.accountHolder,
            iban: account.iban,
            accountNumber: account.accountNumber,
          });
        }

        try {
          const history = await paymentProofApi.getMyHistory(existingPayment.id);
          const active = history
            .filter(p => p.status === "active" || p.status === "confirmed")
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
          setActiveProof(active);
        } catch {
          setActiveProof(null);
        }
      }
    } catch (e: any) { alert(e.message); }
    finally { clearTimeout(timeout); setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (key: string, fn: () => Promise<any>) => {
    setActL(key);
    try { await fn(); await load(); }
    catch (e: any) { alert(e.message || "Erro. Tenta novamente."); }
    finally { setActL(null); }
  };

  const handleChat = async () => {
    if (!service?.providerId) return;
    setChatL(true);
    try {
      const { room } = await chatApi.createOrGetRoom({ participantId: service.providerId });
      router.push(`/chat/${room.id}`);
    } catch { router.push("/chat"); }
    finally { setChatL(false); }
  };

  const handleInitiatePayment = async () => {
    setActL("pay");
    try {
      const result = await servicesDetailApi.pay(id);
      setPayment(result.payment);
      setBankAccount(result.bankAccount);
      await load();
    } catch (e: any) { alert(e.message || "Erro ao iniciar pagamento."); }
    finally { setActL(null); }
  };

  const handleUploadProof = async (file: File) => {
    if (!payment) return;
    setUploadingProof(true);
    try {
      const proof = await paymentProofApi.upload(payment.id, file);
      setActiveProof(proof);
      setShowUpload(false);
      await load();
    } catch (e: any) { alert(e.message || "Erro ao enviar comprovativo."); }
    finally { setUploadingProof(false); }
  };

  // ── Confirma a conclusão do serviço JUNTO com a avaliação ─────────────────
  const handleSubmitReview = async (rating: number, review: string) => {
    setSubmittingReview(true);
    try {
      await servicesDetailApi.confirm(id, { rating, review: review || undefined });
      await load();
    } catch (e: any) {
      alert(e.message || "Erro ao confirmar e enviar avaliação.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#FFFFFF" }}>
      <div style={{ flex:1, marginLeft:240, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Loader2 size={28} style={{ color:"#0E7A5F", animation:"spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!service) return null;

  const cfg    = STATUS[service.status] ?? STATUS.requested;
  const amount = Number(service.agreedPrice ?? service.budget);
  const ended  = ["completed","cancelled","refunded","rejected"].includes(service.status);
  const disputable = ["payment_held","in_progress","provider_completed"].includes(service.status);

  const showPaymentCard = !["requested", "rejected", "cancelled"].includes(service.status);
  const showReviewCard  = ["provider_completed", "completed"].includes(service.status);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .sd-wrap { display: flex; min-height: 100vh; background: #FFFFFF; }
        .sd-main { flex: 1; display: flex; flex-direction: column; }
        .sd-body { flex: 1; padding: 28px 32px; display: flex; flex-direction: column;
                   gap: 20px; max-width: 760px; width: 100%; }
        .sd-card { background: #E2E8F0; border: 1px solid #CBD5E1;
                   border-radius: 18px; padding: 24px; box-shadow: 0 2px 10px rgba(15,23,42,0.06); }
        .ab { display: flex; align-items: center; justify-content: center; gap: 8px;
              padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 700;
              cursor: pointer; font-family: inherit; border: none; transition: all .2s; width: 100%; }
        .ab:disabled { opacity: .5; cursor: not-allowed; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { background: #FFFFFF; border-radius: 10px; padding: 10px 14px; }
        .tl-wrap { display: flex; flex-direction: column; }
        .tl-item { display: flex; gap: 12px; padding-bottom: 16px; position: relative; }
        .tl-item:last-child { padding-bottom: 0; }
        .tl-line { position: absolute; left: 9px; top: 20px; bottom: 0;
                   width: 1px; background: #94A3B8; }
        .tl-dot  { width: 20px; height: 20px; border-radius: 50%; background: #0E7A5F;
                   border: 3px solid #D9F5F0; display: flex; align-items: center;
                   justify-content: center; flex-shrink: 0; z-index: 1; }
        .provider-avatar-btn { transition: transform 0.15s ease; }
        .provider-avatar-btn:hover { transform: scale(1.04); }
        @media(max-width:1024px) {  .sd-body { padding: 80px 20px 24px; } }
        @media(max-width:640px)  { .sd-body { padding: 70px 12px 20px; gap: 14px; }
                                   .info-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="sd-wrap">
        <div className="sd-main">
          <div className="sd-body">

            <button onClick={() => router.push("/services")}
              style={{ display:"flex", alignItems:"center", gap:8, background:"none",
                border:"none", color:"#475569", cursor:"pointer", fontSize:13,
                fontFamily:"inherit", width:"fit-content" }}>
              <ArrowLeft size={15} /> Voltar
            </button>

            <div className="sd-card">
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
                  <p style={{ fontSize:24, fontWeight:800, color:"#0E7A5F" }}>{fKz(amount)}</p>
                  <p style={{ fontSize:11, color:"#4B5563", marginTop:2 }}>Valor acordado</p>
                </div>
              </div>

              {cfg.step > 0 && <ProgressBar step={cfg.step} />}

              <div className="info-grid" style={{ marginTop:16 }}>
                {[
                  { l:"Categoria", v: service.category },
                  { l:"Morada",    v: service.address   },
                  { l:"Data",      v: new Date(service.createdAt).toLocaleDateString("pt-PT") },
                ].map((x,i) => (
                  <div className="info-item" key={i}>
                    <p style={{ fontSize:11, color:"#4B5563", marginBottom:2 }}>{x.l}</p>
                    <p style={{ fontSize:13, color:"#111827", fontWeight:600 }}>{x.v}</p>
                  </div>
                ))}

                <div className="info-item">
                  <p style={{ fontSize:11, color:"#4B5563", marginBottom:6 }}>Prestador</p>
                  {service.provider ? (
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div
                        className={service.provider.avatarUrl ? "provider-avatar-btn" : undefined}
                        onClick={() => { if (service.provider.avatarUrl) setShowPhotoZoom(true); }}
                        style={{
                          width:42, height:42, borderRadius:"50%", flexShrink:0,
                          border:"1px solid #CBD5E1", overflow:"hidden",
                          background:"#0E7A5F20", display:"flex",
                          alignItems:"center", justifyContent:"center",
                          cursor: service.provider.avatarUrl ? "pointer" : "default",
                        }}
                      >
                        {service.provider.avatarUrl ? (
                          <img
                            src={service.provider.avatarUrl}
                            alt={service.provider.fullName}
                            style={{ width:"100%", height:"100%", objectFit:"cover" }}
                          />
                        ) : (
                          <span style={{ fontSize:15, fontWeight:700, color:"#0E7A5F" }}>
                            {(service.provider.fullName ?? "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:13, color:"#111827", fontWeight:600,
                          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {service.provider.fullName}
                        </p>
                        {service.provider.isVerified && (
                          <p style={{ fontSize:10, color:"#0E7A5F", fontWeight:600, marginTop:1 }}>
                            Prestador verificado
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize:13, color:"#111827", fontWeight:600 }}>—</p>
                  )}
                </div>
              </div>

              {service.description && (
                <p style={{ fontSize:13, color:"#374151", lineHeight:1.6,
                  marginTop:14, padding:"12px 14px", background:"#FFFFFF", borderRadius:10 }}>
                  {service.description}
                </p>
              )}

              {service.warrantyExpiresAt && (
                <div style={{ marginTop:12, padding:"10px 14px", background:"#D9F5F0",
                  border:"1px solid #0E7A5F30", borderRadius:10, fontSize:12, color:"#0E7A5F" }}>
                  ⭐ Garantia válida até {new Date(service.warrantyExpiresAt).toLocaleDateString("pt-PT")}
                </div>
              )}
            </div>

            {service.status === "accepted" && !payment && (
              <div className="sd-card">
                <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:14 }}>
                  Acções disponíveis
                </p>
                <button className="ab" disabled={actL==="pay"}
                  style={{ background:"linear-gradient(135deg,#0E7A5F,#0A5F4A)", color:"white",
                           boxShadow:"0 4px 14px rgba(14,122,95,0.3)" }}
                  onClick={handleInitiatePayment}>
                  {actL==="pay" ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <Shield size={15}/>}
                  {actL==="pay" ? "A processar..." : `Ver dados para pagamento de ${fKz(amount)}`}
                </button>
              </div>
            )}

            {showPaymentCard && payment && (
              <PaymentCard
                payment={payment}
                bankAccount={bankAccount}
                activeProof={activeProof}
                sendingProof={uploadingProof}
                onSendProof={() => setShowUpload(true)}
                onViewProof={() => setShowProofViewer(true)}
              />
            )}
            {showPaymentCard && payment && <SupportedBanksCard />}

            {!ended && (
              <div className="sd-card">
                <p style={{ fontSize:14, fontWeight:700, color:"#0F172A", marginBottom:14 }}>
                  {payment ? "Outras acções" : "Acções disponíveis"}
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

                  {service.status === "payment_held" && (
                    <>
                      <button className="ab" disabled={actL==="pin"}
                        style={{ background:"linear-gradient(135deg,#378ADD,#2668b0)", color:"white" }}
                        onClick={() => act("pin", async () => {
                          const d = await servicesDetailApi.generatePin(id);
                          setPinData(d);
                        })}>
                        {actL==="pin" ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <Key size={15}/>}
                        {actL==="pin" ? "A gerar..." : "Gerar PIN de início"}
                      </button>
                      {service.servicePin && !service.pinUsed && (
                        <button className="ab"
                          style={{ background:"#0E7A5F20", color:"#0E7A5F", border:"1px solid #0E7A5F40" }}
                          onClick={() => setPinData({ pin: service.servicePin, expiresAt: service.pinExpiresAt })}>
                          <Key size={15}/> Ver PIN actual
                        </button>
                      )}
                    </>
                  )}

                  {service.status === "completed" && payment?.status === "pending_payout" && (
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px",
                      background:"#8B5CF610", border:"1px solid #8B5CF630", borderRadius:12 }}>
                      <Clock size={18} style={{ color:"#8B5CF6", flexShrink:0 }} />
                      <p style={{ fontSize:13, color:"#5B21B6", lineHeight:1.5 }}>
                        A administração está a processar a transferência para o prestador.
                      </p>
                    </div>
                  )}

                  {service.providerId && (
                    <button className="ab" disabled={chatL}
                      style={{ background:"#378ADD20", color:"#378ADD", border:"1px solid #378ADD40" }}
                      onClick={handleChat}>
                      {chatL ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <MessageCircle size={15}/>}
                      {chatL ? "A abrir..." : "Conversar com prestador"}
                    </button>
                  )}

                  {disputable && (
                    <button className="ab"
                      style={{ background:"#E24B4A15", color:"#E24B4A", border:"1px solid #E24B4A40" }}
                      onClick={() => setDispute(true)}>
                      <AlertTriangle size={15}/> Abrir disputa
                    </button>
                  )}

                  {["requested","accepted"].includes(service.status) && (
                    <button className="ab" disabled={actL==="cancel"}
                      style={{ background:"#FFFFFF", color:"#475569", border:"1px solid #CBD5E1" }}
                      onClick={() => {
                        if (confirm("Tens a certeza que queres cancelar?"))
                          act("cancel", () => servicesDetailApi.cancel(id, "Cancelado pelo cliente"));
                      }}>
                      {actL==="cancel" ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }}/> : <X size={15}/>}
                      Cancelar pedido
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Avaliação (estrelas + mensagem) ── */}
            {showReviewCard && (
              <ReviewCard
                status={service.status}
                existingRating={service.clientRating ?? null}
                existingReview={service.clientReview ?? null}
                onSubmit={handleSubmitReview}
                submitting={submittingReview}
              />
            )}

            {timeline.length > 0 && (
              <div className="sd-card">
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
                            {TL_LABELS[ev.action] ?? ev.action}
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
        </div>
      </div>

      {pinData && <PinModal pin={pinData.pin} expiresAt={pinData.expiresAt} onClose={() => setPinData(null)} />}
      {dispute && (
        <DisputeModal
          loading={actL==="dispute"}
          onClose={() => setDispute(false)}
          onSubmit={r => { setDispute(false); act("dispute", () => servicesDetailApi.openDispute(id, r)); }}
        />
      )}
      {showUpload && (
        <UploadProofModal
          hasExisting={!!activeProof}
          uploading={uploadingProof}
          onClose={() => setShowUpload(false)}
          onUpload={handleUploadProof}
        />
      )}
      {showProofViewer && activeProof && (
        <ProofViewerModal proofId={activeProof.id} fileType={activeProof.fileType} onClose={() => setShowProofViewer(false)} />
      )}
      {showPhotoZoom && service.provider?.avatarUrl && (
        <ProviderPhotoZoom
          avatarUrl={service.provider.avatarUrl}
          name={service.provider.fullName}
          onClose={() => setShowPhotoZoom(false)}
        />
      )}
    </>
  );
}
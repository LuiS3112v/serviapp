"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
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
  payment_held:       { label: "Pagamento protegido",           color: "#1D9E75", step: 3 },
  in_progress:        { label: "Em execução",                   color: "#8B5CF6", step: 4 },
  provider_completed: { label: "A aguardar a tua confirmação",  color: "#EF9F27", step: 5 },
  completed:          { label: "Concluído",                     color: "#1D9E75", step: 6 },
  disputed:           { label: "Em disputa",                    color: "#E24B4A", step: 0 },
  cancelled:          { label: "Cancelado",                     color: "#E24B4A", step: 0 },
  refunded:           { label: "Reembolsado",                   color: "#1D9E75", step: 0 },
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
  confirmed:        { label: "Confirmado — protegido",       color: "#1D9E75" },
  pending_payout:   { label: "A processar transferência",    color: "#8B5CF6" },
  completed:        { label: "Concluído",                    color: "#1D9E75" },
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
        const c = done || active ? "#1D9E75" : "#1a2535";
        return (
          <div key={n} style={{ display:"flex", alignItems:"center", flex:1, minWidth:0 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", border:`2px solid ${c}`,
                background: done ? "#1D9E75" : active ? "#1D9E7530" : "#1a2535",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, fontWeight:700, color: done ? "white" : active ? "#1D9E75" : "#3a4a5a",
                transition:"all .3s" }}>
                {done ? "✓" : n}
              </div>
              <p style={{ fontSize:9, color: done||active ? "#c0d0e0" : "#3a4a5a",
                marginTop:3, whiteSpace:"nowrap", fontWeight: active ? 700 : 400 }}>{s}</p>
            </div>
            {i < steps.length-1 && (
              <div style={{ flex:1, height:2, background: done ? "#1D9E75" : "#1a2535",
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
      <div onClick={e => e.stopPropagation()} style={{ background:"#131b27", border:"1px solid #1a2535",
        borderRadius:20, padding:32, maxWidth:340, width:"100%", textAlign:"center" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:"#1D9E7520",
          border:"2px solid #1D9E75", display:"flex", alignItems:"center", justifyContent:"center",
          margin:"0 auto 16px" }}>
          <Key size={24} style={{ color:"#1D9E75" }} />
        </div>
        <p style={{ fontSize:16, fontWeight:700, color:"#e2e8f0", marginBottom:6 }}>PIN de início</p>
        <p style={{ fontSize:13, color:"#4a6a6a", marginBottom:20, lineHeight:1.5 }}>
          Fornece este PIN ao prestador quando ele chegar para começar o serviço.
        </p>
        <div style={{ fontSize:40, fontWeight:900, letterSpacing:10, color:"#1D9E75",
          background:"#0d1117", borderRadius:14, padding:"16px 24px", marginBottom:12,
          border:"2px dashed #1D9E7540", fontFamily:"monospace" }}>
          {pin}
        </div>
        <p style={{ fontSize:11, color:"#4a5a6a" }}>
          Válido até {new Date(expiresAt).toLocaleString("pt-PT")}
        </p>
        <button onClick={onClose} style={{ marginTop:20, padding:"10px 28px",
          borderRadius:10, background:"#1D9E75", color:"white", border:"none",
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
      <div onClick={e => e.stopPropagation()} style={{ background:"#131b27", border:"1px solid #1a2535",
        borderRadius:20, padding:28, maxWidth:440, width:"100%" }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>Abrir disputa</h2>
        <p style={{ fontSize:13, color:"#4a6a6a", marginBottom:16, lineHeight:1.5 }}>
          O pagamento ficará bloqueado até resolução pelo administrador.
        </p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          style={{ width:"100%", minHeight:100, padding:12, borderRadius:10,
            background:"#0d1117", border:"1px solid #1a2535", color:"#e2e8f0",
            fontSize:13, resize:"none", outline:"none", fontFamily:"inherit" }}
          placeholder="Descreve o problema com detalhe..." />
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:10,
            background:"#1a2535", color:"#8a9ab0", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
            Cancelar
          </button>
          <button disabled={!reason.trim()||loading} onClick={() => onSubmit(reason)}
            style={{ flex:1, padding:12, borderRadius:10, border:"none",
              background: reason.trim() ? "#E24B4A" : "#2a1a1a",
              color: reason.trim() ? "white" : "#5a3a3a",
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
      <div onClick={e => e.stopPropagation()} style={{ background:"#131b27", border:"1px solid #1a2535",
        borderRadius:20, padding:28, maxWidth:440, width:"100%" }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>
          {hasExisting ? "Substituir comprovativo" : "Enviar comprovativo"}
        </h2>
        <p style={{ fontSize:13, color:"#4a6a6a", marginBottom:16, lineHeight:1.5 }}>
          Aceita PDF, PNG, JPG ou JPEG. {hasExisting && "Isto substitui o comprovativo anterior — o histórico é guardado."}
        </p>

        <label style={{
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          gap:10, padding:"28px 16px", borderRadius:14, border:"2px dashed #1a2535",
          background:"#0d1117", cursor:"pointer", marginBottom:16,
        }}>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display:"none" }}
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <Upload size={24} style={{ color: file ? "#1D9E75" : "#3a4a5a" }} />
          <p style={{ fontSize:13, color: file ? "#1D9E75" : "#4a6a6a", fontWeight:600, textAlign:"center" }}>
            {file ? file.name : "Clica para escolher o ficheiro"}
          </p>
        </label>

        {hasExisting && file && (
          <label style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16, cursor:"pointer" }}>
            <input type="checkbox" checked={confirmReplace} onChange={e => setConfirmReplace(e.target.checked)} />
            <span style={{ fontSize:12, color:"#EF9F27" }}>
              Confirmo que quero substituir o comprovativo anterior
            </span>
          </label>
        )}

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:10,
            background:"#1a2535", color:"#8a9ab0", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
            Cancelar
          </button>
          <button
            disabled={!file || uploading || (hasExisting && !confirmReplace)}
            onClick={handleSubmit}
            style={{ flex:1, padding:12, borderRadius:10, border:"none",
              background: (file && (!hasExisting || confirmReplace)) ? "#1D9E75" : "#1a2535",
              color: (file && (!hasExisting || confirmReplace)) ? "white" : "#4a5a6a",
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
        <p style={{ fontSize:14, fontWeight:700, color:"#c0d0e0", display:"flex", alignItems:"center", gap:8 }}>
          <Landmark size={16} style={{ color:"#378ADD" }} /> Pagamento
        </p>
        <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99,
          background:`${cfg.color}20`, color:cfg.color, border:`1px solid ${cfg.color}40` }}>
          {cfg.label}
        </span>
      </div>

      {bankAccount && (
        <div style={{ background:"#0d1117", borderRadius:12, padding:16, marginBottom:14 }}>
          {[
            { l:"Banco", v: bankAccount.bankName },
            { l:"Titular", v: bankAccount.accountHolder },
          ].map((x, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0",
              borderBottom: i < 1 ? "1px solid #1a2535" : "none" }}>
              <span style={{ fontSize:12, color:"#4a6a6a" }}>{x.l}</span>
              <span style={{ fontSize:13, color:"#c0d0e0", fontWeight:600 }}>{x.v}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 0 0", marginTop:6, borderTop:"1px solid #1a2535" }}>
            <span style={{ fontSize:12, color:"#4a6a6a" }}>IBAN</span>
            <button onClick={handleCopyIban} style={{ display:"flex", alignItems:"center", gap:6,
              background:"none", border:"none", cursor:"pointer", color:"#378ADD",
              fontSize:13, fontWeight:700, fontFamily:"monospace" }}>
              {bankAccount.iban}
              {copied ? <Check size={13} style={{ color:"#1D9E75" }} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[
          { l:"Valor bruto", v: fKz(Number(payment.amount)), c:"#c0d0e0" },
          { l:`Comissão (${Number(payment.commissionPercentageUsed)}%)`, v: `-${fKz(Number(payment.platformFee))}`, c:"#E24B4A" },
          { l:"Valor líquido ao prestador", v: fKz(Number(payment.providerAmount)), c:"#1D9E75" },
        ].map((x, i) => (
          <div key={i} style={{ background:"#0d1117", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
            <p style={{ fontSize:9, color:"#4a6a6a", marginBottom:3 }}>{x.l}</p>
            <p style={{ fontSize:12, fontWeight:700, color:x.c }}>{x.v}</p>
          </div>
        ))}
      </div>

      {canSendProof && (
        <button className="ab" onClick={onSendProof} disabled={sendingProof}
          style={{ background:"linear-gradient(135deg,#1D9E75,#16876a)", color:"white",
                   boxShadow:"0 4px 14px rgba(29,158,117,0.3)" }}>
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
            style={{ background:"#0d1117", color:"#6a7a8a", border:"1px solid #1a2535", fontSize:12 }}>
            <RefreshCw size={13} /> Substituir comprovativo
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
            background:"#378ADD10", borderRadius:10, fontSize:12, color:"#8ab0dd" }}>
            <Clock size={13} style={{ flexShrink:0 }} />
            A aguardar confirmação do administrador.
          </div>
        </div>
      )}

      {!notYetConfirmed && hasActiveProof && (
        <button className="ab" onClick={onViewProof}
          style={{ background:"#1D9E7520", color:"#1D9E75", border:"1px solid #1D9E7540" }}>
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
      <p style={{ fontSize:14, fontWeight:700, color:"#c0d0e0", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
        <CreditCard size={16} style={{ color:"#8B5CF6" }} /> Bancos suportados
      </p>
      <p style={{ fontSize:12, color:"#4a6a6a", lineHeight:1.6, marginBottom:14 }}>
        Podes transferir a partir de qualquer um destes bancos para a conta da ServiApp.
      </p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {banks.map(b => (
          <span key={b} style={{ padding:"6px 14px", borderRadius:99, background:"#0d1117",
            border:"1px solid #1a2535", fontSize:12, fontWeight:600, color:"#c0d0e0" }}>
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
      <p style={{ fontSize:14, fontWeight:700, color:"#c0d0e0", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
        <Star size={16} style={{ color:"#EF9F27" }} /> Avaliação do serviço
      </p>

      {alreadySubmitted ? (
        <div>
          <div style={{ display:"flex", gap:4, marginBottom:10 }}>
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={20}
                fill={n <= existingRating! ? "#EF9F27" : "none"}
                color={n <= existingRating! ? "#EF9F27" : "#2a3a4a"} />
            ))}
          </div>
          {existingReview && (
            <p style={{ fontSize:13, color:"#8a9ab0", lineHeight:1.6, fontStyle:"italic",
              padding:"12px 14px", background:"#0d1117", borderRadius:10 }}>
              "{existingReview}"
            </p>
          )}
          <p style={{ fontSize:11, color:"#4a6a6a", marginTop:10 }}>
            A tua avaliação já foi enviada ao prestador.
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize:12, color:"#4a6a6a", marginBottom:14, lineHeight:1.5 }}>
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
                  color={n <= (hoverRating || rating) ? "#EF9F27" : "#2a3a4a"}
                  style={{ transition:"all 0.1s" }} />
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            placeholder="Deixa uma mensagem sobre o serviço (opcional)"
            style={{ width:"100%", minHeight:80, padding:12, borderRadius:10,
              background:"#0d1117", border:"1px solid #1a2535", color:"#e2e8f0",
              fontSize:13, resize:"none", outline:"none", fontFamily:"inherit", marginBottom:12 }}
          />
          <button
            disabled={rating === 0 || submitting}
            onClick={() => onSubmit(rating, reviewText.trim())}
            style={{
              width:"100%", padding:12, borderRadius:11, border:"none",
              background: rating > 0 ? "linear-gradient(135deg,#EF9F27,#d4870a)" : "#1a2535",
              color: rating > 0 ? "#0d1117" : "#4a5a6a",
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

  const load = useCallback(async () => {
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
    <div style={{ display:"flex", minHeight:"100vh", background:"#0d1117" }}>
      <Sidebar />
      <div style={{ flex:1, marginLeft:240, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Loader2 size={28} style={{ color:"#1D9E75", animation:"spin 1s linear infinite" }} />
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
        .sd-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .sd-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .sd-body { flex: 1; padding: 28px 32px; display: flex; flex-direction: column;
                   gap: 20px; max-width: 760px; width: 100%; }
        .sd-card { background: #131b27; border: 1px solid #1a2535;
                   border-radius: 18px; padding: 24px; }
        .ab { display: flex; align-items: center; justify-content: center; gap: 8px;
              padding: 12px 20px; border-radius: 12px; font-size: 14px; font-weight: 700;
              cursor: pointer; font-family: inherit; border: none; transition: all .2s; width: 100%; }
        .ab:disabled { opacity: .5; cursor: not-allowed; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .info-item { background: #0d1117; border-radius: 10px; padding: 10px 14px; }
        .tl-wrap { display: flex; flex-direction: column; }
        .tl-item { display: flex; gap: 12px; padding-bottom: 16px; position: relative; }
        .tl-item:last-child { padding-bottom: 0; }
        .tl-line { position: absolute; left: 9px; top: 20px; bottom: 0;
                   width: 1px; background: #1a2535; }
        .tl-dot  { width: 20px; height: 20px; border-radius: 50%; background: #1D9E7520;
                   border: 1px solid #1D9E75; display: flex; align-items: center;
                   justify-content: center; flex-shrink: 0; z-index: 1; }
        @media(max-width:1024px) { .sd-main { margin-left: 0; } .sd-body { padding: 80px 20px 24px; } }
        @media(max-width:640px)  { .sd-body { padding: 70px 12px 20px; gap: 14px; }
                                   .info-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="sd-wrap">
        <Sidebar />
        <div className="sd-main">
          <Navbar />
          <div className="sd-body">

            <button onClick={() => router.push("/services")}
              style={{ display:"flex", alignItems:"center", gap:8, background:"none",
                border:"none", color:"#4a6a6a", cursor:"pointer", fontSize:13,
                fontFamily:"inherit", width:"fit-content" }}>
              <ArrowLeft size={15} /> Voltar
            </button>

            <div className="sd-card">
              <div style={{ display:"flex", alignItems:"flex-start",
                justifyContent:"space-between", gap:12, marginBottom:16 }}>
                <div>
                  <h1 style={{ fontSize:18, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>
                    {service.title}
                  </h1>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:6,
                    padding:"4px 10px", borderRadius:99, fontSize:12, fontWeight:700,
                    background:`${cfg.color}20`, color:cfg.color, border:`1px solid ${cfg.color}40` }}>
                    {cfg.label}
                  </span>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ fontSize:24, fontWeight:800, color:"#1D9E75" }}>{fKz(amount)}</p>
                  <p style={{ fontSize:11, color:"#4a6a6a", marginTop:2 }}>Valor acordado</p>
                </div>
              </div>

              {cfg.step > 0 && <ProgressBar step={cfg.step} />}

              <div className="info-grid" style={{ marginTop:16 }}>
                {[
                  { l:"Categoria", v: service.category },
                  { l:"Morada",    v: service.address   },
                  { l:"Prestador", v: service.provider?.fullName ?? "—" },
                  { l:"Data",      v: new Date(service.createdAt).toLocaleDateString("pt-PT") },
                ].map((x,i) => (
                  <div className="info-item" key={i}>
                    <p style={{ fontSize:11, color:"#4a6a6a", marginBottom:2 }}>{x.l}</p>
                    <p style={{ fontSize:13, color:"#c0d0e0", fontWeight:600 }}>{x.v}</p>
                  </div>
                ))}
              </div>

              {service.description && (
                <p style={{ fontSize:13, color:"#6a7a8a", lineHeight:1.6,
                  marginTop:14, padding:"12px 14px", background:"#0d1117", borderRadius:10 }}>
                  {service.description}
                </p>
              )}

              {service.warrantyExpiresAt && (
                <div style={{ marginTop:12, padding:"10px 14px", background:"#1D9E7510",
                  border:"1px solid #1D9E7530", borderRadius:10, fontSize:12, color:"#1D9E75" }}>
                  ⭐ Garantia válida até {new Date(service.warrantyExpiresAt).toLocaleDateString("pt-PT")}
                </div>
              )}
            </div>

            {service.status === "accepted" && !payment && (
              <div className="sd-card">
                <p style={{ fontSize:14, fontWeight:700, color:"#c0d0e0", marginBottom:14 }}>
                  Acções disponíveis
                </p>
                <button className="ab" disabled={actL==="pay"}
                  style={{ background:"linear-gradient(135deg,#1D9E75,#16876a)", color:"white",
                           boxShadow:"0 4px 14px rgba(29,158,117,0.3)" }}
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
                <p style={{ fontSize:14, fontWeight:700, color:"#c0d0e0", marginBottom:14 }}>
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
                          style={{ background:"#1D9E7520", color:"#1D9E75", border:"1px solid #1D9E7540" }}
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
                      <p style={{ fontSize:13, color:"#c0a8f0", lineHeight:1.5 }}>
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
                      style={{ background:"#1a2535", color:"#6a7a8a", border:"1px solid #1a2535" }}
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
                <p style={{ fontSize:14, fontWeight:700, color:"#c0d0e0", marginBottom:16 }}>Histórico</p>
                <div className="tl-wrap">
                  {timeline.map((ev, i) => (
                    <div className="tl-item" key={ev.id}>
                      {i < timeline.length-1 && <span className="tl-line" />}
                      <div className="tl-dot">
                        <span style={{ fontSize:8, color:"#1D9E75" }}>●</span>
                      </div>
                      <div style={{ flex:1, paddingTop:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:"#c0d0e0" }}>
                            {TL_LABELS[ev.action] ?? ev.action}
                          </p>
                          <span style={{ fontSize:11, color:"#3a4a5a", flexShrink:0 }}>
                            {ago(ev.createdAt)}
                          </span>
                        </div>
                        <p style={{ fontSize:12, color:"#4a6a6a", marginTop:2 }}>{ev.description}</p>
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
    </>
  );
}
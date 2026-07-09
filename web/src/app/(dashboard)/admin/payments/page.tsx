"use client";
import { useState, useEffect, useCallback } from "react";
import { adminPaymentsApi, AdminPaymentRow, AdminDisputedService } from "@/lib/api/admin-payments.api";
import ProofViewerModal from "@/components/shared/ProofViewerModal";
import {
  FileText, CheckCircle, X, Loader2, Eye, RefreshCw,
  Clock, AlertTriangle, Landmark, User, Building2,
  TrendingUp, Scale,
} from "lucide-react";

type TabKey = "pending-proofs" | "confirmed" | "pending-payouts" | "disputed";

const TABS: { key: TabKey; label: string; desc: string }[] = [
  { key: "pending-proofs", label: "Comprovativos pendentes", desc: "Aguardam confirmação de pagamento" },
  { key: "confirmed",      label: "Pagamentos protegidos",   desc: "Confirmados, serviço em curso" },
  { key: "pending-payouts", label: "Transferências pendentes", desc: "Serviço concluído, aguarda pagamento ao prestador" },
  { key: "disputed",       label: "Em disputa",              desc: "Serviços reportados por cliente ou prestador" },
];

function fKz(v: number) { return new Intl.NumberFormat("pt-PT").format(v) + " Kz"; }
function fDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT") + " · " +
    new Date(d).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function RejectProofModal({ onSubmit, onClose, loading }: { onSubmit: (r: string) => void; onClose: () => void; loading: boolean }) {
  const [reason, setReason] = useState("");
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
      zIndex:250, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#131b27", border:"1px solid #1a2535",
        borderRadius:20, padding:28, maxWidth:440, width:"100%" }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>Rejeitar comprovativo</h2>
        <p style={{ fontSize:13, color:"#4a6a6a", marginBottom:16, lineHeight:1.5 }}>
          O cliente será notificado e poderá enviar um novo comprovativo.
        </p>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          style={{ width:"100%", minHeight:90, padding:12, borderRadius:10,
            background:"#0d1117", border:"1px solid #1a2535", color:"#e2e8f0",
            fontSize:13, resize:"none", outline:"none", fontFamily:"inherit" }}
          placeholder="Ex: Valor não corresponde, transferência não encontrada..." />
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:10,
            background:"#1a2535", color:"#8a9ab0", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
            Cancelar
          </button>
          <button disabled={!reason.trim() || loading} onClick={() => onSubmit(reason)}
            style={{ flex:1, padding:12, borderRadius:10, border:"none",
              background: reason.trim() ? "#E24B4A" : "#2a1a1a",
              color: reason.trim() ? "white" : "#5a3a3a",
              cursor: reason.trim() ? "pointer" : "not-allowed",
              fontFamily:"inherit", fontWeight:700 }}>
            {loading ? "A rejeitar..." : "Confirmar rejeição"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResolveDisputeModal({
  favor, onSubmit, onClose, loading,
}: {
  favor: "client" | "provider";
  onSubmit: (resolution: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [resolution, setResolution] = useState("");
  const label = favor === "client" ? "cliente" : "prestador";
  const color = favor === "client" ? "#1D9E75" : "#EF9F27";

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
      zIndex:250, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#131b27", border:"1px solid #1a2535",
        borderRadius:20, padding:28, maxWidth:460, width:"100%" }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:"#e2e8f0", marginBottom:8 }}>
          Resolver a favor do {label}
        </h2>
        <p style={{ fontSize:13, color:"#4a6a6a", marginBottom:16, lineHeight:1.5 }}>
          {favor === "client"
            ? "O serviço será marcado como reembolsado. Se o pagamento já estava confirmado, procede ao reembolso manual ao cliente."
            : "O serviço será marcado como concluído e, se aplicável, o pagamento avança para transferências pendentes."}
        </p>
        <textarea value={resolution} onChange={e => setResolution(e.target.value)}
          style={{ width:"100%", minHeight:90, padding:12, borderRadius:10,
            background:"#0d1117", border:"1px solid #1a2535", color:"#e2e8f0",
            fontSize:13, resize:"none", outline:"none", fontFamily:"inherit" }}
          placeholder="Explica a decisão para ambas as partes..." />
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:10,
            background:"#1a2535", color:"#8a9ab0", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
            Cancelar
          </button>
          <button disabled={!resolution.trim() || loading} onClick={() => onSubmit(resolution)}
            style={{ flex:1, padding:12, borderRadius:10, border:"none",
              background: resolution.trim() ? color : "#2a2a2a",
              color: resolution.trim() ? "white" : "#5a5a5a",
              cursor: resolution.trim() ? "pointer" : "not-allowed",
              fontFamily:"inherit", fontWeight:700 }}>
            {loading ? "A resolver..." : `Confirmar a favor do ${label}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentRowCard({
  row, tab, onConfirm, onReject, onMarkPayout, onViewProof, actionLoading,
}: {
  row: AdminPaymentRow;
  tab: TabKey;
  onConfirm: () => void;
  onReject: () => void;
  onMarkPayout: () => void;
  onViewProof: () => void;
  actionLoading: string | null;
}) {
  return (
    <div style={{ background:"#131b27", border:"1px solid #1a2535", borderRadius:16, padding:20 }}>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div style={{ background:"#0d1117", borderRadius:10, padding:"10px 14px" }}>
          <p style={{ fontSize:10, color:"#4a6a6a", display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
            <User size={11} /> CLIENTE
          </p>
          <p style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{row.client.fullName}</p>
          <p style={{ fontSize:11, color:"#6a7a8a" }}>{row.client.phone}</p>
        </div>
        <div style={{ background:"#0d1117", borderRadius:10, padding:"10px 14px" }}>
          <p style={{ fontSize:10, color:"#4a6a6a", display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
            <Building2 size={11} /> PRESTADOR
          </p>
          <p style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{row.provider.fullName}</p>
        </div>
      </div>

      <p style={{ fontSize:13, color:"#8a9ab0", marginBottom:14 }}>
        Serviço: <span style={{ color:"#c0d0e0", fontWeight:600 }}>{row.serviceTitle}</span>
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[
          { l:"Valor bruto", v: fKz(row.amount), c:"#c0d0e0" },
          { l:`Comissão (${row.commissionPercentageUsed}%)`, v:`-${fKz(row.platformFee)}`, c:"#E24B4A" },
          { l:"Valor líquido", v: fKz(row.providerAmount), c:"#1D9E75" },
        ].map((x, i) => (
          <div key={i} style={{ background:"#0d1117", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
            <p style={{ fontSize:9, color:"#4a6a6a", marginBottom:3 }}>{x.l}</p>
            <p style={{ fontSize:13, fontWeight:700, color:x.c }}>{x.v}</p>
          </div>
        ))}
      </div>

      {tab === "pending-payouts" && row.providerBankAccount && (
        <div style={{ background:"#8B5CF610", border:"1px solid #8B5CF630", borderRadius:12, padding:14, marginBottom:16 }}>
          <p style={{ fontSize:11, color:"#8B5CF6", fontWeight:700, display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <Landmark size={13} /> DADOS BANCÁRIOS DO PRESTADOR
          </p>
          {[
            { l:"Banco", v: row.providerBankAccount.bankName },
            { l:"Titular", v: row.providerBankAccount.accountHolder },
            { l:"IBAN", v: row.providerBankAccount.iban },
          ].map((x, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
              <span style={{ fontSize:11, color:"#6a7a8a" }}>{x.l}</span>
              <span style={{ fontSize:12, fontWeight:700, color:"#c0a8f0", fontFamily: x.l === "IBAN" ? "monospace" : "inherit" }}>{x.v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "pending-payouts" && !row.providerBankAccount && (
        <div style={{ background:"#E24B4A15", border:"1px solid #E24B4A30", borderRadius:12, padding:12, marginBottom:16,
          display:"flex", alignItems:"center", gap:8 }}>
          <AlertTriangle size={14} style={{ color:"#E24B4A" }} />
          <p style={{ fontSize:12, color:"#E24B4A" }}>Prestador ainda não configurou dados bancários.</p>
        </div>
      )}

      {row.latestProof && (
        <button onClick={onViewProof} style={{ display:"flex", alignItems:"center", gap:8,
          padding:"10px 14px", borderRadius:10, background:"#378ADD15", border:"1px solid #378ADD30",
          color:"#378ADD", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
          width:"100%", marginBottom:14 }}>
          <Eye size={14} /> Ver comprovativo · enviado {fDate(row.latestProof.createdAt)}
        </button>
      )}

      {tab === "pending-proofs" && (
        <div style={{ display:"flex", gap:8 }}>
          <button
            disabled={actionLoading === row.id}
            onClick={onConfirm}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              padding:"11px 16px", borderRadius:10, border:"none",
              background:"linear-gradient(135deg,#1D9E75,#16876a)", color:"white",
              fontSize:13, fontWeight:700, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
            {actionLoading === `confirm-${row.id}` ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
            Confirmar pagamento
          </button>
          <button
            disabled={actionLoading === row.id}
            onClick={onReject}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              padding:"11px 16px", borderRadius:10, border:"1px solid #E24B4A40",
              background:"#E24B4A15", color:"#E24B4A",
              fontSize:13, fontWeight:600, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
            <X size={13} /> Rejeitar
          </button>
        </div>
      )}

      {tab === "confirmed" && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
          background:"#1D9E7510", borderRadius:10, fontSize:12, color:"#1D9E75" }}>
          <Clock size={13} /> Confirmado em {row.confirmedAt ? fDate(row.confirmedAt) : "—"} — serviço em curso.
        </div>
      )}

      {tab === "pending-payouts" && (
        <button
          disabled={actionLoading === `payout-${row.id}`}
          onClick={onMarkPayout}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            padding:"12px 16px", borderRadius:10, border:"none",
            background:"linear-gradient(135deg,#8B5CF6,#7C3AED)", color:"white",
            fontSize:14, fontWeight:700, cursor: actionLoading ? "not-allowed" : "pointer",
            fontFamily:"inherit", boxShadow:"0 4px 14px rgba(139,92,246,0.3)" }}>
          {actionLoading === `payout-${row.id}` ? <Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} /> : <TrendingUp size={15} />}
          {actionLoading === `payout-${row.id}` ? "A processar..." : "Transferência realizada"}
        </button>
      )}
    </div>
  );
}

function DisputedServiceCard({
  item, onResolveClient, onResolveProvider, onViewProof, actionLoading,
}: {
  item: AdminDisputedService;
  onResolveClient: () => void;
  onResolveProvider: () => void;
  onViewProof: () => void;
  actionLoading: string | null;
}) {
  return (
    <div style={{ background:"#131b27", border:"1px solid #D4537E30", borderRadius:16, padding:20 }}>

      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, padding:"8px 12px",
        background:"#D4537E15", borderRadius:10, border:"1px solid #D4537E30" }}>
        <Scale size={15} style={{ color:"#D4537E" }} />
        <p style={{ fontSize:12, color:"#D4537E", fontWeight:700 }}>Em disputa</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
        <div style={{ background:"#0d1117", borderRadius:10, padding:"10px 14px" }}>
          <p style={{ fontSize:10, color:"#4a6a6a", display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
            <User size={11} /> CLIENTE
          </p>
          <p style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{item.client.fullName}</p>
          <p style={{ fontSize:11, color:"#6a7a8a" }}>{item.client.phone}</p>
        </div>
        <div style={{ background:"#0d1117", borderRadius:10, padding:"10px 14px" }}>
          <p style={{ fontSize:10, color:"#4a6a6a", display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
            <Building2 size={11} /> PRESTADOR
          </p>
          <p style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>{item.provider.fullName}</p>
        </div>
      </div>

      <p style={{ fontSize:13, color:"#8a9ab0", marginBottom:8 }}>
        Serviço: <span style={{ color:"#c0d0e0", fontWeight:600 }}>{item.serviceTitle}</span>
      </p>

      <div style={{ background:"#0d1117", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
        <p style={{ fontSize:10, color:"#4a6a6a", marginBottom:4 }}>MOTIVO DA DISPUTA</p>
        <p style={{ fontSize:13, color:"#c0d0e0", lineHeight:1.5 }}>{item.disputeReason}</p>
      </div>

      {item.payment && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
          {[
            { l:"Valor bruto", v: fKz(item.payment.amount), c:"#c0d0e0" },
            { l:`Comissão (${item.payment.commissionPercentageUsed}%)`, v:`-${fKz(item.payment.platformFee)}`, c:"#E24B4A" },
            { l:"Valor líquido", v: fKz(item.payment.providerAmount), c:"#1D9E75" },
          ].map((x, i) => (
            <div key={i} style={{ background:"#0d1117", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
              <p style={{ fontSize:9, color:"#4a6a6a", marginBottom:3 }}>{x.l}</p>
              <p style={{ fontSize:12, fontWeight:700, color:x.c }}>{x.v}</p>
            </div>
          ))}
        </div>
      )}

      {item.latestProof && (
        <button onClick={onViewProof} style={{ display:"flex", alignItems:"center", gap:8,
          padding:"10px 14px", borderRadius:10, background:"#378ADD15", border:"1px solid #378ADD30",
          color:"#378ADD", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
          width:"100%", marginBottom:14 }}>
          <Eye size={14} /> Ver comprovativo do pagamento
        </button>
      )}

      {item.providerBankAccount && (
        <div style={{ background:"#8B5CF610", border:"1px solid #8B5CF630", borderRadius:12, padding:14, marginBottom:14 }}>
          <p style={{ fontSize:11, color:"#8B5CF6", fontWeight:700, display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
            <Landmark size={13} /> DADOS BANCÁRIOS DO PRESTADOR
          </p>
          {[
            { l:"Banco", v: item.providerBankAccount.bankName },
            { l:"Titular", v: item.providerBankAccount.accountHolder },
            { l:"IBAN", v: item.providerBankAccount.iban },
          ].map((x, i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0" }}>
              <span style={{ fontSize:11, color:"#6a7a8a" }}>{x.l}</span>
              <span style={{ fontSize:12, fontWeight:700, color:"#c0a8f0", fontFamily: x.l === "IBAN" ? "monospace" : "inherit" }}>{x.v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:8 }}>
        <button
          disabled={actionLoading === `client-${item.serviceId}`}
          onClick={onResolveClient}
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            padding:"11px 16px", borderRadius:10, border:"none",
            background:"linear-gradient(135deg,#1D9E75,#16876a)", color:"white",
            fontSize:13, fontWeight:700, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
          {actionLoading === `client-${item.serviceId}` ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
          A favor do cliente
        </button>
        <button
          disabled={actionLoading === `provider-${item.serviceId}`}
          onClick={onResolveProvider}
          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            padding:"11px 16px", borderRadius:10, border:"none",
            background:"linear-gradient(135deg,#EF9F27,#d4870a)", color:"#0d1117",
            fontSize:13, fontWeight:700, cursor: actionLoading ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
          {actionLoading === `provider-${item.serviceId}` ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }} /> : <CheckCircle size={13} />}
          A favor do prestador
        </button>
      </div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [tab, setTab]         = useState<TabKey>("pending-proofs");
  const [rows, setRows]       = useState<AdminPaymentRow[]>([]);
  const [disputed, setDisputed] = useState<AdminDisputedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<{ proofId: string; fileType: string } | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [resolvingDispute, setResolvingDispute] = useState<{ serviceId: string; favor: "client" | "provider" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "disputed") {
        const data = await adminPaymentsApi.listDisputedServices();
        setDisputed(data);
      } else {
        let data: AdminPaymentRow[] = [];
        if (tab === "pending-proofs") data = await adminPaymentsApi.listPendingProofs();
        else if (tab === "confirmed") data = await adminPaymentsApi.listConfirmedPayments();
        else data = await adminPaymentsApi.listPendingPayouts();
        setRows(data);
      }
    } catch (e: any) {
      alert(e.message || "Erro ao carregar pagamentos.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleConfirm = async (id: string) => {
    setActionLoading(`confirm-${id}`);
    try {
      await adminPaymentsApi.confirmProof(id);
      await load();
    } catch (e: any) {
      alert(e.message || "Erro ao confirmar pagamento.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectingId) return;
    setActionLoading(`confirm-${rejectingId}`);
    try {
      await adminPaymentsApi.rejectProof(rejectingId, reason);
      setRejectingId(null);
      await load();
    } catch (e: any) {
      alert(e.message || "Erro ao rejeitar comprovativo.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPayout = async (id: string) => {
    if (!confirm("Confirmas que já fizeste a transferência real para o prestador?")) return;
    setActionLoading(`payout-${id}`);
    try {
      await adminPaymentsApi.markPayoutDone(id);
      await load();
    } catch (e: any) {
      alert(e.message || "Erro ao marcar transferência.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveDispute = async (resolution: string) => {
    if (!resolvingDispute) return;
    const { serviceId, favor } = resolvingDispute;
    setActionLoading(`${favor}-${serviceId}`);
    try {
      if (favor === "client") {
        await adminPaymentsApi.resolveDisputeForClient(serviceId, resolution);
      } else {
        await adminPaymentsApi.resolveDisputeForProvider(serviceId, resolution);
      }
      setResolvingDispute(null);
      await load();
    } catch (e: any) {
      alert(e.message || "Erro ao resolver disputa.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ap-wrap { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; max-width: 900px; width: 100%; }
        .ap-tabs { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
        .ap-tab  { padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
                   cursor: pointer; white-space: nowrap; border: 1px solid #1a2535;
                   background: #131b27; color: #6a7a8a; transition: all .15s; font-family: inherit; }
        .ap-tab.on { background: #378ADD; border-color: #378ADD; color: white; }
        .ap-tab.disputed-on { background: #D4537E; border-color: #D4537E; color: white; }
        .ap-grid { display: flex; flex-direction: column; gap: 14px; }
        @media(max-width:640px) { .ap-wrap { padding: 20px 16px; } }
      `}</style>

      <div className="ap-wrap">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:"#e2e8f0", marginBottom:4 }}>Pagamentos</h1>
            <p style={{ fontSize:13, color:"#4a6a6a" }}>
              {loading ? "A carregar..." : tab === "disputed"
                ? `${disputed.length} registo${disputed.length !== 1 ? "s" : ""}`
                : `${rows.length} registo${rows.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button onClick={load} disabled={loading}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:12,
              border:"1px solid #1a2535", background:"#131b27", color:"#6a7a8a", fontSize:13,
              cursor:"pointer", fontFamily:"inherit" }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Actualizar
          </button>
        </div>

        <div className="ap-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`ap-tab${tab === t.key ? (t.key === "disputed" ? " disputed-on" : " on") : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize:12, color:"#4a6a6a", marginTop:-8 }}>
          {TABS.find(t => t.key === tab)?.desc}
        </p>

        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 20px" }}>
            <Loader2 size={28} style={{ color:"#378ADD", animation:"spin 1s linear infinite" }} />
          </div>
        ) : tab === "disputed" ? (
          disputed.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
              padding:"80px 20px", gap:14, textAlign:"center", background:"#131b27",
              border:"1px solid #1a2535", borderRadius:16 }}>
              <Scale size={32} style={{ color:"#2a3a4a" }} />
              <p style={{ fontSize:15, fontWeight:700, color:"#c0d0e0" }}>Sem disputas abertas</p>
              <p style={{ fontSize:13, color:"#4a6a6a" }}>Disputas reportadas por clientes ou prestadores aparecem aqui.</p>
            </div>
          ) : (
            <div className="ap-grid">
              {disputed.map(item => (
                <DisputedServiceCard
                  key={item.serviceId}
                  item={item}
                  actionLoading={actionLoading}
                  onResolveClient={() => setResolvingDispute({ serviceId: item.serviceId, favor: "client" })}
                  onResolveProvider={() => setResolvingDispute({ serviceId: item.serviceId, favor: "provider" })}
                  onViewProof={() => item.latestProof && setViewingProof({ proofId: item.latestProof.id, fileType: item.latestProof.fileType })}
                />
              ))}
            </div>
          )
        ) : rows.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            padding:"80px 20px", gap:14, textAlign:"center", background:"#131b27",
            border:"1px solid #1a2535", borderRadius:16 }}>
            <FileText size={32} style={{ color:"#2a3a4a" }} />
            <p style={{ fontSize:15, fontWeight:700, color:"#c0d0e0" }}>Nada por aqui</p>
            <p style={{ fontSize:13, color:"#4a6a6a" }}>Não há registos nesta categoria de momento.</p>
          </div>
        ) : (
          <div className="ap-grid">
            {rows.map(row => (
              <PaymentRowCard
                key={row.id}
                row={row}
                tab={tab}
                actionLoading={actionLoading}
                onConfirm={() => handleConfirm(row.id)}
                onReject={() => setRejectingId(row.id)}
                onMarkPayout={() => handleMarkPayout(row.id)}
                onViewProof={() => row.latestProof && setViewingProof({ proofId: row.latestProof.id, fileType: row.latestProof.fileType })}
              />
            ))}
          </div>
        )}
      </div>

      {viewingProof && (
        <ProofViewerModal
          proofId={viewingProof.proofId}
          fileType={viewingProof.fileType}
          onClose={() => setViewingProof(null)}
        />
      )}
      {rejectingId && (
        <RejectProofModal
          loading={actionLoading === `confirm-${rejectingId}`}
          onClose={() => setRejectingId(null)}
          onSubmit={handleReject}
        />
      )}
      {resolvingDispute && (
        <ResolveDisputeModal
          favor={resolvingDispute.favor}
          loading={actionLoading === `${resolvingDispute.favor}-${resolvingDispute.serviceId}`}
          onClose={() => setResolvingDispute(null)}
          onSubmit={handleResolveDispute}
        />
      )}
    </>
  );
}
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { servicesApi } from "@/lib/services.api";
import {
  Landmark, RefreshCw, Loader2, CheckCircle,
  Clock, X, ChevronRight, Wallet as WalletIcon,
} from "lucide-react";

const PAYMENT_STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:          { label: "Aguarda transferência",     color: "#B45309" },
  proof_submitted:  { label: "Comprovativo em validação",  color: "#2563EB" },
  confirmed:        { label: "Protegido",                  color: "#0E7A5F" },
  pending_payout:   { label: "A transferir ao prestador",  color: "#7C3AED" },
  completed:        { label: "Concluído",                  color: "#0E7A5F" },
  refunded:         { label: "Reembolsado",                color: "#DC2626" },
};

function fKz(v: number) { return new Intl.NumberFormat("pt-PT").format(v) + " Kz"; }
function fDate(d: string) {
  return new Date(d).toLocaleDateString("pt-PT") + " · " +
    new Date(d).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

// ── Nota de arquitectura ─────────────────────────────────────────────────
// Esta página deixou de ser uma "Wallet" com saldo/depósito — nesse
// modelo o dinheiro nunca fica guardado numa carteira do cliente, cada
// serviço tem a sua própria transferência bancária directa para a conta
// da Mestroo. Esta página passa a mostrar o HISTÓRICO de pagamentos que
// o cliente já fez, ligados a cada serviço, sem nenhum saldo fictício.
export default function ClientPaymentsHistoryPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const all = await servicesApi.getMyServices();
      // Só mostra serviços que já têm (ou já tiveram) algum pagamento
      // associado — ou seja, chegaram pelo menos a "accepted"
      const withPaymentRelevance = all.filter((s: any) =>
        !["requested", "rejected"].includes(s.status)
      );
      setServices(withPaymentRelevance);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const totalPaid = services
    .filter(s => ["completed"].includes(s.status))
    .reduce((sum, s) => sum + Number(s.agreedPrice ?? s.budget ?? 0), 0);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .wl-wrap  { display: flex; min-height: 100vh; background: #F8FAFC; }
        .wl-main  { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .wl-body  { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; max-width: 820px; width: 100%; }

        .wl-hero {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0E7A5F 0%, #0A5F4A 55%, #164E63 100%);
          border: 1px solid rgba(14,122,95,0.25);
          border-radius: 20px;
          padding: 28px 32px;
          box-shadow: 0 14px 32px rgba(14,122,95,0.22);
        }
        .wl-hero-glow {
          position: absolute;
          top: -60px;
          right: -40px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(217,119,6,0.30), transparent 70%);
          pointer-events: none;
        }

        .wl-card  { background: #FFFFFF; border: 1px solid #ECE9DF; border-radius: 18px; padding: 20px; cursor: pointer; transition: border-color .15s, box-shadow .15s, transform .15s; }
        .wl-card:hover { border-color: #0E7A5F50; box-shadow: 0 10px 24px rgba(15,23,42,0.08); transform: translateY(-2px); }
        @media(max-width:1024px) {  .wl-body { padding: 80px 20px 24px; } }
        @media(max-width:640px)  { .wl-body { padding: 70px 12px 20px; gap: 14px; } .wl-hero { padding: 20px; } }
      `}</style>

      <div className="wl-wrap">
        <div className="wl-main">
          <div className="wl-body">

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:700, color:"#1F2A28", marginBottom:3 }}>Pagamentos</h1>
                <p style={{ fontSize:13, color:"#6B7770" }}>Histórico de transferências para serviços contratados</p>
              </div>
              <button onClick={handleRefresh} disabled={loading}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
                         borderRadius:12, border:"1px solid #ECE9DF", background:"#FFFFFF",
                         color:"#475569", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
                <RefreshCw size={13} style={{ animation: loading||refreshing ? "spin 1s linear infinite" : "none" }} />
                Actualizar
              </button>
            </div>

            <div className="wl-hero">
              <div className="wl-hero-glow" />
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, color: "#7EF0C4",
                  textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <WalletIcon size={13} />
                  Total pago em serviços concluídos
                </p>
                {loading
                  ? <div style={{ width: 200, height: 38, borderRadius: 8, background: "rgba(255,255,255,0.18)" }} />
                  : <p style={{ fontSize: 36, fontWeight: 800, color: "#FFFFFF" }}>{fKz(totalPaid)}</p>
                }
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", marginTop: 12, maxWidth: 440 }}>
                  Todos os pagamentos são feitos por transferência bancária directa e ficam protegidos até confirmares a conclusão do serviço.
                </p>
              </div>
            </div>

            {loading ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 20px" }}>
                <Loader2 size={26} style={{ color:"#0E7A5F", animation:"spin 1s linear infinite" }} />
              </div>
            ) : services.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                padding:"60px 20px", gap:14, textAlign:"center", background:"#FFFFFF",
                border:"1px solid #ECE9DF", borderRadius:16 }}>
                <WalletIcon size={30} style={{ color:"#CBD5E1" }} />
                <p style={{ fontSize:15, fontWeight:700, color:"#1F2A28" }}>Sem pagamentos ainda</p>
                <p style={{ fontSize:13, color:"#6B7770" }}>Assim que um prestador aceitar um pedido teu, o pagamento aparece aqui.</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {services.map(s => {
                  const cfg = PAYMENT_STATUS_CFG[s.paymentStatus] ?? { label: "—", color: "#64748B" };
                  return (
                    <div className="wl-card" key={s.id} onClick={() => router.push(`/services/${s.id}`)}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                            <p style={{ fontSize:14, fontWeight:700, color:"#1F2A28" }}>{s.title}</p>
                            <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:99,
                              background:`${cfg.color}18`, color:cfg.color }}>
                              {cfg.label}
                            </span>
                          </div>
                          <p style={{ fontSize:12, color:"#6B7770" }}>
                            {s.provider?.fullName ?? "—"} · {s.category}
                          </p>
                          <p style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fDate(s.createdAt)}</p>
                        </div>
                        <div style={{ textAlign:"right", flexShrink:0 }}>
                          <p style={{ fontSize:16, fontWeight:700, color:"#0E7A5F" }}>
                            {fKz(Number(s.agreedPrice ?? s.budget))}
                          </p>
                          <ChevronRight size={16} style={{ color:"#CBD5E1", marginTop:8 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
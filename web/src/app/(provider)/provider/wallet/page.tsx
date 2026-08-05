"use client";
import { useState, useEffect, useCallback } from "react";
import { walletApi } from "@/lib/api/wallet.api";
import {
  ArrowDownLeft, ArrowUpRight, RefreshCw,
  Loader2, TrendingUp, Landmark,
} from "lucide-react";

const TX_CFG: Record<string, { label: string; color: string; bg: string; plus: boolean }> = {
  deposit:        { label: "Depósito",           color: "#1D9E75", bg: "#e3f5ee", plus: true  },
  withdrawal:     { label: "Levantamento",        color: "#dc2626", bg: "#fef2f2", plus: false },
  escrow_release: { label: "Pagamento recebido",  color: "#1D9E75", bg: "#e3f5ee", plus: true  },
  escrow_refund:  { label: "Reembolso",           color: "#EF9F27", bg: "#fef3e2", plus: true  },
  platform_fee:   { label: "Comissão plataforma", color: "#dc2626", bg: "#fef2f2", plus: false },
};

function fKz(v: number | string) {
  return new Intl.NumberFormat("pt-PT").format(Number(v)) + " Kz";
}

function fDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString("pt-PT") + " · " +
    dt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export default function ProviderWalletPage() {
  const [wallet, setWallet]   = useState<any>(null);
  const [txData, setTxData]   = useState<{ transactions: any[]; total: number }>({ transactions: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [txLoad, setTxLoad]   = useState(false);
  const [page, setPage]       = useState(1);

  const loadWallet = async () => {
    const w = await walletApi.getWallet().catch(() => null);
    if (w) setWallet(w);
  };

  const loadTx = async (p: number) => {
    setTxLoad(true);
    const d = await walletApi.getTransactions(p).catch(() => null);
    if (d) { setTxData(d); setPage(p); }
    setTxLoad(false);
  };

  const init = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadWallet(), loadTx(1)]);
    setLoading(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  const totalPages = Math.ceil(txData.total / 20);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes sk   { 0%,100% { opacity: 1; } 50% { opacity: .4; } }

        .pw-body { padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; max-width: 860px; width: 100%; }

        /* ── Hero balance — verde-esmeralda escuro ── */
        .pw-hero {
          background: linear-gradient(135deg, #0d6e52 0%, #0a5740 100%);
          border: 1px solid #0a5740;
          border-radius: 20px; padding: 28px 32px;
        }
        .pw-bal-label {
          font-size: 11px; font-weight: 700; color: #6ee7c7;
          text-transform: uppercase; letter-spacing: .1em; margin-bottom: 8px;
        }
        .pw-bal {
          font-size: 40px; font-weight: 800; color: #ffffff;
          line-height: 1; letter-spacing: -.02em;
        }
        .pw-sub {
          display: flex; gap: 28px; margin-top: 18px; padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,0.15); flex-wrap: wrap;
        }
        .pw-sub-item label { display: block; font-size: 11px; color: rgba(255,255,255,0.55); margin-bottom: 3px; }
        .pw-sub-item span  { font-size: 16px; font-weight: 700; color: #ffffff; }

        /* ── Cards brancos ── */
        .pw-card {
          background: #ffffff; border: 1px solid #eef1f5;
          border-radius: 18px; padding: 24px;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
        }

        /* ── Info row ── */
        .pw-info-row { display: flex; align-items: flex-start; gap: 12px; }
        .pw-info-ico {
          width: 38px; height: 38px; border-radius: 10px;
          background: #ede9fe;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        /* ── Transaction list ── */
        .tx-list { display: flex; flex-direction: column; }
        .tx-row  {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 0; border-bottom: 1px solid #f1f5f9;
        }
        .tx-row:last-child { border-bottom: none; }
        .tx-ico  {
          width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .tx-info { flex: 1; min-width: 0; }
        .tx-name {
          font-size: 13px; font-weight: 600; color: #0f172a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .tx-desc { font-size: 11px; color: #64748b; margin-top: 1px; }
        .tx-date { font-size: 10px; color: #94a3b8; margin-top: 2px; }
        .tx-right { text-align: right; flex-shrink: 0; }
        .tx-val  { font-size: 14px; font-weight: 700; }
        .tx-bal  { font-size: 10px; color: #94a3b8; margin-top: 2px; }

        /* ── Pagination ── */
        .pg { display: flex; align-items: center; justify-content: center; gap: 8px; padding-top: 18px; }
        .pg-btn {
          padding: 8px 16px; border-radius: 9px;
          background: #f8fafc; border: 1px solid #eef1f5;
          color: #64748b; cursor: pointer; font-family: inherit;
          font-size: 13px; transition: all .15s;
        }
        .pg-btn:hover:not(:disabled) { border-color: #1D9E75; color: #0d6e52; background: #e3f5ee; }
        .pg-btn:disabled { opacity: .4; cursor: not-allowed; }

        /* ── Botão Actualizar ── */
        .pw-refresh {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 12px;
          border: 1px solid #eef1f5; background: #ffffff;
          color: #64748b; font-size: 13px; cursor: pointer;
          font-family: inherit; transition: all .15s;
        }
        .pw-refresh:hover:not(:disabled) { border-color: #1D9E75; color: #0d6e52; background: #e3f5ee; }
        .pw-refresh:disabled { opacity: .6; cursor: not-allowed; }

        /* ── Skeleton ── */
        .sk { background: #e2e8f0; border-radius: 6px; animation: sk 1.5s infinite; display: inline-block; }

        @media (max-width: 640px) {
          .pw-body { padding: 20px 16px; gap: 14px; }
          .pw-hero { padding: 20px; }
          .pw-bal  { font-size: 30px; }
        }
      `}</style>

      <div className="pw-body">

        {/* ── Header ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:3 }}>Wallet</h1>
            <p style={{ fontSize:13, color:"#64748b" }}>Os teus ganhos com a plataforma</p>
          </div>
          <button onClick={init} disabled={loading} className="pw-refresh">
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }}/>
            Actualizar
          </button>
        </div>

        {/* ── Balance hero ── */}
        <div className="pw-hero">
          <p className="pw-bal-label">Saldo disponível</p>
          {loading
            ? <div className="sk" style={{ width:220, height:42 }}/>
            : <p className="pw-bal">{fKz(wallet?.balance ?? 0)}</p>
          }
          <div className="pw-sub">
            <div className="pw-sub-item">
              <label>Total ganho</label>
              <span>{loading ? "..." : fKz(wallet?.totalEarned ?? 0)}</span>
            </div>
            <div className="pw-sub-item">
              <label>Em escrow</label>
              <span>{loading ? "..." : fKz(wallet?.heldBalance ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* ── Nota informativa ── */}
        <div className="pw-card">
          <div className="pw-info-row">
            <div className="pw-info-ico">
              <Landmark size={18} style={{ color:"#8B5CF6" }}/>
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:600, color:"#0f172a", marginBottom:4 }}>
                Como recebes os pagamentos
              </p>
              <p style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>
                Depois de cada serviço confirmado, a administração transfere o valor líquido directamente para a tua conta bancária (já descontada a comissão da plataforma). O saldo aqui é apenas o registo do que já te foi pago.
              </p>
            </div>
          </div>
        </div>

        {/* ── Transacções ── */}
        <div className="pw-card">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <p style={{ fontSize:15, fontWeight:700, color:"#0f172a" }}>Histórico de ganhos</p>
            {txData.total > 0 && (
              <span style={{ fontSize:12, color:"#64748b" }}>{txData.total} transacções</span>
            )}
          </div>

          {txLoad ? (
            <div className="tx-list">
              {[1,2,3].map(i => (
                <div className="tx-row" key={i}>
                  <div className="sk" style={{ width:40, height:40, borderRadius:11 }}/>
                  <div style={{ flex:1 }}>
                    <div className="sk" style={{ width:"55%", height:12, marginBottom:7 }}/>
                    <div className="sk" style={{ width:"35%", height:10 }}/>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div className="sk" style={{ width:80, height:13, marginBottom:6 }}/>
                    <div className="sk" style={{ width:60, height:10 }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : txData.transactions.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ width:56, height:56, borderRadius:16, background:"#f8fafc", border:"1px solid #eef1f5", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                <TrendingUp size={26} style={{ color:"#cbd5e1" }}/>
              </div>
              <p style={{ fontSize:14, fontWeight:600, color:"#334155" }}>Sem transacções ainda</p>
              <p style={{ fontSize:12, color:"#64748b", marginTop:4 }}>
                Os teus ganhos aparecem aqui após cada serviço concluído.
              </p>
            </div>
          ) : (
            <>
              <div className="tx-list">
                {txData.transactions.map(tx => {
                  const cfg = TX_CFG[tx.type] ?? { label: tx.type, color:"#64748b", bg:"#f1f5f9", plus: true };
                  return (
                    <div className="tx-row" key={tx.id}>
                      <div className="tx-ico" style={{ background: cfg.bg, border:`1px solid ${cfg.color}30` }}>
                        {cfg.plus
                          ? <ArrowDownLeft size={16} style={{ color: cfg.color }}/>
                          : <ArrowUpRight  size={16} style={{ color: cfg.color }}/>
                        }
                      </div>
                      <div className="tx-info">
                        <div className="tx-name">{cfg.label}</div>
                        <div className="tx-desc">{tx.description}</div>
                        <div className="tx-date">{fDate(tx.createdAt)}</div>
                      </div>
                      <div className="tx-right">
                        <div className="tx-val" style={{ color: cfg.color }}>
                          {cfg.plus ? "+" : "-"}{fKz(Math.abs(Number(tx.amount)))}
                        </div>
                        <div className="tx-bal">Saldo: {fKz(tx.balanceAfter)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="pg">
                  <button className="pg-btn" disabled={page<=1} onClick={() => loadTx(page-1)}>← Anterior</button>
                  <span style={{ fontSize:12, color:"#64748b", padding:"0 6px" }}>{page} / {totalPages}</span>
                  <button className="pg-btn" disabled={page>=totalPages} onClick={() => loadTx(page+1)}>Seguinte →</button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </>
  );
}
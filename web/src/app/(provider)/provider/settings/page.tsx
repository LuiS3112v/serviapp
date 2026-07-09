"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Globe, Moon, LogOut, ChevronRight, FileText, Lock,
  Landmark, Loader2, Check, AlertCircle, X,
} from "lucide-react";
import { clearAllSessions } from "@/lib/auth.api";
import { bankAccountsApi, ProviderBankAccount } from "@/lib/api/bank-accounts.api";

const groups = [
  { title:"Conta", items:[
    { icon:Shield, label:"Segurança e senha", desc:"Altera a tua senha e activa 2FA", color:"#1D9E75", href:"/security", clickable:true },
  ]},
  { title:"Preferências", items:[
    { icon:Globe, label:"Idioma e região", desc:"Português (Angola)", color:"#8B5CF6", href:"", clickable:false },
    { icon:Moon, label:"Aparência", desc:"Modo escuro activo", color:"#D4537E", href:"", clickable:false },
  ]},
  { title:"Legal", items:[
    { icon:FileText, label:"Termos de Serviço", desc:"Regras e condições da plataforma", color:"#4a7a7a", href:"/provider/terms", clickable:true },
    { icon:Lock, label:"Política de Privacidade", desc:"Como usamos os teus dados", color:"#4a6a9a", href:"/provider/privacy", clickable:true },
  ]},
];

// ── Secção: Dados bancários ─────────────────────────────────────────────────
// Só o próprio prestador vê e edita esta secção. Estes dados nunca são
// expostos ao cliente em nenhum endpoint — só ao próprio prestador (aqui)
// e ao administrador, na área /admin/payments, para poder transferir o
// valor líquido de cada serviço concluído.
function BankAccountSection() {
  const [account, setAccount]   = useState<ProviderBankAccount | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  const [bankName, setBankName]           = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [iban, setIban]                   = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await bankAccountsApi.getMyProviderAccount();
      setAccount(data);
      if (data) {
        setBankName(data.bankName);
        setAccountHolder(data.accountHolder);
        setIban(data.iban);
        setAccountNumber(data.accountNumber ?? "");
      }
    } catch {
      // Se ainda não existir conta, o endpoint devolve null — não é erro
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const canSave = bankName.trim() && accountHolder.trim() && iban.trim();

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const saved = await bankAccountsApi.upsertMyProviderAccount({
        bankName: bankName.trim(),
        accountHolder: accountHolder.trim(),
        iban: iban.trim(),
        accountNumber: accountNumber.trim() || undefined,
      });
      setAccount(saved);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "Erro ao guardar dados bancários.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (account) {
      setBankName(account.bankName);
      setAccountHolder(account.accountHolder);
      setIban(account.iban);
      setAccountNumber(account.accountNumber ?? "");
    } else {
      setBankName(""); setAccountHolder(""); setIban(""); setAccountNumber("");
    }
    setEditing(false);
    setError("");
  };

  return (
    <div>
      <p style={{ fontSize:11, fontWeight:600, color:"#3a4a5a", textTransform:"uppercase",
        letterSpacing:"0.08em", marginBottom:8 }}>
        Financeiro
      </p>
      <div className="set-group">
        <div style={{ padding:"18px 20px" }}>

          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom: editing || loading ? 18 : (account ? 18 : 4) }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"#8B5CF615",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Landmark size={18} style={{ color:"#8B5CF6" }} />
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:14, fontWeight:600, color:"#c0d0e0", marginBottom:2 }}>
                Dados bancários
              </p>
              <p style={{ fontSize:12, color:"#4a5a6a" }}>
                Usado pela administração para te transferir os pagamentos. Nunca visível a clientes.
              </p>
            </div>
            {!loading && !editing && (
              <button
                onClick={() => setEditing(true)}
                style={{ padding:"7px 14px", borderRadius:9, border:"1px solid #1a2535",
                  background:"#0d1117", color:"#8a9ab0", fontSize:12, fontWeight:600,
                  cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                {account ? "Editar" : "Configurar"}
              </button>
            )}
          </div>

          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0" }}>
              <Loader2 size={14} style={{ color:"#4a6a6a", animation:"spin 1s linear infinite" }} />
              <span style={{ fontSize:12, color:"#4a6a6a" }}>A carregar...</span>
            </div>
          )}

          {!loading && !editing && account && (
            <div style={{ background:"#0d1117", borderRadius:10, padding:14 }}>
              {[
                { l:"Banco", v: account.bankName },
                { l:"Titular", v: account.accountHolder },
                { l:"IBAN", v: account.iban, mono:true },
                ...(account.accountNumber ? [{ l:"Nº de conta", v: account.accountNumber, mono:true }] : []),
              ].map((x, i, arr) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid #1a2535" : "none" }}>
                  <span style={{ fontSize:12, color:"#4a6a6a" }}>{x.l}</span>
                  <span style={{ fontSize:13, color:"#c0d0e0", fontWeight:600, fontFamily: x.mono ? "monospace" : "inherit" }}>{x.v}</span>
                </div>
              ))}
            </div>
          )}

          {!loading && !editing && !account && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
              background:"#EF9F2710", border:"1px solid #EF9F2730", borderRadius:10 }}>
              <AlertCircle size={16} style={{ color:"#EF9F27", flexShrink:0 }} />
              <p style={{ fontSize:12, color:"#d4b578", lineHeight:1.5 }}>
                Ainda não configuraste os teus dados bancários. Sem isto, a administração não consegue transferir-te os pagamentos.
              </p>
            </div>
          )}

          {editing && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"#6a7a8a", display:"block", marginBottom:5 }}>Banco</label>
                <input value={bankName} onChange={e => setBankName(e.target.value)}
                  placeholder="Ex: BAI, BFA, BIC, Atlântico"
                  style={{ width:"100%", padding:"10px 13px", borderRadius:10, background:"#0d1117",
                    border:"1px solid #1a2535", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:"inherit" }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"#6a7a8a", display:"block", marginBottom:5 }}>Titular da conta</label>
                <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)}
                  placeholder="Nome completo como está no banco"
                  style={{ width:"100%", padding:"10px 13px", borderRadius:10, background:"#0d1117",
                    border:"1px solid #1a2535", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:"inherit" }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"#6a7a8a", display:"block", marginBottom:5 }}>IBAN</label>
                <input value={iban} onChange={e => setIban(e.target.value)}
                  placeholder="AO06 0000 0000 0000 0000 0000 0"
                  style={{ width:"100%", padding:"10px 13px", borderRadius:10, background:"#0d1117",
                    border:"1px solid #1a2535", color:"#e2e8f0", fontSize:13, outline:"none",
                    fontFamily:"monospace" }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"#6a7a8a", display:"block", marginBottom:5 }}>Nº de conta (opcional)</label>
                <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                  placeholder="Se aplicável"
                  style={{ width:"100%", padding:"10px 13px", borderRadius:10, background:"#0d1117",
                    border:"1px solid #1a2535", color:"#e2e8f0", fontSize:13, outline:"none", fontFamily:"monospace" }} />
              </div>

              {error && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
                  background:"#E24B4A15", border:"1px solid #E24B4A30", borderRadius:9 }}>
                  <AlertCircle size={13} style={{ color:"#E24B4A", flexShrink:0 }} />
                  <span style={{ fontSize:12, color:"#E24B4A" }}>{error}</span>
                </div>
              )}

              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <button onClick={handleCancel} disabled={saving}
                  style={{ flex:1, padding:11, borderRadius:10, border:"1px solid #1a2535",
                    background:"#0d1117", color:"#8a9ab0", fontSize:13, fontWeight:600,
                    cursor: saving ? "not-allowed" : "pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <X size={14} /> Cancelar
                </button>
                <button onClick={handleSave} disabled={!canSave || saving}
                  style={{ flex:1, padding:11, borderRadius:10, border:"none",
                    background: canSave ? "linear-gradient(135deg,#1D9E75,#16876a)" : "#1a2535",
                    color: canSave ? "white" : "#4a5a6a",
                    fontSize:13, fontWeight:700, cursor: canSave && !saving ? "pointer" : "not-allowed",
                    fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  {saving ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> : <Check size={14} />}
                  {saving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {success && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", marginTop:12,
              background:"#1D9E7515", border:"1px solid #1D9E7530", borderRadius:9 }}>
              <Check size={13} style={{ color:"#1D9E75", flexShrink:0 }} />
              <span style={{ fontSize:12, color:"#1D9E75" }}>Dados bancários guardados com sucesso.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function ProviderSettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    clearAllSessions();
    router.push("/");
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .pset-inner{padding:28px 32px;display:flex;flex-direction:column;gap:24px;max-width:680px}
        .set-group{background:#131b27;border:1px solid #1a2535;border-radius:16px;overflow:hidden}
        .set-item{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid #1a2535;width:100%;background:none;border-left:none;border-right:none;border-top:none;text-align:left}
        .set-item:last-child{border-bottom:none}
        .set-item.clickable{cursor:pointer;transition:background 0.15s}
        .set-item.clickable:hover{background:#0d1520}
        .set-item.disabled{cursor:default;opacity:0.45}
        @media(max-width:640px){.pset-inner{padding:16px}}
      `}</style>
      <div className="pset-inner">
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>Definições</h1>
          <p style={{fontSize:13,color:"#4a6a6a"}}>Gere a tua conta e preferências</p>
        </div>

        {groups.map((group,gi)=>(
          <div key={gi}>
            <p style={{fontSize:11,fontWeight:600,color:"#3a4a5a",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{group.title}</p>
            <div className="set-group">
              {groups[gi].items.map((item,ii)=>{
                const Icon=item.icon;
                return (
                  <button
                    className={`set-item ${item.clickable ? "clickable" : "disabled"}`}
                    key={ii}
                    onClick={()=>{ if(item.clickable && item.href) router.push(item.href); }}
                    disabled={!item.clickable}
                  >
                    <div style={{width:40,height:40,borderRadius:12,background:`${item.color}15`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Icon size={18} style={{color:item.color}}/>
                    </div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:14,fontWeight:600,color:"#c0d0e0",marginBottom:2}}>{item.label}</p>
                      <p style={{fontSize:12,color:"#4a5a6a"}}>{item.desc}</p>
                    </div>
                    {item.clickable && <ChevronRight size={16} style={{color:"#2a3a4a"}}/>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Nova secção: Dados bancários ── */}
        <BankAccountSection />

        <div className="set-group">
          <button className="set-item clickable" onClick={handleLogout}>
            <div style={{width:40,height:40,borderRadius:12,background:"#E24B4A15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <LogOut size={18} style={{color:"#E24B4A"}}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:14,fontWeight:600,color:"#E24B4A"}}>Terminar sessão</p>
            </div>
          </button>
        </div>
        <p style={{fontSize:12,color:"#2a3a4a",textAlign:"center"}}>Serviapp v1.0.0 · Angola</p>
      </div>
    </>
  );
}
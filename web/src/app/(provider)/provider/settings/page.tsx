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
    { icon:Shield, label:"Segurança e senha", desc:"Altera a tua senha e activa 2FA", color:"#1D9E75", href:"/provider/security", clickable:true },
  ]},
  { title:"Preferências", items:[
    { icon:Globe, label:"Idioma e região", desc:"Português (Angola)", color:"#8B5CF6", href:"", clickable:false },
    { icon:Moon, label:"Aparência", desc:"Modo claro activo", color:"#D4537E", href:"", clickable:false },
  ]},
  { title:"Legal", items:[
    { icon:FileText, label:"Termos de Serviço", desc:"Regras e condições da plataforma", color:"#1D9E75", href:"/provider/terms", clickable:true },
    { icon:Lock, label:"Política de Privacidade", desc:"Como usamos os teus dados", color:"#2563eb", href:"/provider/privacy", clickable:true },
  ]},
];

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
      <p style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase",
        letterSpacing:"0.08em", marginBottom:8 }}>
        Financeiro
      </p>
      <div className="set-group">
        <div style={{ padding:"18px 20px" }}>

          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom: editing || loading ? 18 : (account ? 18 : 4) }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"#8B5CF612",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Landmark size={18} style={{ color:"#8B5CF6" }} />
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:14, fontWeight:600, color:"#0f172a", marginBottom:2 }}>
                Dados bancários
              </p>
              <p style={{ fontSize:12, color:"#64748b" }}>
                Usado pela administração para te transferir os pagamentos. Nunca visível a clientes.
              </p>
            </div>
            {!loading && !editing && (
              <button
                onClick={() => setEditing(true)}
                style={{ padding:"7px 14px", borderRadius:9, border:"1px solid #e2e8f0",
                  background:"#f8fafc", color:"#64748b", fontSize:12, fontWeight:600,
                  cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
                  transition:"all 0.15s" }}>
                {account ? "Editar" : "Configurar"}
              </button>
            )}
          </div>

          {loading && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0" }}>
              <Loader2 size={14} style={{ color:"#94a3b8", animation:"spin 1s linear infinite" }} />
              <span style={{ fontSize:12, color:"#94a3b8" }}>A carregar...</span>
            </div>
          )}

          {!loading && !editing && account && (
            <div style={{ background:"#f8fafc", borderRadius:10, padding:14, border:"1px solid #eef1f5" }}>
              {[
                { l:"Banco", v: account.bankName },
                { l:"Titular", v: account.accountHolder },
                { l:"IBAN", v: account.iban, mono:true },
                ...(account.accountNumber ? [{ l:"Nº de conta", v: account.accountNumber, mono:true }] : []),
              ].map((x, i, arr) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid #eef1f5" : "none" }}>
                  <span style={{ fontSize:12, color:"#475569", fontWeight:500 }}>{x.l}</span>
                  <span style={{ fontSize:13, color:"#0f172a", fontWeight:700, fontFamily: x.mono ? "monospace" : "inherit" }}>{x.v}</span>
                </div>
              ))}
            </div>
          )}

          {!loading && !editing && !account && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
              background:"#fffbf0", border:"1px solid #EF9F2730", borderRadius:10 }}>
              <AlertCircle size={16} style={{ color:"#EF9F27", flexShrink:0 }} />
              <p style={{ fontSize:12, color:"#92743a", lineHeight:1.5 }}>
                Ainda não configuraste os teus dados bancários. Sem isto, a administração não consegue transferir-te os pagamentos.
              </p>
            </div>
          )}

          {editing && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { label:"Banco", value:bankName, set:setBankName, placeholder:"Ex: BAI, BFA, BIC, Atlântico", mono:false },
                { label:"Titular da conta", value:accountHolder, set:setAccountHolder, placeholder:"Nome completo como está no banco", mono:false },
                { label:"IBAN", value:iban, set:setIban, placeholder:"AO06 0000 0000 0000 0000 0000 0", mono:true },
                { label:"Nº de conta (opcional)", value:accountNumber, set:setAccountNumber, placeholder:"Se aplicável", mono:true },
              ].map((f, i) => (
                <div key={i}>
                  <label style={{ fontSize:11, fontWeight:600, color:"#475569", display:"block", marginBottom:5 }}>{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width:"100%", padding:"10px 13px", borderRadius:10, background:"#f8fafc",
                      border:"1.5px solid #e2e8f0", color:"#0f172a", fontSize:13, outline:"none",
                      fontFamily: f.mono ? "monospace" : "inherit", transition:"border 0.2s" }} />
                </div>
              ))}

              {error && (
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px",
                  background:"#fef2f2", border:"1px solid #fecaca", borderRadius:9 }}>
                  <AlertCircle size={13} style={{ color:"#dc2626", flexShrink:0 }} />
                  <span style={{ fontSize:12, color:"#dc2626" }}>{error}</span>
                </div>
              )}

              <div style={{ display:"flex", gap:8, marginTop:4 }}>
                <button onClick={handleCancel} disabled={saving}
                  style={{ flex:1, padding:11, borderRadius:10, border:"1px solid #e2e8f0",
                    background:"#f8fafc", color:"#64748b", fontSize:13, fontWeight:600,
                    cursor: saving ? "not-allowed" : "pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <X size={14} /> Cancelar
                </button>
                <button onClick={handleSave} disabled={!canSave || saving}
                  style={{ flex:1, padding:11, borderRadius:10, border:"none",
                    background: canSave ? "#1D9E75" : "#e2e8f0",
                    color: canSave ? "white" : "#94a3b8",
                    fontSize:13, fontWeight:700, cursor: canSave && !saving ? "pointer" : "not-allowed",
                    fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                    boxShadow: canSave ? "0 4px 12px rgba(29,158,117,0.25)" : "none" }}>
                  {saving ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> : <Check size={14} />}
                  {saving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {success && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", marginTop:12,
              background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:9 }}>
              <Check size={13} style={{ color:"#1D9E75", flexShrink:0 }} />
              <span style={{ fontSize:12, color:"#15803d" }}>Dados bancários guardados com sucesso.</span>
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
        .set-group{background:#ffffff;border:1px solid #eef1f5;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.04)}
        .set-item{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid #eef1f5;width:100%;background:none;border-left:none;border-right:none;border-top:none;text-align:left}
        .set-item:last-child{border-bottom:none}
        .set-item.clickable{cursor:pointer;transition:background 0.15s}
        .set-item.clickable:hover{background:#f8fafc}
        .set-item.disabled{cursor:default;opacity:0.45}
        .group-label{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px}
        @media(max-width:640px){.pset-inner{padding:16px}}
      `}</style>
      <div className="pset-inner">
        <div>
          <h1 style={{fontSize:22,fontWeight:700,color:"#0f172a",marginBottom:4}}>Definições</h1>
          <p style={{fontSize:13,color:"#64748b"}}>Gere a tua conta e preferências</p>
        </div>

        {groups.map((group, gi) => (
          <div key={gi}>
            <p className="group-label">{group.title}</p>
            <div className="set-group">
              {group.items.map((item, ii) => {
                const Icon = item.icon;
                return (
                  <button
                    className={`set-item ${item.clickable ? "clickable" : "disabled"}`}
                    key={ii}
                    onClick={() => { if (item.clickable && item.href) router.push(item.href); }}
                    disabled={!item.clickable}
                  >
                    <div style={{width:40,height:40,borderRadius:12,background:`${item.color}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Icon size={18} style={{color:item.color}}/>
                    </div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:14,fontWeight:600,color:"#0f172a",marginBottom:2}}>{item.label}</p>
                      <p style={{fontSize:12,color:"#64748b"}}>{item.desc}</p>
                    </div>
                    {item.clickable && <ChevronRight size={16} style={{color:"#cbd5e1"}}/>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <BankAccountSection />

        <div className="set-group">
          <button className="set-item clickable" onClick={handleLogout}>
            <div style={{width:40,height:40,borderRadius:12,background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <LogOut size={18} style={{color:"#dc2626"}}/>
            </div>
            <div style={{flex:1}}>
              <p style={{fontSize:14,fontWeight:600,color:"#dc2626"}}>Terminar sessão</p>
            </div>
          </button>
        </div>

        <p style={{fontSize:12,color:"#cbd5e1",textAlign:"center"}}>Mestroo v1.0.0 · Angola</p>
      </div>
    </>
  );
}
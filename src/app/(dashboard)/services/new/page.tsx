"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, Clock } from "lucide-react";

const categories = ["Limpeza","Climatização","Canalização","Eletricista","TI & Redes","Jardinagem","Mudanças","Beleza","Automóvel","Pintura","Construção","Segurança"];

export default function NewServicePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", cat: "", desc: "", address: "", date: "", time: "", budget: "" });

  return (
    <>
      <style>{`
        .ns-wrap { display: flex; min-height: 100vh; background: #0d1117; }
        .ns-main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
        .ns-inner { flex: 1; padding: 28px 32px; max-width: 640px; }
        .ns-input { width: 100%; padding: 14px 16px; border-radius: 12px; background: #131b27; border: 1px solid #1a2535; color: #e2e8f0; font-size: 14px; outline: none; transition: border 0.2s; margin-bottom: 16px; }
        .ns-input:focus { border-color: #1D9E75; }
        .ns-input::placeholder { color: #4a5a6a; }
        .cat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin-bottom: 20px; }
        .cat-opt { padding: 10px 6px; border-radius: 10px; font-size: 12px; cursor: pointer; text-align: center; border: 1px solid #1a2535; background: #131b27; color: #6a7a8a; transition: all 0.15s; }
        .cat-opt.sel { border-color: #1D9E75; background: #1d9e7515; color: #1D9E75; }
        .label { font-size: 13px; font-weight: 600; color: #6a7a8a; display: block; margin-bottom: 6px; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .submit-btn { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #1D9E75; color: white; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; }
        @media (max-width: 1024px) { .ns-main { margin-left: 0; } }
        @media (max-width: 640px) { .ns-inner { padding: 16px; } .cat-grid { grid-template-columns: repeat(2,1fr); } .row2 { grid-template-columns: 1fr; } }
      `}</style>
      <div className="ns-wrap">
        <Sidebar />
        <div className="ns-main">
          <Navbar />
          <div className="ns-inner">
            <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a6a6a", background: "none", border: "none", cursor: "pointer", marginBottom: 24 }}>
              <ArrowLeft size={15} /> Voltar
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>Novo pedido de serviço</h1>
            <p style={{ fontSize: 13, color: "#4a6a6a", marginBottom: 28 }}>Descreve o que precisas e encontramos o melhor prestador</p>

            <label className="label">Título do serviço</label>
            <input className="ns-input" placeholder="Ex: Limpeza de apartamento T3" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

            <label className="label">Categoria</label>
            <div className="cat-grid">
              {categories.map((c, i) => (
                <button key={i} className={`cat-opt${form.cat === c ? " sel" : ""}`} onClick={() => setForm({ ...form, cat: c })}>{c}</button>
              ))}
            </div>

            <label className="label">Descrição detalhada</label>
            <textarea className="ns-input" rows={4} placeholder="Descreve o trabalho com o máximo de detalhe possível..." style={{ resize: "none" }} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />

            <label className="label"><MapPin size={13} style={{ display: "inline", marginRight: 4, color: "#1D9E75" }} />Morada</label>
            <input className="ns-input" placeholder="Rua, número, bairro — Luanda" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />

            <div className="row2">
              <div>
                <label className="label"><Calendar size={13} style={{ display: "inline", marginRight: 4, color: "#1D9E75" }} />Data</label>
                <input className="ns-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="label"><Clock size={13} style={{ display: "inline", marginRight: 4, color: "#1D9E75" }} />Hora</label>
                <input className="ns-input" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>

            <label className="label">Orçamento máximo (Kz)</label>
            <input className="ns-input" type="number" placeholder="Ex: 10000" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />

            <button className="submit-btn" onClick={() => router.push("/services")}>Publicar pedido →</button>
          </div>
        </div>
      </div>
    </>
  );
}
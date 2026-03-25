'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, X, Save, Edit2, Trash2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { tipo: 'receita', categoria: '', descricao: '', valor: '', data: '', pago: false, cliente_id: '', processo_id: '', tipo_honorario: '', parceiro_nome: '', parceiro_percentual: '', parceiro_valor: '', parceiro_pago: false }

export default function FinanceiroPage() {
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [processos, setProcessos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showRecibo, setShowRecibo] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [recibo, setRecibo] = useState({ cliente_nome: '', cpf_cnpj: '', valor: '', data: new Date().toISOString().split('T')[0], descricao: '', tipo_pagamento: 'PIX' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: l }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('financeiro').select('*, cliente:clientes(nome), processo:processos(titulo_interno, numero_processo)').order('data', { ascending: false }),
      supabase.from('clientes').select('id,nome,cpf,cnpj').order('nome'),
      supabase.from('processos').select('id,titulo_interno,numero_processo').order('titulo_interno'),
    ])
    setLancamentos(l || [])
    setClientes(c || [])
    setProcessos(p || [])
    setLoading(false)
  }

  const receitas = lancamentos.filter(l => l.tipo === 'receita')
  const previsto = receitas.reduce((s, l) => s + (l.valor || 0), 0)
  const recebido = receitas.filter(l => l.pago).reduce((s, l) => s + (l.valor || 0), 0)
  const pendente = previsto - recebido
  const repasses = lancamentos.filter(l => l.parceiro_nome && !l.parceiro_pago).reduce((s, l) => s + (l.parceiro_valor || 0), 0)

  async function save() {
    if (!form.descricao || !form.valor || !form.data) { toast.error('Descrição, valor e data são obrigatórios'); return }
    setSaving(true)
    const payload = { ...form, valor: parseFloat(form.valor), cliente_id: form.cliente_id || null, processo_id: form.processo_id || null, parceiro_percentual: form.parceiro_percentual ? parseFloat(form.parceiro_percentual) : null, parceiro_valor: form.parceiro_valor ? parseFloat(form.parceiro_valor) : null }
    let error
    if (editingId) { const r = await supabase.from('financeiro').update(payload).eq('id', editingId); error = r.error }
    else { const r = await supabase.from('financeiro').insert(payload); error = r.error }
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Salvo!'); setShowForm(false); loadData() }
    setSaving(false)
  }

  async function togglePago(l: any) {
    await supabase.from('financeiro').update({ pago: !l.pago, data_pagamento: !l.pago ? new Date().toISOString().split('T')[0] : null }).eq('id', l.id)
    loadData()
  }

  function gerarRecibo() {
    const num = `REC-${Date.now().toString().slice(-6)}`
    const texto = `RECIBO Nº ${num}\n\nEu, Carol Silva Lopes, OAB/GO 56.972, recebi de ${recibo.cliente_nome} (CPF/CNPJ: ${recibo.cpf_cnpj}) a quantia de ${formatCurrency(parseFloat(recibo.valor || '0'))} referente a: ${recibo.descricao}\n\nForma de pagamento: ${recibo.tipo_pagamento}\nData: ${formatDate(recibo.data)}\n\n\n___________________________________\nCarol Silva Lopes — OAB/GO 56.972\nSilva Lopes Advocacia & Assessoria Jurídica\n(62) 98197-4318`
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${num}.txt`; a.click()
    toast.success('Recibo gerado!')
    setShowRecibo(false)
  }

  const F = ({ label, children }: any) => (<div className="flex flex-col gap-1"><label className="label">{label}</label>{children}</div>)

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Financeiro" />
      <div className="p-6">
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="metric-card accent"><div className="label">Honorários previstos</div><div className="font-serif text-2xl text-white">{formatCurrency(previsto)}</div></div>
          <div className="metric-card green"><div className="label">Recebido</div><div className="font-serif text-2xl text-white">{formatCurrency(recebido)}</div></div>
          <div className="metric-card amber"><div className="label">Pendente</div><div className="font-serif text-2xl text-white">{formatCurrency(pendente)}</div></div>
          <div className="metric-card red"><div className="label">Repasse parceria</div><div className="font-serif text-2xl text-white">{formatCurrency(repasses)}</div><div className="text-xs text-status-red/70 mt-1">Pendente de pagamento</div></div>
        </div>

        <div className="flex gap-3 mb-5">
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}><Plus size={13} /> Novo lançamento</button>
          <button className="btn-primary" onClick={() => setShowRecibo(true)}><FileText size={13} /> Emitir recibo</button>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full" style={{tableLayout:'fixed'}}>
            <thead>
              <tr className="border-b border-brand-silver/8">
                <th className="table-header" style={{width:'20%'}}>Cliente</th>
                <th className="table-header" style={{width:'24%'}}>Descrição</th>
                <th className="table-header" style={{width:'8%'}}>Tipo</th>
                <th className="table-header" style={{width:'13%'}}>Valor</th>
                <th className="table-header" style={{width:'11%'}}>Data</th>
                <th className="table-header" style={{width:'12%'}}>Status</th>
                <th className="table-header" style={{width:'6%'}}>Parceria</th>
                <th className="table-header" style={{width:'6%'}}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="table-cell text-center text-brand-silver/30 py-8">Carregando...</td></tr>
              : lancamentos.length === 0 ? <tr><td colSpan={8} className="table-cell text-center text-brand-silver/30 py-8">Nenhum lançamento cadastrado.</td></tr>
              : lancamentos.map(l => (
                <tr key={l.id} className="table-row">
                  <td className="table-cell text-white text-xs truncate">{l.cliente?.nome || '—'}</td>
                  <td className="table-cell text-brand-silver/60 text-xs truncate">{l.descricao}</td>
                  <td className="table-cell"><span className={`badge text-xs ${l.tipo === 'receita' ? 'text-status-green border-status-green/25' : 'text-status-red border-status-red/25'}`}>{l.tipo}</span></td>
                  <td className="table-cell text-white text-xs font-medium">{formatCurrency(l.valor)}</td>
                  <td className="table-cell text-brand-silver/50 text-xs">{formatDate(l.data)}</td>
                  <td className="table-cell">
                    <button onClick={() => togglePago(l)} className={`badge text-xs cursor-pointer ${l.pago ? 'text-status-green border-status-green/25 bg-status-green/7' : 'text-status-amber border-status-amber/25 bg-status-amber/7'}`}>
                      {l.pago ? 'Pago' : 'Pendente'}
                    </button>
                  </td>
                  <td className="table-cell text-xs">{l.parceiro_nome ? <span className="badge text-status-amber border-status-amber/25 text-xs">Sim</span> : <span className="text-brand-silver/25">—</span>}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({tipo:l.tipo,categoria:l.categoria||'',descricao:l.descricao,valor:String(l.valor),data:l.data,pago:l.pago,cliente_id:l.cliente_id||'',processo_id:l.processo_id||'',tipo_honorario:l.tipo_honorario||'',parceiro_nome:l.parceiro_nome||'',parceiro_percentual:l.parceiro_percentual?String(l.parceiro_percentual):'',parceiro_valor:l.parceiro_valor?String(l.parceiro_valor):'',parceiro_pago:l.parceiro_pago||false}); setEditingId(l.id); setShowForm(true) }} className="p-1 hover:text-brand-silver text-brand-silver/40"><Edit2 size={12} /></button>
                      <button onClick={async () => { if(confirm('Excluir?')) { await supabase.from('financeiro').delete().eq('id',l.id); loadData() } }} className="p-1 hover:text-status-red text-brand-silver/40"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto" onClick={e => { if(e.target === e.currentTarget) setShowForm(false) }} onMouseDown={e => e.stopPropagation()}>
            <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-brand-silver text-lg">{editingId ? 'Editar lançamento' : 'Novo lançamento'}</h2>
                <button onClick={() => setShowForm(false)}><X size={16} className="text-brand-silver/50" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <F label="Tipo"><select className="input-field" value={form.tipo} onChange={e => setForm({...form,tipo:e.target.value})}><option value="receita">Receita</option><option value="despesa">Despesa</option></select></F>
                <F label="Data *"><input className="input-field" type="date" value={form.data} onChange={e => setForm({...form,data:e.target.value})} /></F>
              </div>
              <div className="mb-3"><F label="Descrição *"><input className="input-field" value={form.descricao} onChange={e => setForm({...form,descricao:e.target.value})} /></F></div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <F label="Valor (R$) *"><input className="input-field" type="number" step="0.01" value={form.valor} onChange={e => setForm({...form,valor:e.target.value})} placeholder="0,00" /></F>
                <F label="Cliente"><select className="input-field" value={form.cliente_id} onChange={e => setForm({...form,cliente_id:e.target.value})}><option value="">Nenhum</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></F>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <input type="checkbox" id="pago" checked={form.pago} onChange={e => setForm({...form,pago:e.target.checked})} className="accent-brand-silver" />
                <label htmlFor="pago" className="text-brand-silver/60 text-sm cursor-pointer">Já foi pago</label>
              </div>
              <div className="border-t border-brand-silver/8 pt-3 mt-3">
                <div className="label mb-2">Parceria (opcional)</div>
                <div className="grid grid-cols-3 gap-3">
                  <F label="Nome do parceiro"><input className="input-field" value={form.parceiro_nome} onChange={e => setForm({...form,parceiro_nome:e.target.value})} /></F>
                  <F label="% parceiro"><input className="input-field" type="number" value={form.parceiro_percentual} onChange={e => setForm({...form,parceiro_percentual:e.target.value})} /></F>
                  <F label="Valor repasse"><input className="input-field" type="number" step="0.01" value={form.parceiro_valor} onChange={e => setForm({...form,parceiro_valor:e.target.value})} /></F>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
                <button className="btn-primary" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {showRecibo && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto" onClick={e => { if(e.target === e.currentTarget) setShowRecibo(false) }}>
            <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-brand-silver text-lg">Emitir recibo</h2>
                <button onClick={() => setShowRecibo(false)}><X size={16} className="text-brand-silver/50" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <F label="Nome do cliente"><input className="input-field" value={recibo.cliente_nome} onChange={e => setRecibo({...recibo,cliente_nome:e.target.value})} /></F>
                <F label="CPF / CNPJ"><input className="input-field" value={recibo.cpf_cnpj} onChange={e => setRecibo({...recibo,cpf_cnpj:e.target.value})} /></F>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <F label="Valor (R$)"><input className="input-field" type="number" step="0.01" value={recibo.valor} onChange={e => setRecibo({...recibo,valor:e.target.value})} /></F>
                <F label="Data"><input className="input-field" type="date" value={recibo.data} onChange={e => setRecibo({...recibo,data:e.target.value})} /></F>
              </div>
              <div className="mb-3"><F label="Descrição"><input className="input-field" value={recibo.descricao} onChange={e => setRecibo({...recibo,descricao:e.target.value})} placeholder="Honorários advocatícios — proc. nº..." /></F></div>
              <div className="mb-3"><F label="Forma de pagamento"><select className="input-field" value={recibo.tipo_pagamento} onChange={e => setRecibo({...recibo,tipo_pagamento:e.target.value})}><option>PIX</option><option>Transferência</option><option>Dinheiro</option><option>Boleto</option></select></F></div>
              <div className="flex gap-3 mt-5">
                <button className="btn-primary flex-1 justify-center" onClick={gerarRecibo}><FileText size={13} /> Gerar recibo</button>
                <button className="btn-primary" onClick={() => setShowRecibo(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

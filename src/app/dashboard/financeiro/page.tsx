'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, X, Save, Edit2, Trash2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { tipo: 'receita', categoria: '', descricao: '', valor: '', data: '', pago: false, cliente_id: '', processo_id: '', tipo_honorario: '', parceiro_nome: '', parceiro_percentual: '', parceiro_valor: '', parceiro_pago: false }

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1"><label className="label">{label}</label>{children}</div>
)

function LancamentoModal({ editingId, initialForm, clientes, onClose, onSaved }: any) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.descricao || !form.valor || !form.data) { toast.error('Descrição, valor e data são obrigatórios'); return }
    setSaving(true)
    const payload = { ...form, valor: parseFloat(form.valor), cliente_id: form.cliente_id || null, processo_id: form.processo_id || null, parceiro_percentual: form.parceiro_percentual ? parseFloat(form.parceiro_percentual) : null, parceiro_valor: form.parceiro_valor ? parseFloat(form.parceiro_valor) : null }
    let error
    if (editingId) { const r = await supabase.from('financeiro').update(payload).eq('id', editingId); error = r.error }
    else { const r = await supabase.from('financeiro').insert(payload); error = r.error }
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Salvo!'); onSaved() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-brand-silver text-lg">{editingId ? 'Editar lançamento' : 'Novo lançamento'}</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Tipo">
            <select className="input-field" value={form.tipo} onChange={e => setForm((f: any) => ({ ...f, tipo: e.target.value }))}>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </F>
          <F label="Data *"><input className="input-field" type="date" value={form.data} onChange={e => setForm((f: any) => ({ ...f, data: e.target.value }))} /></F>
        </div>
        <div className="mb-3"><F label="Descrição *"><input className="input-field" value={form.descricao} onChange={e => setForm((f: any) => ({ ...f, descricao: e.target.value }))} /></F></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Valor (R$) *"><input className="input-field" type="number" step="0.01" value={form.valor} onChange={e => setForm((f: any) => ({ ...f, valor: e.target.value }))} placeholder="0,00" /></F>
          <F label="Cliente">
            <select className="input-field" value={form.cliente_id} onChange={e => setForm((f: any) => ({ ...f, cliente_id: e.target.value }))}>
              <option value="">Nenhum</option>
              {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </F>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <input type="checkbox" id="pago" checked={form.pago} onChange={e => setForm((f: any) => ({ ...f, pago: e.target.checked }))} className="accent-brand-silver" />
          <label htmlFor="pago" className="text-brand-silver/60 text-sm cursor-pointer">Já foi pago</label>
        </div>
        <div className="border-t border-brand-silver/8 pt-3 mt-3">
          <div className="label mb-2">Parceria (opcional)</div>
          <div className="grid grid-cols-3 gap-3">
            <F label="Nome do parceiro"><input className="input-field" value={form.parceiro_nome} onChange={e => setForm((f: any) => ({ ...f, parceiro_nome: e.target.value }))} /></F>
            <F label="% parceiro"><input className="input-field" type="number" value={form.parceiro_percentual} onChange={e => setForm((f: any) => ({ ...f, parceiro_percentual: e.target.value }))} /></F>
            <F label="Valor repasse"><input className="input-field" type="number" step="0.01" value={form.parceiro_valor} onChange={e => setForm((f: any) => ({ ...f, parceiro_valor: e.target.value }))} /></F>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// Dados do escritório — edite aqui se precisar corrigir
const ESCRITORIO = {
  advogada: 'Anna Carolyne Silva Lopes',
  oab: 'OAB/GO 56.972',
  email: 'annacarolyne.adv@gmail.com',
  telefone: '(62) 98197-4318',
  escritorio: 'Silva Lopes Advocacia & Assessoria Jurídica',
}

function ReciboModal({ onClose, clientes }: any) {
  const [clienteId, setClienteId] = useState('')
  const [recibo, setRecibo] = useState({
    cliente_nome: '', cpf_cnpj: '', valor: '',
    data: new Date().toISOString().split('T')[0],
    objeto: '', tipo_pagamento: 'PIX',
  })

  function selecionarCliente(id: string) {
    setClienteId(id)
    const c = clientes.find((x: any) => x.id === id)
    if (c) {
      setRecibo(r => ({
        ...r,
        cliente_nome: c.nome || '',
        cpf_cnpj: c.cpf || c.cnpj || '',
        objeto: c.tipo_honorario === 'exito' ? 'Honorários de êxito — serviços advocatícios prestados'
          : c.tipo_honorario === 'inicial_exito' ? 'Honorários iniciais e de êxito — serviços advocatícios prestados'
          : 'Honorários advocatícios — serviços jurídicos prestados',
      }))
    }
  }

  function gerarRecibo() {
    if (!recibo.cliente_nome || !recibo.valor) { toast.error('Preencha nome do cliente e valor'); return }
    const num = `REC-${Date.now().toString().slice(-6)}`
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Recibo ${num}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Georgia',serif;background:#fff;color:#111;padding:60px;max-width:780px;margin:auto}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:20px;margin-bottom:28px}
      .escritorio h1{font-size:20px;font-weight:bold;letter-spacing:1px;text-transform:uppercase}
      .escritorio p{font-size:11px;color:#555;margin-top:3px;line-height:1.7}
      .num-recibo{text-align:right}
      .num-recibo .titulo{font-size:30px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#111}
      .num-recibo .num{font-size:12px;color:#777;margin-top:4px;font-family:monospace}
      .corpo{margin:24px 0;line-height:1.9;font-size:13.5px}
      .cliente-nome{font-size:19px;font-weight:bold;margin:10px 0;border-bottom:1px solid #ddd;padding-bottom:6px}
      .valor-box{display:inline-block;border:2px solid #111;padding:10px 28px;font-size:22px;font-weight:bold;margin:16px 0;letter-spacing:1px}
      .descricao{margin:12px 0;font-size:14px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;padding:16px;background:#f8f8f8;border:1px solid #e8e8e8}
      .info-item label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#888;display:block;margin-bottom:4px}
      .info-item span{font-size:14px;font-weight:600}
      .nota{font-size:11px;color:#666;margin-top:18px;font-style:italic}
      .assinatura{margin-top:64px}
      .linha-ass{border-top:2px solid #111;width:300px;padding-top:10px;margin-top:52px}
      .linha-ass .nome{font-weight:bold;font-size:15px}
      .linha-ass .sub{font-size:11px;color:#555;margin-top:3px}
      .rodape{margin-top:48px;border-top:1px solid #ddd;padding-top:14px;font-size:10px;color:#aaa;text-align:center;font-family:sans-serif;letter-spacing:0.5px}
      @media print{body{padding:30px}}
    </style></head><body>
      <div class="header">
        <div class="escritorio">
          <h1>${ESCRITORIO.escritorio}</h1>
          <p>${ESCRITORIO.advogada} · ${ESCRITORIO.oab}<br>${ESCRITORIO.email} · ${ESCRITORIO.telefone}</p>
        </div>
        <div class="num-recibo">
          <div class="titulo">Recibo</div>
          <div class="num">${num}</div>
        </div>
      </div>
      <div class="corpo">
        <p>Eu, <strong>${ESCRITORIO.advogada}</strong>, ${ESCRITORIO.oab}, recebi de</p>
        <div class="cliente-nome">${recibo.cliente_nome}</div>
        <p>CPF/CNPJ: <strong>${recibo.cpf_cnpj || '______________________________'}</strong></p>
        <div class="valor-box">${formatCurrency(parseFloat(recibo.valor || '0'))}</div>
        <div class="descricao">Referente a: <strong>${recibo.objeto || '______________________________'}</strong></div>
        <div class="info-grid">
          <div class="info-item"><label>Forma de pagamento</label><span>${recibo.tipo_pagamento}</span></div>
          <div class="info-item"><label>Data</label><span>${formatDate(recibo.data)}</span></div>
        </div>
        <p class="nota">Por ser verdade, firmo o presente recibo para que produza os devidos efeitos legais.</p>
        <div class="assinatura">
          <div class="linha-ass">
            <div class="nome">${ESCRITORIO.advogada}</div>
            <div class="sub">${ESCRITORIO.oab}</div>
            <div class="sub">${ESCRITORIO.escritorio}</div>
          </div>
        </div>
      </div>
      <div class="rodape">${ESCRITORIO.escritorio} · ${ESCRITORIO.oab} · ${ESCRITORIO.telefone}</div>
      <script>window.onload=function(){window.print()}</script>
    </body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (w) { w.document.write(html); w.document.close() }
    toast.success('Recibo aberto — salve como PDF!')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-brand-silver text-lg">Emitir recibo</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50" /></button>
        </div>

        {/* Seletor de cliente — puxa nome e CPF automaticamente */}
        <div className="mb-3">
          <div className="flex flex-col gap-1">
            <label className="label">Selecionar cliente (preenche automático)</label>
            <select className="input-field" value={clienteId} onChange={e => selecionarCliente(e.target.value)}>
              <option value="">Digitar manualmente...</option>
              {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="label">Nome do cliente *</label>
            <input className="input-field" value={recibo.cliente_nome} onChange={e => setRecibo(r => ({ ...r, cliente_nome: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label">CPF / CNPJ</label>
            <input className="input-field" value={recibo.cpf_cnpj} onChange={e => setRecibo(r => ({ ...r, cpf_cnpj: e.target.value }))} />
          </div>
        </div>

        <div className="mb-3">
          <div className="flex flex-col gap-1">
            <label className="label">Objeto do contrato / serviço *</label>
            <input className="input-field" value={recibo.objeto} onChange={e => setRecibo(r => ({ ...r, objeto: e.target.value }))} placeholder="Honorários advocatícios — proc. nº..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <label className="label">Valor (R$) *</label>
            <input className="input-field" type="number" step="0.01" value={recibo.valor} onChange={e => setRecibo(r => ({ ...r, valor: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label">Data</label>
            <input className="input-field" type="date" value={recibo.data} onChange={e => setRecibo(r => ({ ...r, data: e.target.value }))} />
          </div>
        </div>

        <div className="mb-5">
          <div className="flex flex-col gap-1">
            <label className="label">Forma de pagamento</label>
            <select className="input-field" value={recibo.tipo_pagamento} onChange={e => setRecibo(r => ({ ...r, tipo_pagamento: e.target.value }))}>
              <option>PIX</option><option>Transferência</option><option>Dinheiro</option><option>Boleto</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary flex-1 justify-center" onClick={gerarRecibo}><FileText size={13} /> Gerar recibo PDF</button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function FinanceiroPage() {
  const [lancamentos, setLancamentos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showRecibo, setShowRecibo] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialForm, setInitialForm] = useState<any>(emptyForm)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: l }, { data: c }] = await Promise.all([
      supabase.from('financeiro').select('*, cliente:clientes(nome), processo:processos(titulo_interno, numero_processo)').order('data', { ascending: false }),
      supabase.from('clientes').select('id,nome,cpf,cnpj').order('nome'),
    ])
    setLancamentos(l || [])
    setClientes(c || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const receitas = lancamentos.filter(l => l.tipo === 'receita')
  const previsto = receitas.reduce((s, l) => s + (l.valor || 0), 0)
  const recebido = receitas.filter(l => l.pago).reduce((s, l) => s + (l.valor || 0), 0)
  const pendente = previsto - recebido
  const repasses = lancamentos.filter(l => l.parceiro_nome && !l.parceiro_pago).reduce((s, l) => s + (l.parceiro_valor || 0), 0)

  async function togglePago(l: any) {
    await supabase.from('financeiro').update({ pago: !l.pago, data_pagamento: !l.pago ? new Date().toISOString().split('T')[0] : null }).eq('id', l.id)
    loadData()
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Financeiro" />
      <div className="p-6">
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="metric-card accent"><div className="kpi-label">Honorários previstos</div><div className="kpi-value" style={{fontSize:'1.6rem'}}>{formatCurrency(previsto)}</div></div>
          <div className="metric-card green"><div className="kpi-label">Recebido</div><div className="kpi-value" style={{fontSize:'1.6rem'}}>{formatCurrency(recebido)}</div></div>
          <div className="metric-card amber"><div className="kpi-label">Pendente</div><div className="kpi-value" style={{fontSize:'1.6rem'}}>{formatCurrency(pendente)}</div></div>
          <div className="metric-card red"><div className="kpi-label">Repasse parceria</div><div className="kpi-value" style={{fontSize:'1.6rem'}}>{formatCurrency(repasses)}</div><div className="text-xs text-status-red/70 mt-1">Pendente de pagamento</div></div>
        </div>

        <div className="flex gap-3 mb-5">
          <button className="btn-primary" onClick={() => { setInitialForm(emptyForm); setEditingId(null); setShowForm(true) }}><Plus size={13} /> Novo lançamento</button>
          <button className="btn-primary" onClick={() => setShowRecibo(true)}><FileText size={13} /> Emitir recibo</button>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-brand-silver/8">
                <th className="table-header" style={{ width: '20%' }}>Cliente</th>
                <th className="table-header" style={{ width: '24%' }}>Descrição</th>
                <th className="table-header" style={{ width: '8%' }}>Tipo</th>
                <th className="table-header" style={{ width: '13%' }}>Valor</th>
                <th className="table-header" style={{ width: '11%' }}>Data</th>
                <th className="table-header" style={{ width: '12%' }}>Status</th>
                <th className="table-header" style={{ width: '6%' }}>Parceria</th>
                <th className="table-header" style={{ width: '6%' }}></th>
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
                        <button onClick={() => { setInitialForm({ tipo: l.tipo, categoria: l.categoria || '', descricao: l.descricao, valor: String(l.valor), data: l.data, pago: l.pago, cliente_id: l.cliente_id || '', processo_id: l.processo_id || '', tipo_honorario: l.tipo_honorario || '', parceiro_nome: l.parceiro_nome || '', parceiro_percentual: l.parceiro_percentual ? String(l.parceiro_percentual) : '', parceiro_valor: l.parceiro_valor ? String(l.parceiro_valor) : '', parceiro_pago: l.parceiro_pago || false }); setEditingId(l.id); setShowForm(true) }} className="p-1 hover:text-brand-silver text-brand-silver/40"><Edit2 size={12} /></button>
                        <button onClick={async () => { if (confirm('Excluir?')) { await supabase.from('financeiro').delete().eq('id', l.id); loadData() } }} className="p-1 hover:text-status-red text-brand-silver/40"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {showForm && (
          <LancamentoModal
            editingId={editingId}
            initialForm={initialForm}
            clientes={clientes}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); loadData() }}
          />
        )}

        {showRecibo && (
          <ReciboModal onClose={() => setShowRecibo(false)} clientes={clientes} />
        )}
      </div>
    </div>
  )
}

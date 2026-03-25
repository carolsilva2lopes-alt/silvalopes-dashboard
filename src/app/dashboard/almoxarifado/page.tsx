'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { Plus, X, Save, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1"><label className="label">{label}</label>{children}</div>
)

interface ItemModalProps {
  show: boolean
  editingId: string | null
  form: any
  setForm: (f: any) => void
  saving: boolean
  onSave: () => void
  onClose: () => void
}

function ItemModal({ show, editingId, form, setForm, saving, onSave, onClose }: ItemModalProps) {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-brand-silver text-lg">{editingId ? 'Editar item' : 'Novo item'}</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Nome *"><input className="input-field" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></F>
          <F label="Categoria"><input className="input-field" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="Escritório, Limpeza..." /></F>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <F label="Qtd. atual"><input className="input-field" type="number" min="0" value={form.quantidade_atual} onChange={e => setForm({ ...form, quantidade_atual: e.target.value })} /></F>
          <F label="Qtd. mínima"><input className="input-field" type="number" min="0" value={form.quantidade_minima} onChange={e => setForm({ ...form, quantidade_minima: e.target.value })} /></F>
          <F label="Unidade"><input className="input-field" value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} placeholder="un, cx, pct..." /></F>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={onSave} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

interface MovimentacaoModalProps {
  item: any
  movimento: any
  setMovimento: (m: any) => void
  saving: boolean
  onSave: () => void
  onClose: () => void
}

function MovimentacaoModal({ item, movimento, setMovimento, saving, onSave, onClose }: MovimentacaoModalProps) {
  if (!item) return null
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-brand-silver text-lg">Movimentação — {item.nome}</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Tipo">
            <select className="input-field" value={movimento.tipo} onChange={e => setMovimento({ ...movimento, tipo: e.target.value })}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </F>
          <F label="Quantidade"><input className="input-field" type="number" min="1" value={movimento.quantidade} onChange={e => setMovimento({ ...movimento, quantidade: e.target.value })} /></F>
        </div>
        <div className="mb-3"><F label="Responsável"><input className="input-field" value={movimento.responsavel} onChange={e => setMovimento({ ...movimento, responsavel: e.target.value })} /></F></div>
        <F label="Observações"><input className="input-field" value={movimento.observacoes} onChange={e => setMovimento({ ...movimento, observacoes: e.target.value })} /></F>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={onSave} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Registrar'}</button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function AlmoxarifadoPage() {
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showMovimento, setShowMovimento] = useState<any>(null)
  const [form, setForm] = useState({ nome: '', categoria: '', descricao: '', quantidade_atual: '0', quantidade_minima: '1', unidade: 'un' })
  const [movimento, setMovimento] = useState({ tipo: 'entrada', quantidade: '1', responsavel: 'Carol Silva Lopes', observacoes: '' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => { loadItens() }, [])

  async function loadItens() {
    setLoading(true)
    const { data } = await supabase.from('almoxarifado_itens').select('*').order('nome')
    setItens(data || [])
    setLoading(false)
  }

  const stats = {
    total: itens.length,
    ok: itens.filter(i => i.quantidade_atual > i.quantidade_minima).length,
    baixo: itens.filter(i => i.quantidade_atual > 0 && i.quantidade_atual <= i.quantidade_minima).length,
    zerado: itens.filter(i => i.quantidade_atual === 0).length,
  }

  async function saveItem() {
    if (!form.nome) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    const payload = { ...form, quantidade_atual: parseInt(form.quantidade_atual), quantidade_minima: parseInt(form.quantidade_minima) }
    let error
    if (editingId) { const r = await supabase.from('almoxarifado_itens').update(payload).eq('id', editingId); error = r.error }
    else { const r = await supabase.from('almoxarifado_itens').insert(payload); error = r.error }
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Salvo!'); setShowForm(false); loadItens() }
    setSaving(false)
  }

  async function saveMovimento() {
    if (!movimento.quantidade || parseInt(movimento.quantidade) <= 0) { toast.error('Quantidade inválida'); return }
    setSaving(true)
    const item = showMovimento
    const novaQtd = movimento.tipo === 'entrada'
      ? item.quantidade_atual + parseInt(movimento.quantidade)
      : Math.max(0, item.quantidade_atual - parseInt(movimento.quantidade))

    await Promise.all([
      supabase.from('almoxarifado_movimentacoes').insert({ item_id: item.id, tipo: movimento.tipo, quantidade: parseInt(movimento.quantidade), responsavel: movimento.responsavel, observacoes: movimento.observacoes }),
      supabase.from('almoxarifado_itens').update({ quantidade_atual: novaQtd }).eq('id', item.id),
    ])
    toast.success('Movimentação registrada!')
    setShowMovimento(null)
    loadItens()
    setSaving(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Almoxarifado" />
      <div className="p-6">
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="metric-card"><div className="label">Total itens</div><div className="font-serif text-3xl text-white">{stats.total}</div></div>
          <div className="metric-card green"><div className="label">Em estoque</div><div className="font-serif text-3xl text-white">{stats.ok}</div></div>
          <div className="metric-card amber"><div className="label">Estoque baixo</div><div className="font-serif text-3xl text-white">{stats.baixo}</div></div>
          <div className="metric-card red"><div className="label">Esgotados</div><div className="font-serif text-3xl text-white">{stats.zerado}</div></div>
        </div>

        <div className="flex justify-end mb-5">
          <button className="btn-primary" onClick={() => { setForm({ nome: '', categoria: '', descricao: '', quantidade_atual: '0', quantidade_minima: '1', unidade: 'un' }); setEditingId(null); setShowForm(true) }}><Plus size={13} /> Novo item</button>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-brand-silver/8">
                <th className="table-header" style={{ width: '28%' }}>Item</th>
                <th className="table-header" style={{ width: '16%' }}>Categoria</th>
                <th className="table-header" style={{ width: '12%' }}>Qtd.</th>
                <th className="table-header" style={{ width: '12%' }}>Mínimo</th>
                <th className="table-header" style={{ width: '18%' }}>Status</th>
                <th className="table-header" style={{ width: '14%' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="table-cell text-center text-brand-silver/30 py-8">Carregando...</td></tr>
                : itens.length === 0 ? <tr><td colSpan={6} className="table-cell text-center text-brand-silver/30 py-8">Nenhum item cadastrado.</td></tr>
                : itens.map(item => {
                  const status = item.quantidade_atual === 0 ? 'zerado' : item.quantidade_atual <= item.quantidade_minima ? 'baixo' : 'ok'
                  const statusColor = status === 'ok' ? 'text-status-green border-status-green/25 bg-status-green/7' : status === 'baixo' ? 'text-status-amber border-status-amber/25 bg-status-amber/7' : 'text-status-red border-status-red/25 bg-status-red/7'
                  const pct = item.quantidade_minima > 0 ? Math.min(100, Math.round(item.quantidade_atual / (item.quantidade_minima * 3) * 100)) : 100
                  return (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell text-white text-xs font-medium">{item.nome}</td>
                      <td className="table-cell text-brand-silver/50 text-xs">{item.categoria || '—'}</td>
                      <td className="table-cell text-white text-xs font-medium">{item.quantidade_atual} <span className="text-brand-silver/30">{item.unidade}</span></td>
                      <td className="table-cell text-brand-silver/40 text-xs">{item.quantidade_minima} {item.unidade}</td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-1">
                          <span className={`badge text-xs ${statusColor}`}>{status === 'ok' ? 'OK' : status === 'baixo' ? 'Baixo' : 'Esgotado'}</span>
                          <div className="h-1 bg-brand-dark/50 w-full"><div className={`h-full ${status === 'ok' ? 'bg-status-green' : status === 'baixo' ? 'bg-status-amber' : 'bg-status-red'}`} style={{ width: `${pct}%` }}></div></div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-1">
                          <button onClick={() => { setShowMovimento(item); setMovimento({ tipo: 'entrada', quantidade: '1', responsavel: 'Carol Silva Lopes', observacoes: '' }) }} className="p-1 hover:text-status-green text-brand-silver/40 transition-colors" title="Entrada"><ArrowUp size={12} /></button>
                          <button onClick={() => { setShowMovimento(item); setMovimento({ tipo: 'saida', quantidade: '1', responsavel: 'Carol Silva Lopes', observacoes: '' }) }} className="p-1 hover:text-status-amber text-brand-silver/40 transition-colors" title="Saída"><ArrowDown size={12} /></button>
                          <button onClick={() => { setForm({ nome: item.nome, categoria: item.categoria || '', descricao: item.descricao || '', quantidade_atual: String(item.quantidade_atual), quantidade_minima: String(item.quantidade_minima), unidade: item.unidade || 'un' }); setEditingId(item.id); setShowForm(true) }} className="p-1 hover:text-brand-silver text-brand-silver/40 text-xs">✎</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        <ItemModal
          show={showForm}
          editingId={editingId}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={saveItem}
          onClose={() => setShowForm(false)}
        />

        <MovimentacaoModal
          item={showMovimento}
          movimento={movimento}
          setMovimento={setMovimento}
          saving={saving}
          onSave={saveMovimento}
          onClose={() => setShowMovimento(null)}
        />
      </div>
    </div>
  )
}

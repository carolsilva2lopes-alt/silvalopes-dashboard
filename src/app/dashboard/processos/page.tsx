'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { getStatusColor, AREAS_DIREITO, ESTADOS_BR } from '@/lib/utils'
import { Plus, Search, X, Save, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Processo {
  id: string
  numero_processo?: string
  titulo_interno: string
  area_direito?: string
  estado?: string
  comarca?: string
  vara?: string
  status: string
  parceria: boolean
  advogado_parceiro?: string
  data_inicio?: string
  created_at: string
  processo_clientes?: any[]
}

const emptyForm = {
  numero_processo: '', titulo_interno: '', area_direito: '', estado: '',
  comarca: '', vara: '', tribunal: '', status: 'ativo', parceria: false,
  advogado_parceiro: '', percentual_parceiro: '', data_inicio: '', observacoes: '',
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1"><label className="label">{label}</label>{children}</div>
)

function ProcessoModal({ editingId, initialForm, initialClientes, clientesLista, onClose, onSaved }: any) {
  const [form, setForm] = useState(initialForm)
  const [clientesSelecionados, setClientesSelecionados] = useState<string[]>(initialClientes)
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }))

  async function save() {
    if (!form.titulo_interno.trim()) { toast.error('Título interno é obrigatório'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        percentual_parceiro: form.percentual_parceiro ? parseFloat(form.percentual_parceiro) : null,
        data_inicio: form.data_inicio || null,
      }
      let processoId = editingId
      if (editingId) {
        const { error } = await supabase.from('processos').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('processos').insert(payload).select().single()
        if (error) throw error
        processoId = data.id
      }
      if (processoId) {
        await supabase.from('processo_clientes').delete().eq('processo_id', processoId)
        if (clientesSelecionados.length > 0) {
          await supabase.from('processo_clientes').insert(
            clientesSelecionados.map(cid => ({ processo_id: processoId, cliente_id: cid }))
          )
        }
      }
      toast.success(editingId ? 'Processo atualizado!' : 'Processo cadastrado!')
      onSaved()
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message)
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-brand-silver text-lg">{editingId ? 'Editar processo' : 'Novo processo'}</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50 hover:text-brand-silver" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Número do processo"><input className="input-field font-mono" value={form.numero_processo} onChange={e => set('numero_processo', e.target.value)} placeholder="0000000-00.0000.0.00.0000" /></F>
          <F label="Data de início"><input className="input-field" type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} /></F>
        </div>
        <div className="mb-3">
          <F label="Título interno *"><input className="input-field" value={form.titulo_interno} onChange={e => set('titulo_interno', e.target.value)} placeholder="Nome de referência interno do processo" /></F>
        </div>
        <div className="mb-3">
          <label className="label">Clientes vinculados</label>
          <div className="border border-brand-silver/15 p-3 bg-brand-dark max-h-36 overflow-y-auto flex flex-col gap-1.5">
            {clientesLista.map((c: any) => (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm text-brand-silver/60 hover:text-brand-silver">
                <input
                  type="checkbox"
                  className="accent-brand-silver"
                  checked={clientesSelecionados.includes(c.id)}
                  onChange={e => {
                    if (e.target.checked) setClientesSelecionados(prev => [...prev, c.id])
                    else setClientesSelecionados(prev => prev.filter(id => id !== c.id))
                  }}
                />
                {c.nome}
              </label>
            ))}
            {clientesLista.length === 0 && <span className="text-brand-silver/30 text-xs">Nenhum cliente cadastrado.</span>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Área do Direito">
            <select className="input-field" value={form.area_direito} onChange={e => set('area_direito', e.target.value)}>
              <option value="">Selecionar...</option>
              {AREAS_DIREITO.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </F>
          <F label="Status">
            <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="ativo">Ativo</option>
              <option value="finalizado_sentenca">Finalizado — Sentença</option>
              <option value="finalizado_acordo_judicial">Finalizado — Acordo Judicial</option>
              <option value="finalizado_acordo_extrajudicial">Finalizado — Acordo Extrajudicial</option>
            </select>
          </F>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <F label="Estado">
            <select className="input-field" value={form.estado} onChange={e => set('estado', e.target.value)}>
              <option value="">—</option>
              {ESTADOS_BR.map(est => <option key={est} value={est}>{est}</option>)}
            </select>
          </F>
          <F label="Comarca"><input className="input-field" value={form.comarca} onChange={e => set('comarca', e.target.value)} /></F>
          <F label="Vara"><input className="input-field" value={form.vara} onChange={e => set('vara', e.target.value)} /></F>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <input type="checkbox" id="parceria-proc" checked={form.parceria} onChange={e => set('parceria', e.target.checked)} className="accent-brand-silver" />
          <label htmlFor="parceria-proc" className="text-brand-silver/60 text-sm cursor-pointer">Processo em parceria</label>
        </div>
        {form.parceria && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <F label="Advogado parceiro"><input className="input-field" value={form.advogado_parceiro} onChange={e => set('advogado_parceiro', e.target.value)} /></F>
            <F label="% do parceiro"><input className="input-field" type="number" min="0" max="100" value={form.percentual_parceiro} onChange={e => set('percentual_parceiro', e.target.value)} /></F>
          </div>
        )}
        <F label="Observações"><textarea className="input-field min-h-16 resize-none" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} /></F>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Salvar processo'}</button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

const statusLabel: Record<string, string> = {
  ativo: 'Ativo', finalizado_sentenca: 'Sentença',
  finalizado_acordo_judicial: 'Acordo Judicial', finalizado_acordo_extrajudicial: 'Acordo Extraj.',
}

export default function ProcessosPage() {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialForm, setInitialForm] = useState<any>(emptyForm)
  const [initialClientes, setInitialClientes] = useState<string[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: procs }, { data: clts }] = await Promise.all([
      supabase.from('processos').select('*, processo_clientes(cliente:clientes(id,nome))').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id, nome').order('nome'),
    ])
    setProcessos(procs || [])
    setClientes(clts || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = processos.filter(p =>
    p.titulo_interno?.toLowerCase().includes(busca.toLowerCase()) ||
    p.numero_processo?.includes(busca) ||
    p.area_direito?.toLowerCase().includes(busca.toLowerCase()) ||
    p.estado?.toLowerCase().includes(busca.toLowerCase())
  )

  function openNew() {
    setInitialForm(emptyForm)
    setInitialClientes([])
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(p: Processo) {
    setInitialForm({
      numero_processo: p.numero_processo || '', titulo_interno: p.titulo_interno || '',
      area_direito: p.area_direito || '', estado: p.estado || '', comarca: p.comarca || '',
      vara: p.vara || '', tribunal: (p as any).tribunal || '', status: p.status || 'ativo',
      parceria: p.parceria || false, advogado_parceiro: p.advogado_parceiro || '',
      percentual_parceiro: (p as any).percentual_parceiro || '',
      data_inicio: p.data_inicio || '', observacoes: (p as any).observacoes || '',
    })
    setInitialClientes(p.processo_clientes?.map((pc: any) => pc.cliente?.id).filter(Boolean) || [])
    setEditingId(p.id)
    setShowForm(true)
  }

  async function deleteProcesso(id: string) {
    if (!confirm('Excluir este processo?')) return
    const { error } = await supabase.from('processos').delete().eq('id', id)
    if (error) toast.error('Erro ao excluir')
    else { toast.success('Processo excluído'); loadData() }
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Processos" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-silver/30" />
            <input className="input-field pl-8" placeholder="Buscar por título, número, área ou estado..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={openNew}><Plus size={13} /> Novo processo</button>
        </div>
        <div className="card p-0 overflow-hidden">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-brand-silver/8">
                <th className="table-header" style={{ width: '14%' }}>Nº Processo</th>
                <th className="table-header" style={{ width: '24%' }}>Título interno</th>
                <th className="table-header" style={{ width: '18%' }}>Clientes</th>
                <th className="table-header" style={{ width: '18%' }}>Área</th>
                <th className="table-header" style={{ width: '7%' }}>Estado</th>
                <th className="table-header" style={{ width: '11%' }}>Status</th>
                <th className="table-header" style={{ width: '8%' }}>Parceria</th>
                <th className="table-header" style={{ width: '6%' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="table-cell text-center text-brand-silver/30 py-8">Carregando...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={8} className="table-cell text-center text-brand-silver/30 py-8">{busca ? 'Nenhum processo encontrado.' : 'Nenhum processo cadastrado ainda.'}</td></tr>
                : filtered.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="table-cell text-white text-xs font-mono">{p.numero_processo || '—'}</td>
                    <td className="table-cell text-white text-xs font-medium truncate">{p.titulo_interno}</td>
                    <td className="table-cell text-brand-silver/60 text-xs truncate">{p.processo_clientes?.map((pc: any) => pc.cliente?.nome).filter(Boolean).join(', ') || '—'}</td>
                    <td className="table-cell text-brand-silver/60 text-xs truncate">{p.area_direito || '—'}</td>
                    <td className="table-cell text-brand-silver/50 text-xs">{p.estado || '—'}</td>
                    <td className="table-cell"><span className={`badge text-xs ${getStatusColor(p.status)}`}>{statusLabel[p.status] || p.status}</span></td>
                    <td className="table-cell text-xs">{p.parceria ? <span className="badge text-status-amber border-status-amber/25 bg-status-amber/7 text-xs">Sim</span> : <span className="text-brand-silver/30">—</span>}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1 hover:text-brand-silver text-brand-silver/40"><Edit2 size={12} /></button>
                        <button onClick={() => deleteProcesso(p.id)} className="p-1 hover:text-status-red text-brand-silver/40"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {showForm && (
          <ProcessoModal
            editingId={editingId}
            initialForm={initialForm}
            initialClientes={initialClientes}
            clientesLista={clientes}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); loadData() }}
          />
        )}
      </div>
    </div>
  )
}

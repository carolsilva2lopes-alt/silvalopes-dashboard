'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatDate } from '@/lib/utils'
import { Plus, X, Save, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { tipo: '', data: '', hora: '', local: '', processo_id: '', cliente_id: '', responsavel: 'Anna Carolyne Silva Lopes', status: 'agendada', observacoes: '' }

const statusColor: Record<string, string> = {
  agendada: 'text-status-green border-status-green/25 bg-status-green/7',
  realizada: 'text-brand-silver/40 border-brand-silver/15',
  cancelada: 'text-status-red border-status-red/25 bg-status-red/7',
  adiada: 'text-status-amber border-status-amber/25 bg-status-amber/7',
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1"><label className="label">{label}</label>{children}</div>
)

function AudienciaModal({ editingId, initialForm, processosLista, clientesLista, onClose, onSaved }: any) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }))

  async function save() {
    if (!form.tipo || !form.data || !form.hora) { toast.error('Tipo, data e hora são obrigatórios'); return }
    setSaving(true)
    const payload = { ...form, processo_id: form.processo_id || null, cliente_id: form.cliente_id || null }
    let error
    if (editingId) { const r = await supabase.from('audiencias').update(payload).eq('id', editingId); error = r.error }
    else { const r = await supabase.from('audiencias').insert(payload); error = r.error }
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success(editingId ? 'Audiência atualizada!' : 'Audiência cadastrada!'); onSaved() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-brand-silver text-lg">{editingId ? 'Editar audiência' : 'Nova audiência'}</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50" /></button>
        </div>
        <div className="mb-3"><F label="Tipo de audiência *"><input className="input-field" value={form.tipo} onChange={e => set('tipo', e.target.value)} placeholder="Conciliação, Instrução, Julgamento..." /></F></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Data *"><input className="input-field" type="date" value={form.data} onChange={e => set('data', e.target.value)} /></F>
          <F label="Hora *"><input className="input-field" type="time" value={form.hora} onChange={e => set('hora', e.target.value)} /></F>
        </div>
        <div className="mb-3"><F label="Local"><input className="input-field" value={form.local} onChange={e => set('local', e.target.value)} /></F></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Processo">
            <select className="input-field" value={form.processo_id} onChange={e => set('processo_id', e.target.value)}>
              <option value="">Nenhum</option>
              {processosLista.map((p: any) => <option key={p.id} value={p.id}>{p.numero_processo ? `${p.numero_processo} — ` : ''}{p.titulo_interno}</option>)}
            </select>
          </F>
          <F label="Cliente">
            <select className="input-field" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
              <option value="">Nenhum</option>
              {clientesLista.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </F>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Status">
            <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="agendada">Agendada</option><option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option><option value="adiada">Adiada</option>
            </select>
          </F>
          <F label="Responsável"><input className="input-field" value={form.responsavel} onChange={e => set('responsavel', e.target.value)} /></F>
        </div>
        <F label="Observações"><textarea className="input-field min-h-16 resize-none" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} /></F>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Salvar audiência'}</button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function AudienciasPage() {
  const [audiencias, setAudiencias] = useState<any[]>([])
  const [processos, setProcessos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialForm, setInitialForm] = useState<any>(emptyForm)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: a }, { data: p }, { data: c }] = await Promise.all([
      supabase.from('audiencias').select('*, processo:processos(titulo_interno,numero_processo), cliente:clientes(nome)').order('data'),
      supabase.from('processos').select('id,titulo_interno,numero_processo').order('titulo_interno'),
      supabase.from('clientes').select('id,nome').order('nome'),
    ])
    setAudiencias(a || [])
    setProcessos(p || [])
    setClientes(c || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Audiências" />
      <div className="p-6">
        <div className="flex justify-end mb-5">
          <button className="btn-primary" onClick={() => { setInitialForm(emptyForm); setEditingId(null); setShowForm(true) }}><Plus size={13} /> Nova audiência</button>
        </div>
        <div className="card p-0 overflow-hidden">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-brand-silver/8">
                <th className="table-header" style={{ width: '18%' }}>Tipo</th>
                <th className="table-header" style={{ width: '22%' }}>Processo</th>
                <th className="table-header" style={{ width: '16%' }}>Cliente</th>
                <th className="table-header" style={{ width: '11%' }}>Data</th>
                <th className="table-header" style={{ width: '8%' }}>Hora</th>
                <th className="table-header" style={{ width: '14%' }}>Local</th>
                <th className="table-header" style={{ width: '11%' }}>Status</th>
                <th className="table-header" style={{ width: '6%' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="table-cell text-center text-brand-silver/30 py-8">Carregando...</td></tr>
                : audiencias.length === 0 ? <tr><td colSpan={8} className="table-cell text-center text-brand-silver/30 py-8">Nenhuma audiência cadastrada.</td></tr>
                : audiencias.map(a => (
                  <tr key={a.id} className="table-row">
                    <td className="table-cell text-white text-xs font-medium">{a.tipo}</td>
                    <td className="table-cell text-brand-silver/60 text-xs truncate">{a.processo ? `${a.processo.numero_processo || ''} ${a.processo.titulo_interno}`.trim() : '—'}</td>
                    <td className="table-cell text-brand-silver/60 text-xs truncate">{a.cliente?.nome || '—'}</td>
                    <td className="table-cell text-brand-silver/70 text-xs">{formatDate(a.data)}</td>
                    <td className="table-cell text-brand-silver/50 text-xs">{a.hora?.slice(0, 5) || '—'}</td>
                    <td className="table-cell text-brand-silver/50 text-xs truncate">{a.local || '—'}</td>
                    <td className="table-cell"><span className={`badge text-xs ${statusColor[a.status] || ''}`}>{a.status}</span></td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => { setInitialForm({ tipo: a.tipo, data: a.data, hora: a.hora || '', local: a.local || '', processo_id: a.processo_id || '', cliente_id: a.cliente_id || '', responsavel: a.responsavel || 'Anna Carolyne Silva Lopes', status: a.status, observacoes: a.observacoes || '' }); setEditingId(a.id); setShowForm(true) }} className="p-1 hover:text-brand-silver text-brand-silver/40"><Edit2 size={12} /></button>
                        <button onClick={async () => { if (confirm('Excluir?')) { await supabase.from('audiencias').delete().eq('id', a.id); loadData() } }} className="p-1 hover:text-status-red text-brand-silver/40"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {showForm && (
          <AudienciaModal
            editingId={editingId}
            initialForm={initialForm}
            processosLista={processos}
            clientesLista={clientes}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); loadData() }}
          />
        )}
      </div>
    </div>
  )
}

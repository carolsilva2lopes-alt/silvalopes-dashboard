'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatDate } from '@/lib/utils'
import { Plus, X, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = {
  titulo: '',
  descricao: '',
  cliente_id: '',
  processo_id: '',
  prioridade: 'normal',
  status: 'pendente',
  data_limite: '',
  observacoes: '',
}

const prioridadeColor: Record<string, string> = {
  baixa: 'text-brand-silver/40 border-brand-silver/15',
  normal: 'text-status-blue border-status-blue/25',
  alta: 'text-status-amber border-status-amber/25 bg-status-amber/7',
  urgente: 'text-status-red border-status-red/25 bg-status-red/7',
}

const statusColor: Record<string, string> = {
  pendente: 'text-status-amber border-status-amber/25 bg-status-amber/7',
  em_andamento: 'text-status-blue border-status-blue/25 bg-status-blue/7',
  concluida: 'text-status-green border-status-green/25 bg-status-green/7',
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="label">{label}</label>
    {children}
  </div>
)

interface TarefaModalProps {
  show: boolean
  editingId: string | null
  form: any
  setForm: (f: any) => void
  clientes: any[]
  processos: any[]
  saving: boolean
  onSave: () => void
  onClose: () => void
}

function TarefaModal({ show, editingId, form, setForm, clientes, processos, saving, onSave, onClose }: TarefaModalProps) {
  if (!show) return null
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-brand-silver text-lg">{editingId ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50" /></button>
        </div>
        <div className="mb-3">
          <F label="Título *">
            <input className="input-field" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
          </F>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Cliente">
            <select className="input-field" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
              <option value="">Nenhum</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </F>
          <F label="Processo">
            <select className="input-field" value={form.processo_id} onChange={e => setForm({ ...form, processo_id: e.target.value })}>
              <option value="">Nenhum</option>
              {processos.map(p => <option key={p.id} value={p.id}>{p.titulo_interno}</option>)}
            </select>
          </F>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <F label="Prioridade">
            <select className="input-field" value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}>
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </F>
          <F label="Status">
            <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
            </select>
          </F>
          <F label="Prazo">
            <input className="input-field" type="date" value={form.data_limite} onChange={e => setForm({ ...form, data_limite: e.target.value })} />
          </F>
        </div>
        <F label="Observações">
          <textarea className="input-field min-h-16 resize-none" value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} />
        </F>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={onSave} disabled={saving}>
            <Save size={13} /> {saving ? 'Salvando...' : 'Salvar tarefa'}
          </button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [processos, setProcessos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState('pendente')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: t }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('tarefas').select('*, cliente:clientes(nome), processo:processos(titulo_interno,numero_processo)').order('data_limite'),
      supabase.from('clientes').select('id,nome').order('nome'),
      supabase.from('processos').select('id,titulo_interno,numero_processo').order('titulo_interno'),
    ])
    setTarefas(t || [])
    setClientes(c || [])
    setProcessos(p || [])
    setLoading(false)
  }

  const filtered = tarefas.filter(t => filtro === 'todos' ? true : t.status === filtro)

  async function save() {
    if (!form.titulo) { toast.error('Título obrigatório'); return }
    setSaving(true)
    const payload = { ...form, cliente_id: form.cliente_id || null, processo_id: form.processo_id || null, data_limite: form.data_limite || null }
    let error
    if (editingId) { const r = await supabase.from('tarefas').update(payload).eq('id', editingId); error = r.error }
    else { const r = await supabase.from('tarefas').insert(payload); error = r.error }
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Salvo!'); setShowForm(false); loadData() }
    setSaving(false)
  }

  async function toggleStatus(t: any) {
    const next = t.status === 'pendente' ? 'em_andamento' : t.status === 'em_andamento' ? 'concluida' : 'pendente'
    await supabase.from('tarefas').update({ status: next }).eq('id', t.id)
    loadData()
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Tarefas Internas" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex gap-2">
            {[['todos', 'Todas'], ['pendente', 'Pendentes'], ['em_andamento', 'Em andamento'], ['concluida', 'Concluídas']].map(([k, l]) => (
              <button key={k} onClick={() => setFiltro(k)} className={`btn-primary text-xs py-1.5 ${filtro === k ? 'border-brand-silver/40 text-brand-silver bg-brand-silver/5' : ''}`}>{l}</button>
            ))}
          </div>
          <div className="flex-1" />
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}><Plus size={13} /> Nova tarefa</button>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr className="border-b border-brand-silver/8">
                <th className="table-header" style={{ width: '24%' }}>Tarefa</th>
                <th className="table-header" style={{ width: '16%' }}>Cliente</th>
                <th className="table-header" style={{ width: '18%' }}>Processo</th>
                <th className="table-header" style={{ width: '10%' }}>Prioridade</th>
                <th className="table-header" style={{ width: '11%' }}>Prazo</th>
                <th className="table-header" style={{ width: '13%' }}>Status</th>
                <th className="table-header" style={{ width: '8%' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="table-cell text-center text-brand-silver/30 py-8">Carregando...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={7} className="table-cell text-center text-brand-silver/30 py-8">Nenhuma tarefa encontrada.</td></tr>
                : filtered.map(t => (
                  <tr key={t.id} className="table-row">
                    <td className="table-cell text-white text-xs font-medium truncate">{t.titulo}</td>
                    <td className="table-cell text-brand-silver/60 text-xs truncate">{t.cliente?.nome || '—'}</td>
                    <td className="table-cell text-brand-silver/60 text-xs truncate">{t.processo ? `${t.processo.numero_processo || ''} ${t.processo.titulo_interno}`.trim() : '—'}</td>
                    <td className="table-cell"><span className={`badge text-xs ${prioridadeColor[t.prioridade]}`}>{t.prioridade}</span></td>
                    <td className="table-cell text-brand-silver/50 text-xs">{t.data_limite ? formatDate(t.data_limite) : '—'}</td>
                    <td className="table-cell">
                      <button onClick={() => toggleStatus(t)} className={`badge text-xs cursor-pointer ${statusColor[t.status]}`}>
                        {t.status === 'em_andamento' ? 'Em andamento' : t.status === 'concluida' ? 'Concluída' : 'Pendente'}
                      </button>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => { setForm({ titulo: t.titulo, descricao: t.descricao || '', cliente_id: t.cliente_id || '', processo_id: t.processo_id || '', prioridade: t.prioridade, status: t.status, data_limite: t.data_limite || '', observacoes: t.observacoes || '' }); setEditingId(t.id); setShowForm(true) }} className="p-1 hover:text-brand-silver text-brand-silver/40 text-xs">✎</button>
                        <button onClick={async () => { if (confirm('Excluir?')) { await supabase.from('tarefas').delete().eq('id', t.id); loadData() } }} className="p-1 hover:text-status-red text-brand-silver/40"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <TarefaModal
          show={showForm}
          editingId={editingId}
          form={form}
          setForm={setForm}
          clientes={clientes}
          processos={processos}
          saving={saving}
          onSave={save}
          onClose={() => setShowForm(false)}
        />
      </div>
    </div>
  )
}

'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatDate } from '@/lib/utils'
import { Plus, X, Save, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { descricao: '', data: '', hora: '', processo_id: '', cliente_id: '', responsavel: 'Carol Silva Lopes', status: 'pendente', observacoes: '' }

export default function PrazosPage() {
  const [prazos, setPrazos] = useState<any[]>([])
  const [processos, setProcessos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: p }, { data: proc }, { data: cl }] = await Promise.all([
      supabase.from('prazos').select('*, processo:processos(titulo_interno, numero_processo), cliente:clientes(nome)').order('data'),
      supabase.from('processos').select('id, titulo_interno, numero_processo').order('titulo_interno'),
      supabase.from('clientes').select('id, nome').order('nome'),
    ])
    setPrazos(p || [])
    setProcessos(proc || [])
    setClientes(cl || [])
    setLoading(false)
  }

  const hoje = new Date().toISOString().split('T')[0]
  const em7dias = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]

  const filtered = prazos.filter(p => {
    if (filtro === 'vencendo') return p.status === 'pendente' && p.data <= em7dias
    if (filtro === 'vencidos') return p.status === 'pendente' && p.data < hoje
    if (filtro === 'concluidos') return p.status === 'concluido'
    return true
  })

  const stats = {
    vencendo: prazos.filter(p => p.status === 'pendente' && p.data <= em7dias).length,
    proximos: prazos.filter(p => p.status === 'pendente' && p.data > hoje).length,
    concluidos: prazos.filter(p => p.status === 'concluido').length,
  }

  async function savePrazo() {
    if (!form.descricao || !form.data) { toast.error('Descrição e data são obrigatórios'); return }
    setSaving(true)
    const payload = { ...form, processo_id: form.processo_id || null, cliente_id: form.cliente_id || null, hora: form.hora || null }
    let error
    if (editingId) {
      const res = await supabase.from('prazos').update(payload).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('prazos').insert(payload)
      error = res.error
    }
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success(editingId ? 'Prazo atualizado!' : 'Prazo cadastrado!'); setShowForm(false); loadData() }
    setSaving(false)
  }

  async function toggleStatus(p: any) {
    const newStatus = p.status === 'concluido' ? 'pendente' : 'concluido'
    await supabase.from('prazos').update({ status: newStatus }).eq('id', p.id)
    loadData()
  }

  async function deletePrazo(id: string) {
    if (!confirm('Excluir este prazo?')) return
    await supabase.from('prazos').delete().eq('id', id)
    toast.success('Prazo excluído'); loadData()
  }

  const F = ({ label, children }: any) => (<div className="flex flex-col gap-1"><label className="label">{label}</label>{children}</div>)

  const rowColor = (p: any) => {
    if (p.status === 'concluido') return 'opacity-50'
    if (p.data < hoje && p.status === 'pendente') return 'border-l-2 border-l-status-red'
    if (p.data <= em7dias && p.status === 'pendente') return 'border-l-2 border-l-status-amber'
    return ''
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Prazos Processuais" />
      <div className="p-6">
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="metric-card amber"><div className="label">Vencendo (7 dias)</div><div className="font-serif text-3xl text-white">{stats.vencendo}</div></div>
          <div className="metric-card"><div className="label">Próximos</div><div className="font-serif text-3xl text-white">{stats.proximos}</div></div>
          <div className="metric-card green"><div className="label">Concluídos</div><div className="font-serif text-3xl text-white">{stats.concluidos}</div></div>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex gap-2">
            {[['todos','Todos'],['vencendo','Vencendo'],['vencidos','Vencidos'],['concluidos','Concluídos']].map(([k,l]) => (
              <button key={k} onClick={() => setFiltro(k)} className={`btn-primary text-xs py-1.5 ${filtro === k ? 'border-brand-silver/40 text-brand-silver bg-brand-silver/5' : ''}`}>{l}</button>
            ))}
          </div>
          <div className="flex-1" />
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}><Plus size={13} /> Novo prazo</button>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full" style={{tableLayout:'fixed'}}>
            <thead>
              <tr className="border-b border-brand-silver/8">
                <th className="table-header" style={{width:'22%'}}>Descrição</th>
                <th className="table-header" style={{width:'22%'}}>Processo vinculado</th>
                <th className="table-header" style={{width:'16%'}}>Cliente</th>
                <th className="table-header" style={{width:'12%'}}>Data</th>
                <th className="table-header" style={{width:'8%'}}>Hora</th>
                <th className="table-header" style={{width:'12%'}}>Status</th>
                <th className="table-header" style={{width:'8%'}}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-cell text-center text-brand-silver/30 py-8">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center text-brand-silver/30 py-8">Nenhum prazo encontrado.</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className={`table-row ${rowColor(p)}`}>
                  <td className="table-cell text-white text-xs font-medium truncate">{p.descricao}</td>
                  <td className="table-cell text-brand-silver/60 text-xs truncate">
                    {p.processo ? `${p.processo.numero_processo || ''} ${p.processo.titulo_interno}`.trim() : '—'}
                  </td>
                  <td className="table-cell text-brand-silver/60 text-xs truncate">{p.cliente?.nome || '—'}</td>
                  <td className={`table-cell text-xs font-medium ${p.data < hoje && p.status === 'pendente' ? 'text-status-red' : p.data <= em7dias && p.status === 'pendente' ? 'text-status-amber' : 'text-brand-silver/70'}`}>{formatDate(p.data)}</td>
                  <td className="table-cell text-brand-silver/50 text-xs">{p.hora ? p.hora.slice(0,5) : '—'}</td>
                  <td className="table-cell">
                    <button onClick={() => toggleStatus(p)} className={`badge text-xs cursor-pointer transition-colors ${p.status === 'concluido' ? 'text-status-green border-status-green/25 bg-status-green/7' : p.data < hoje ? 'text-status-red border-status-red/25 bg-status-red/7' : 'text-status-amber border-status-amber/25 bg-status-amber/7'}`}>
                      {p.status === 'concluido' ? 'Concluído' : p.data < hoje ? 'Vencido' : 'Pendente'}
                    </button>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => { setForm({descricao:p.descricao,data:p.data,hora:p.hora||'',processo_id:p.processo_id||'',cliente_id:p.cliente_id||'',responsavel:p.responsavel||'Carol Silva Lopes',status:p.status,observacoes:p.observacoes||''}); setEditingId(p.id); setShowForm(true) }} className="p-1 hover:text-brand-silver text-brand-silver/40"><Edit2 size={12} /></button>
                      <button onClick={() => deletePrazo(p.id)} className="p-1 hover:text-status-red text-brand-silver/40"><Trash2 size={12} /></button>
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
                <h2 className="font-serif text-brand-silver text-lg">{editingId ? 'Editar prazo' : 'Novo prazo'}</h2>
                <button onClick={() => setShowForm(false)}><X size={16} className="text-brand-silver/50" /></button>
              </div>
              <div className="mb-3"><F label="Descrição *"><input className="input-field" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} /></F></div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <F label="Data *"><input className="input-field" type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} /></F>
                <F label="Hora"><input className="input-field" type="time" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} /></F>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <F label="Processo vinculado">
                  <select className="input-field" value={form.processo_id} onChange={e => setForm({...form, processo_id: e.target.value})}>
                    <option value="">Nenhum</option>
                    {processos.map(p => <option key={p.id} value={p.id}>{p.numero_processo ? `${p.numero_processo} — ` : ''}{p.titulo_interno}</option>)}
                  </select>
                </F>
                <F label="Cliente vinculado">
                  <select className="input-field" value={form.cliente_id} onChange={e => setForm({...form, cliente_id: e.target.value})}>
                    <option value="">Nenhum</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <F label="Status">
                  <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="pendente">Pendente</option>
                    <option value="concluido">Concluído</option>
                    <option value="vencido">Vencido</option>
                  </select>
                </F>
                <F label="Responsável"><input className="input-field" value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} /></F>
              </div>
              <F label="Observações"><textarea className="input-field min-h-16 resize-none" value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})} /></F>
              <div className="flex gap-3 mt-5">
                <button className="btn-primary flex-1 justify-center" onClick={savePrazo} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Salvar prazo'}</button>
                <button className="btn-primary" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

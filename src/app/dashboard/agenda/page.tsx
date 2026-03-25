'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatDate } from '@/lib/utils'
import { Plus, X, Save, Trash2, CalendarPlus } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { titulo: '', descricao: '', tipo: 'profissional', data: '', hora_inicio: '', hora_fim: '', local: '', cliente_id: '', processo_id: '' }

const tipoColor: Record<string, string> = {
  audiencia: 'border-l-status-red', prazo: 'border-l-status-amber',
  tarefa: 'border-l-status-blue', profissional: 'border-l-status-green', pessoal: 'border-l-brand-silver/40',
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1"><label className="label">{label}</label>{children}</div>
)

function AgendaModal({ clientesLista, processosLista, onClose, onSaved }: any) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }))

  async function save() {
    if (!form.titulo || !form.data) { toast.error('Título e data obrigatórios'); return }
    setSaving(true)
    const payload = { ...form, cliente_id: form.cliente_id || null, processo_id: form.processo_id || null, hora_inicio: form.hora_inicio || null, hora_fim: form.hora_fim || null }
    const { error } = await supabase.from('agenda').insert(payload)
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Salvo!'); onSaved() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-brand-silver text-lg">Novo compromisso</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50" /></button>
        </div>
        <div className="mb-3"><F label="Título *"><input className="input-field" value={form.titulo} onChange={e => set('titulo', e.target.value)} /></F></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Tipo">
            <select className="input-field" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              <option value="profissional">Profissional</option><option value="pessoal">Pessoal</option>
            </select>
          </F>
          <F label="Data *"><input className="input-field" type="date" value={form.data} onChange={e => set('data', e.target.value)} /></F>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Hora início"><input className="input-field" type="time" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)} /></F>
          <F label="Hora fim"><input className="input-field" type="time" value={form.hora_fim} onChange={e => set('hora_fim', e.target.value)} /></F>
        </div>
        <div className="mb-3"><F label="Local"><input className="input-field" value={form.local} onChange={e => set('local', e.target.value)} /></F></div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Cliente (opcional)">
            <select className="input-field" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
              <option value="">Nenhum</option>
              {clientesLista.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </F>
          <F label="Processo (opcional)">
            <select className="input-field" value={form.processo_id} onChange={e => set('processo_id', e.target.value)}>
              <option value="">Nenhum</option>
              {processosLista.map((p: any) => <option key={p.id} value={p.id}>{p.titulo_interno}</option>)}
            </select>
          </F>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function addToGoogleCalendar(ev: any) {
  const fmt = (date: string, time?: string | null) => {
    const d = date.replace(/-/g, '')
    if (time) return `${d}T${time.replace(/:/g, '').slice(0, 6).padEnd(6, '0')}`
    return d
  }
  const start = fmt(ev.data, ev.hora_inicio)
  const end = ev.hora_fim ? fmt(ev.data, ev.hora_fim) : (ev.hora_inicio ? fmt(ev.data, ev.hora_inicio) : fmt(ev.data))
  const details = [ev.descricao, ev.processo?.titulo_interno, ev.cliente?.nome].filter(Boolean).join('\n')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.titulo,
    dates: `${start}/${end}`,
    details: details,
    location: ev.local || '',
  })
  window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank')
}

export default function AgendaPage() {
  const [eventos, setEventos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [processos, setProcessos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: ev }, { data: procs }, { data: aud }, { data: prazos }, { data: clts }] = await Promise.all([
      supabase.from('agenda').select('*, cliente:clientes(nome), processo:processos(titulo_interno)').order('data').order('hora_inicio'),
      supabase.from('processos').select('id,titulo_interno').order('titulo_interno'),
      supabase.from('audiencias').select('id,tipo,data,hora,local,processo:processos(titulo_interno)').eq('status', 'agendada').gte('data', new Date().toISOString().split('T')[0]).order('data'),
      supabase.from('prazos').select('id,descricao,data,hora,processo:processos(titulo_interno)').eq('status', 'pendente').order('data'),
      supabase.from('clientes').select('id,nome').order('nome'),
    ])
    const audEventos = (aud || []).map((a: any) => ({ id: 'aud-' + a.id, titulo: `Audiência — ${a.tipo}`, tipo: 'audiencia', data: a.data, hora_inicio: a.hora, local: a.local, processo: a.processo, isReadonly: true }))
    const prazoEventos = (prazos || []).map((p: any) => ({ id: 'pz-' + p.id, titulo: `Prazo — ${p.descricao}`, tipo: 'prazo', data: p.data, hora_inicio: p.hora, processo: p.processo, isReadonly: true }))
    const all = [...(ev || []).map((e: any) => ({ ...e, isReadonly: false })), ...audEventos, ...prazoEventos]
    all.sort((a, b) => a.data < b.data ? -1 : a.data > b.data ? 1 : 0)
    setEventos(all)
    setProcessos(procs || [])
    setClientes(clts || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const grouped: Record<string, any[]> = {}
  eventos.forEach(ev => { if (!grouped[ev.data]) grouped[ev.data] = []; grouped[ev.data].push(ev) })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Agenda Interna" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex gap-4 flex-wrap">
            {[['audiencia', 'Audiência', 'bg-status-red'], ['prazo', 'Prazo', 'bg-status-amber'], ['profissional', 'Profissional', 'bg-status-green'], ['pessoal', 'Pessoal', 'bg-brand-silver/40']].map(([k, l, c]) => (
              <div key={k} className="flex items-center gap-2 text-xs text-brand-silver/50"><div className={`w-2 h-2 ${c}`}></div>{l}</div>
            ))}
          </div>
          <div className="flex-1" />
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={13} /> Novo compromisso</button>
        </div>
        <div className="flex flex-col gap-4">
          {loading ? <div className="text-brand-silver/30 text-sm text-center py-8">Carregando...</div>
            : Object.keys(grouped).length === 0 ? <div className="text-brand-silver/30 text-sm text-center py-8">Nenhum evento na agenda.</div>
            : Object.entries(grouped).map(([data, evs]) => (
              <div key={data}>
                <div className="text-brand-silver/30 text-xs uppercase tracking-widest mb-2 pb-1 border-b border-brand-silver/6" style={{ fontSize: '10px', letterSpacing: '2px' }}>{formatDate(data)}</div>
                <div className="flex flex-col gap-2">
                  {evs.map(ev => (
                    <div key={ev.id} className={`card border-l-2 ${tipoColor[ev.tipo] || 'border-l-brand-silver/20'} flex items-center gap-4 py-3`}>
                      <div className="text-brand-silver/35 text-xs min-w-16">{ev.hora_inicio ? ev.hora_inicio.slice(0, 5) : '—'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-medium">{ev.titulo}</div>
                        {(ev.cliente?.nome || ev.processo?.titulo_interno || ev.local) && (
                          <div className="text-brand-silver/35 text-xs mt-0.5">{[ev.local, ev.cliente?.nome, ev.processo?.titulo_interno].filter(Boolean).join(' · ')}</div>
                        )}
                      </div>
                      <span className="badge text-xs text-brand-silver/40 border-brand-silver/15 capitalize">{ev.tipo}</span>
                      <button
                        onClick={() => addToGoogleCalendar(ev)}
                        className="p-1 hover:text-status-blue text-brand-silver/30 transition-colors"
                        title="Adicionar ao Google Agenda"
                      >
                        <CalendarPlus size={12} />
                      </button>
                      {!ev.isReadonly && (
                        <button onClick={async () => { if (confirm('Excluir?')) { await supabase.from('agenda').delete().eq('id', ev.id); loadData() } }} className="p-1 hover:text-status-red text-brand-silver/30"><Trash2 size={12} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
        {showForm && (
          <AgendaModal
            clientesLista={clientes}
            processosLista={processos}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); loadData() }}
          />
        )}
      </div>
    </div>
  )
}

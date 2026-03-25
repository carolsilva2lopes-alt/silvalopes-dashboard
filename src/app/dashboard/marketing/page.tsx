'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatDate, AREAS_DIREITO } from '@/lib/utils'
import { Plus, X, Save, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { headline: '', legenda: '', roteiro: '', formato: 'reels', area_direito: '', status: 'planejado', data_prevista: '', plataforma: 'instagram', observacoes: '' }

const statusColor: Record<string, string> = { planejado: 'text-brand-silver/40 border-brand-silver/15', em_producao: 'text-status-amber border-status-amber/25 bg-status-amber/7', pronto: 'text-status-green border-status-green/25 bg-status-green/7', publicado: 'text-status-blue border-status-blue/25 bg-status-blue/7', cancelado: 'text-status-red border-status-red/25' }
const statusBar: Record<string, string> = { planejado: 'bg-brand-silver/20', em_producao: 'bg-status-amber', pronto: 'bg-status-green', publicado: 'bg-status-blue', cancelado: 'bg-status-red' }

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1"><label className="label">{label}</label>{children}</div>
)

interface MarketingModalProps {
  show: boolean
  editingId: string | null
  form: any
  setForm: (f: any) => void
  saving: boolean
  onSave: () => void
  onClose: () => void
}

function MarketingModal({ show, editingId, form, setForm, saving, onSave, onClose }: MarketingModalProps) {
  if (!show) return null
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-brand-silver text-lg">{editingId ? 'Editar conteúdo' : 'Novo conteúdo'}</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50" /></button>
        </div>
        <div className="mb-3"><F label="Headline *"><input className="input-field" value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Título do conteúdo" /></F></div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <F label="Formato">
            <select className="input-field" value={form.formato} onChange={e => setForm({ ...form, formato: e.target.value })}>
              <option value="reels">Reels</option>
              <option value="carrossel">Carrossel</option>
              <option value="story">Story</option>
              <option value="post_estatico">Post estático</option>
              <option value="outro">Outro</option>
            </select>
          </F>
          <F label="Status">
            <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="planejado">Planejado</option>
              <option value="em_producao">Em produção</option>
              <option value="pronto">Pronto</option>
              <option value="publicado">Publicado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </F>
          <F label="Data prevista"><input className="input-field" type="date" value={form.data_prevista} onChange={e => setForm({ ...form, data_prevista: e.target.value })} /></F>
        </div>
        <div className="mb-3">
          <F label="Área do Direito">
            <select className="input-field" value={form.area_direito} onChange={e => setForm({ ...form, area_direito: e.target.value })}>
              <option value="">Geral</option>
              {AREAS_DIREITO.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </F>
        </div>
        <div className="mb-3"><F label="Legenda"><textarea className="input-field min-h-20 resize-none" value={form.legenda} onChange={e => setForm({ ...form, legenda: e.target.value })} /></F></div>
        <F label="Roteiro (para Reels)"><textarea className="input-field min-h-20 resize-none" value={form.roteiro} onChange={e => setForm({ ...form, roteiro: e.target.value })} /></F>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={onSave} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function MarketingPage() {
  const [conteudos, setConteudos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase.from('marketing_conteudos').select('*').order('data_prevista')
    setConteudos(data || [])
    setLoading(false)
  }

  const filtered = conteudos.filter(c => filtro === 'todos' ? true : c.status === filtro)

  async function save() {
    if (!form.headline) { toast.error('Headline obrigatória'); return }
    setSaving(true)
    const payload = { ...form, data_prevista: form.data_prevista || null }
    let error
    if (editingId) { const r = await supabase.from('marketing_conteudos').update(payload).eq('id', editingId); error = r.error }
    else { const r = await supabase.from('marketing_conteudos').insert(payload); error = r.error }
    if (error) toast.error('Erro: ' + error.message)
    else { toast.success('Salvo!'); setShowForm(false); loadData() }
    setSaving(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Marketing" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex gap-2 flex-wrap">
            {[['todos', 'Todos'], ['planejado', 'Planejado'], ['em_producao', 'Em produção'], ['pronto', 'Pronto'], ['publicado', 'Publicado']].map(([k, l]) => (
              <button key={k} onClick={() => setFiltro(k)} className={`btn-primary text-xs py-1.5 ${filtro === k ? 'border-brand-silver/40 text-brand-silver bg-brand-silver/5' : ''}`}>{l}</button>
            ))}
          </div>
          <div className="flex-1" />
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}><Plus size={13} /> Novo conteúdo</button>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? <div className="text-brand-silver/30 text-sm text-center py-8">Carregando...</div>
            : filtered.length === 0 ? <div className="card text-brand-silver/30 text-sm text-center py-8">Nenhum conteúdo encontrado.</div>
            : filtered.map(c => (
              <div key={c.id} className="card flex items-start gap-4">
                <div className={`w-1 self-stretch flex-shrink-0 ${statusBar[c.status]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{c.headline}</div>
                      {c.legenda && <div className="text-brand-silver/40 text-xs mt-1 line-clamp-2">{c.legenda}</div>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge text-xs ${statusColor[c.status]}`}>{c.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {c.formato && <span className="text-xs text-brand-silver/35 uppercase tracking-wider">{c.formato}</span>}
                    {c.area_direito && <span className="text-xs text-brand-silver/35">{c.area_direito}</span>}
                    {c.data_prevista && <span className="text-xs text-brand-silver/35">{formatDate(c.data_prevista)}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setForm({ headline: c.headline, legenda: c.legenda || '', roteiro: c.roteiro || '', formato: c.formato, area_direito: c.area_direito || '', status: c.status, data_prevista: c.data_prevista || '', plataforma: c.plataforma || 'instagram', observacoes: c.observacoes || '' }); setEditingId(c.id); setShowForm(true) }} className="p-1 hover:text-brand-silver text-brand-silver/40"><Edit2 size={12} /></button>
                  <button onClick={async () => { if (confirm('Excluir?')) { await supabase.from('marketing_conteudos').delete().eq('id', c.id); loadData() } }} className="p-1 hover:text-status-red text-brand-silver/40"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
        </div>

        <MarketingModal
          show={showForm}
          editingId={editingId}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={save}
          onClose={() => setShowForm(false)}
        />
      </div>
    </div>
  )
}

'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatDate, AREAS_DIREITO } from '@/lib/utils'
import { Plus, X, Save, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

const ETAPAS = [
  { key: 'lead', label: 'Lead' },
  { key: 'qualificacao', label: 'Em qualificação' },
  { key: 'ag_contrato', label: 'Ag. contrato' },
  { key: 'ag_assinatura', label: 'Ag. assinatura' },
  { key: 'contrato_assinado', label: 'Contrato assinado' },
  { key: 'peticionamento', label: 'Peticionamento' },
  { key: 'encerrado', label: 'Encerrado' },
]

const emptyForm = {
  nome: '', telefone: '', email: '', cpf: '', cnpj: '',
  origem: '', area_direito: '', etapa: 'lead',
  observacoes: '', responsavel: '', proxima_acao: '',
}

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className="label">{label}</label>
    {children}
  </div>
)

function LeadModal({ editingId, initialForm, onClose, onSaved }: any) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    let error
    if (editingId) {
      const res = await supabase.from('leads').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('leads').insert(form)
      error = res.error
    }
    if (error) toast.error('Erro ao salvar: ' + error.message)
    else { toast.success(editingId ? 'Lead atualizado!' : 'Lead cadastrado!'); onSaved() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-brand-silver text-lg">{editingId ? 'Editar lead' : 'Novo lead'}</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50 hover:text-brand-silver" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Nome *"><input className="input-field" value={form.nome} onChange={e => setForm((f: any) => ({ ...f, nome: e.target.value }))} /></F>
          <F label="Telefone"><input className="input-field" value={form.telefone} onChange={e => setForm((f: any) => ({ ...f, telefone: e.target.value }))} /></F>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="E-mail"><input className="input-field" type="email" value={form.email} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></F>
          <F label="CPF"><input className="input-field" value={form.cpf} onChange={e => setForm((f: any) => ({ ...f, cpf: e.target.value }))} /></F>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Área do Direito">
            <select className="input-field" value={form.area_direito} onChange={e => setForm((f: any) => ({ ...f, area_direito: e.target.value }))}>
              <option value="">Selecionar...</option>
              {AREAS_DIREITO.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </F>
          <F label="Etapa">
            <select className="input-field" value={form.etapa} onChange={e => setForm((f: any) => ({ ...f, etapa: e.target.value }))}>
              {ETAPAS.map(et => <option key={et.key} value={et.key}>{et.label}</option>)}
            </select>
          </F>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Origem"><input className="input-field" value={form.origem} onChange={e => setForm((f: any) => ({ ...f, origem: e.target.value }))} placeholder="Instagram, indicação..." /></F>
          <F label="Próxima ação"><input className="input-field" value={form.proxima_acao} onChange={e => setForm((f: any) => ({ ...f, proxima_acao: e.target.value }))} /></F>
        </div>
        <F label="Observações"><textarea className="input-field min-h-16 resize-none" value={form.observacoes} onChange={e => setForm((f: any) => ({ ...f, observacoes: e.target.value }))} /></F>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving}>
            <Save size={13} /> {saving ? 'Salvando...' : 'Salvar lead'}
          </button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function CRMPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialForm, setInitialForm] = useState<any>(emptyForm)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  const stats = {
    total: leads.length,
    fechados: leads.filter(l => l.etapa === 'contrato_assinado' || l.etapa === 'peticionamento').length,
    ag_contrato: leads.filter(l => l.etapa === 'ag_contrato').length,
    encerrados: leads.filter(l => l.etapa === 'encerrado').length,
  }

  async function updateEtapa(id: string, etapa: string) {
    await supabase.from('leads').update({ etapa, updated_at: new Date().toISOString() }).eq('id', id)
    loadLeads()
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="CRM / Comercial" />
      <div className="p-6">
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="metric-card"><div className="label">Total leads</div><div className="font-serif text-3xl text-white">{stats.total}</div></div>
          <div className="metric-card green"><div className="label">Fechados</div><div className="font-serif text-3xl text-white">{stats.fechados}</div><div className="text-xs text-status-green mt-1">{stats.total ? Math.round(stats.fechados / stats.total * 100) : 0}% conversão</div></div>
          <div className="metric-card amber"><div className="label">Ag. contrato</div><div className="font-serif text-3xl text-white">{stats.ag_contrato}</div></div>
          <div className="metric-card"><div className="label">Encerrados</div><div className="font-serif text-3xl text-white">{stats.encerrados}</div></div>
        </div>

        <button className="btn-primary mb-5" onClick={() => { setInitialForm(emptyForm); setEditingId(null); setShowForm(true) }}>
          <Plus size={13} /> Novo lead
        </button>

        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${ETAPAS.length}, minmax(140px, 1fr))` }}>
          {ETAPAS.map(etapa => {
            const cards = leads.filter(l => l.etapa === etapa.key)
            return (
              <div key={etapa.key} className="bg-brand-dark border border-brand-silver/7 p-3 min-h-48">
                <div className="text-brand-silver/35 text-xs uppercase tracking-widest mb-3 pb-2 border-b border-brand-silver/6 flex items-center justify-between" style={{ fontSize: '9px', letterSpacing: '1.5px' }}>
                  {etapa.label}
                  <span className="bg-brand-silver/10 text-brand-silver/40 px-1.5 py-0.5 text-xs">{cards.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {cards.map(lead => (
                    <div key={lead.id} className="bg-brand-surface border border-brand-silver/8 p-2.5 cursor-pointer hover:border-brand-silver/20 transition-colors">
                      <div className="text-white text-xs font-medium mb-1 truncate">{lead.nome}</div>
                      {lead.area_direito && <div className="text-brand-silver/40 text-xs truncate mb-2" style={{ fontSize: '10px' }}>{lead.area_direito}</div>}
                      <div className="text-brand-silver/25 text-xs" style={{ fontSize: '9px' }}>{formatDate(lead.created_at)}</div>
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => { setInitialForm({ ...emptyForm, ...lead }); setEditingId(lead.id); setShowForm(true) }} className="p-0.5 hover:text-brand-silver text-brand-silver/30 transition-colors"><Edit2 size={10} /></button>
                        <select
                          className="flex-1 bg-brand-dark border border-brand-silver/10 text-brand-silver/40 text-xs px-1 py-0.5 outline-none"
                          style={{ fontSize: '9px' }}
                          value={lead.etapa}
                          onChange={e => updateEtapa(lead.id, e.target.value)}
                        >
                          {ETAPAS.map(et => <option key={et.key} value={et.key}>{et.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {showForm && (
          <LeadModal
            editingId={editingId}
            initialForm={initialForm}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); loadLeads() }}
          />
        )}
      </div>
    </div>
  )
}

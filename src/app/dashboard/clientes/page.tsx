'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatDate, getStatusColor, AREAS_DIREITO, ESTADOS_BR } from '@/lib/utils'
import { Plus, Search, X, Save, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = {
  tipo: 'pf', nome: '', razao_social: '', nome_fantasia: '',
  cpf: '', cnpj: '', data_nascimento: '', telefone: '', email: '',
  endereco: '', cidade: '', estado: '', cep: '',
  area_direito: '', tipo_honorario: 'exito', status: 'ativo',
  parceria: false, advogado_parceiro: '', percentual_parceiro: '', observacoes: '',
}

const F = ({ label, children }: any) => (
  <div className="flex flex-col gap-1"><label className="label">{label}</label>{children}</div>
)

function ClienteModal({ editingId, initialForm, onClose, onSaved, clientes }: any) {
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: any) => setForm((f: any) => ({...f, [field]: value}))

  async function save() {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    const payload = { ...form, percentual_parceiro: form.percentual_parceiro ? parseFloat(form.percentual_parceiro) : null, data_nascimento: form.data_nascimento || null }
    let error
    if (editingId) { const r = await supabase.from('clientes').update(payload).eq('id', editingId); error = r.error }
    else { const r = await supabase.from('clientes').insert(payload); error = r.error }
    if (error) toast.error('Erro ao salvar: ' + error.message)
    else { toast.success(editingId ? 'Cliente atualizado!' : 'Cliente cadastrado!'); onSaved() }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto" onClick={e => { if(e.target === e.currentTarget) onClose() }}>
      <div className="bg-brand-surface border border-brand-silver/15 w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-brand-silver text-lg">{editingId ? 'Editar cliente' : 'Novo cliente'}</h2>
          <button onClick={onClose}><X size={16} className="text-brand-silver/50 hover:text-brand-silver" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Tipo"><select className="input-field" value={form.tipo} onChange={e => set('tipo', e.target.value)}><option value="pf">Pessoa Física</option><option value="pj">Pessoa Jurídica</option></select></F>
          <F label="Status"><select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}><option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="concluido">Concluído</option></select></F>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label={form.tipo === 'pj' ? 'Razão Social *' : 'Nome completo *'}>
            <input className="input-field" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo" autoFocus />
          </F>
          {form.tipo === 'pf' ? (
            <F label="Data de nascimento"><input className="input-field" type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} /></F>
          ) : (
            <F label="Nome Fantasia"><input className="input-field" value={form.nome_fantasia} onChange={e => set('nome_fantasia', e.target.value)} /></F>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {form.tipo === 'pf' ? (
            <F label="CPF"><input className="input-field" value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" /></F>
          ) : (
            <F label="CNPJ"><input className="input-field" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" /></F>
          )}
          <F label="Telefone"><input className="input-field" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(62) 99999-9999" /></F>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="E-mail"><input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></F>
          <F label="Área do Direito">
            <select className="input-field" value={form.area_direito} onChange={e => set('area_direito', e.target.value)}>
              <option value="">Selecionar...</option>
              {AREAS_DIREITO.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </F>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Tipo de Honorários">
            <select className="input-field" value={form.tipo_honorario} onChange={e => set('tipo_honorario', e.target.value)}>
              <option value="exito">Honorários de Êxito</option>
              <option value="inicial_exito">Inicial + Êxito</option>
              <option value="outro">Outro</option>
            </select>
          </F>
          <F label="Estado">
            <select className="input-field" value={form.estado} onChange={e => set('estado', e.target.value)}>
              <option value="">Selecionar...</option>
              {ESTADOS_BR.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </F>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <F label="Cidade"><input className="input-field" value={form.cidade} onChange={e => set('cidade', e.target.value)} /></F>
          <F label="Endereço"><input className="input-field" value={form.endereco} onChange={e => set('endereco', e.target.value)} /></F>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <input type="checkbox" id="parceria" checked={form.parceria} onChange={e => set('parceria', e.target.checked)} className="accent-brand-silver" />
          <label htmlFor="parceria" className="text-brand-silver/60 text-sm cursor-pointer">Caso em parceria</label>
        </div>
        {form.parceria && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            <F label="Advogado parceiro"><input className="input-field" value={form.advogado_parceiro} onChange={e => set('advogado_parceiro', e.target.value)} /></F>
            <F label="% do parceiro"><input className="input-field" type="number" min="0" max="100" value={form.percentual_parceiro} onChange={e => set('percentual_parceiro', e.target.value)} /></F>
          </div>
        )}
        <F label="Observações"><textarea className="input-field min-h-20 resize-none" value={form.observacoes} onChange={e => set('observacoes', e.target.value)} /></F>
        <div className="flex gap-3 mt-5">
          <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Salvar cliente'}</button>
          <button className="btn-primary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [initialForm, setInitialForm] = useState<any>(emptyForm)

  const loadClientes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadClientes() }, [loadClientes])

  const filtered = clientes.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpf?.includes(busca) ||
    c.email?.toLowerCase().includes(busca.toLowerCase()) ||
    c.area_direito?.toLowerCase().includes(busca.toLowerCase())
  )

  function openNew() { setInitialForm(emptyForm); setEditingId(null); setShowForm(true) }

  function openEdit(c: any) {
    setInitialForm({
      tipo: c.tipo||'pf', nome: c.nome||'', razao_social: c.razao_social||'',
      nome_fantasia: c.nome_fantasia||'', cpf: c.cpf||'', cnpj: c.cnpj||'',
      data_nascimento: c.data_nascimento||'', telefone: c.telefone||'',
      email: c.email||'', endereco: c.endereco||'', cidade: c.cidade||'',
      estado: c.estado||'', cep: c.cep||'', area_direito: c.area_direito||'',
      tipo_honorario: c.tipo_honorario||'exito', status: c.status||'ativo',
      parceria: c.parceria||false, advogado_parceiro: c.advogado_parceiro||'',
      percentual_parceiro: c.percentual_parceiro||'', observacoes: c.observacoes||'',
    })
    setEditingId(c.id)
    setShowForm(true)
  }

  async function deleteCliente(id: string) {
    if (!confirm('Excluir este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    toast.success('Cliente excluído'); loadClientes()
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Clientes" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-silver/30" />
            <input className="input-field pl-8" placeholder="Buscar por nome, CPF, e-mail ou área..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={openNew}><Plus size={13} /> Novo cliente</button>
        </div>
        <div className="card p-0 overflow-hidden">
          <table className="w-full" style={{tableLayout:'fixed'}}>
            <thead>
              <tr className="border-b border-brand-silver/8">
                <th className="table-header" style={{width:'22%'}}>Nome</th>
                <th className="table-header" style={{width:'8%'}}>Tipo</th>
                <th className="table-header" style={{width:'20%'}}>Área do Direito</th>
                <th className="table-header" style={{width:'14%'}}>Telefone</th>
                <th className="table-header" style={{width:'14%'}}>Honorários</th>
                <th className="table-header" style={{width:'10%'}}>Status</th>
                <th className="table-header" style={{width:'8%'}}>Parceria</th>
                <th className="table-header" style={{width:'6%'}}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="table-cell text-center text-brand-silver/30 py-8">Carregando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={8} className="table-cell text-center text-brand-silver/30 py-8">{busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</td></tr>
              : filtered.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-cell text-white font-medium truncate">{c.nome}</td>
                  <td className="table-cell uppercase text-xs text-brand-silver/50">{c.tipo}</td>
                  <td className="table-cell text-brand-silver/60 text-xs truncate">{c.area_direito || '—'}</td>
                  <td className="table-cell text-brand-silver/60 text-xs">{c.telefone || '—'}</td>
                  <td className="table-cell text-xs text-brand-silver/60">{c.tipo_honorario === 'exito' ? 'Êxito' : c.tipo_honorario === 'inicial_exito' ? 'Inicial + Êxito' : c.tipo_honorario || '—'}</td>
                  <td className="table-cell"><span className={`badge text-xs ${getStatusColor(c.status)}`}>{c.status}</span></td>
                  <td className="table-cell text-xs">{c.parceria ? <span className="badge text-status-amber border-status-amber/25 bg-status-amber/7 text-xs">Sim</span> : <span className="text-brand-silver/30">—</span>}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1 hover:text-brand-silver text-brand-silver/40"><Edit2 size={12} /></button>
                      <button onClick={() => deleteCliente(c.id)} className="p-1 hover:text-status-red text-brand-silver/40"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showForm && <ClienteModal editingId={editingId} initialForm={initialForm} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadClientes() }} clientes={clientes} />}
      </div>
    </div>
  )
}

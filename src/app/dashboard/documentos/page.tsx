'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatDate } from '@/lib/utils'
import { Plus, X, Save, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { nome: '', tipo: 'contrato', descricao: '', arquivo_url: '', cliente_id: '', processo_id: '', data_documento: '' }

export default function DocumentosPage() {
  const [docs, setDocs] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [processos, setProcessos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: d }, { data: c }, { data: p }] = await Promise.all([
      supabase.from('documentos').select('*, cliente:clientes(nome), processo:processos(titulo_interno,numero_processo)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('id,nome').order('nome'),
      supabase.from('processos').select('id,titulo_interno,numero_processo').order('titulo_interno'),
    ])
    setDocs(d||[])
    setClientes(c||[])
    setProcessos(p||[])
    setLoading(false)
  }

  const tipoLabel: Record<string,string> = { contrato:'Contrato', procuracao:'Procuração', declaracao:'Declaração', peticao:'Petição', documento_pessoal:'Doc. Pessoal', outro:'Outro' }
  const tipoColor: Record<string,string> = { contrato:'text-status-blue border-status-blue/25 bg-status-blue/7', procuracao:'text-status-green border-status-green/25 bg-status-green/7', declaracao:'text-status-amber border-status-amber/25 bg-status-amber/7', peticao:'text-brand-silver border-brand-silver/25', documento_pessoal:'text-brand-silver/50 border-brand-silver/15', outro:'text-brand-silver/40 border-brand-silver/12' }

  const filtered = docs.filter(d => {
    const mb = !busca || d.nome?.toLowerCase().includes(busca.toLowerCase()) || d.cliente?.nome?.toLowerCase().includes(busca.toLowerCase())
    const mt = !filtroTipo || d.tipo === filtroTipo
    return mb && mt
  })

  async function save() {
    if (!form.nome) { toast.error('Nome obrigatório'); return }
    setSaving(true)
    const payload = { ...form, cliente_id: form.cliente_id||null, processo_id: form.processo_id||null, data_documento: form.data_documento||null }
    const { error } = await supabase.from('documentos').insert(payload)
    if (error) toast.error('Erro: '+error.message)
    else { toast.success('Documento cadastrado!'); setShowForm(false); loadData() }
    setSaving(false)
  }

  const F = ({ label, children }: any) => (<div className="flex flex-col gap-1"><label className="label">{label}</label>{children}</div>)

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Central de Documentos" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-silver/30" />
            <input className="input-field pl-8" placeholder="Buscar por nome ou cliente..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <select className="input-field w-44" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            {Object.entries(tipoLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setShowForm(true) }}><Plus size={13} /> Novo documento</button>
        </div>
        <div className="card p-0 overflow-hidden">
          <table className="w-full" style={{tableLayout:'fixed'}}>
            <thead>
              <tr className="border-b border-brand-silver/8">
                <th className="table-header" style={{width:'26%'}}>Nome</th>
                <th className="table-header" style={{width:'18%'}}>Cliente</th>
                <th className="table-header" style={{width:'20%'}}>Processo</th>
                <th className="table-header" style={{width:'13%'}}>Tipo</th>
                <th className="table-header" style={{width:'13%'}}>Data</th>
                <th className="table-header" style={{width:'10%'}}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="table-cell text-center text-brand-silver/30 py-8">Carregando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} className="table-cell text-center text-brand-silver/30 py-8">Nenhum documento encontrado.</td></tr>
              : filtered.map(d => (
                <tr key={d.id} className="table-row">
                  <td className="table-cell text-white text-xs font-medium truncate">{d.nome}</td>
                  <td className="table-cell text-brand-silver/60 text-xs truncate">{d.cliente?.nome||'—'}</td>
                  <td className="table-cell text-brand-silver/60 text-xs truncate">{d.processo ? `${d.processo.numero_processo||''} ${d.processo.titulo_interno}`.trim() : '—'}</td>
                  <td className="table-cell"><span className={`badge text-xs ${tipoColor[d.tipo]||''}`}>{tipoLabel[d.tipo]||d.tipo}</span></td>
                  <td className="table-cell text-brand-silver/50 text-xs">{d.data_documento ? formatDate(d.data_documento) : formatDate(d.created_at)}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      {d.arquivo_url && <a href={d.arquivo_url} target="_blank" rel="noopener noreferrer" className="p-1 hover:text-status-blue text-brand-silver/40 text-xs">↗</a>}
                      <button onClick={async () => { if(confirm('Excluir?')) { await supabase.from('documentos').delete().eq('id',d.id); loadData() } }} className="p-1 hover:text-status-red text-brand-silver/40"><Trash2 size={12} /></button>
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
                <h2 className="font-serif text-brand-silver text-lg">Novo documento</h2>
                <button onClick={() => setShowForm(false)}><X size={16} className="text-brand-silver/50" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <F label="Nome *"><input className="input-field" value={form.nome} onChange={e => setForm({...form,nome:e.target.value})} /></F>
                <F label="Tipo"><select className="input-field" value={form.tipo} onChange={e => setForm({...form,tipo:e.target.value})}>{Object.entries(tipoLabel).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></F>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <F label="Cliente"><select className="input-field" value={form.cliente_id} onChange={e => setForm({...form,cliente_id:e.target.value})}><option value="">Nenhum</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></F>
                <F label="Processo"><select className="input-field" value={form.processo_id} onChange={e => setForm({...form,processo_id:e.target.value})}><option value="">Nenhum</option>{processos.map(p => <option key={p.id} value={p.id}>{p.titulo_interno}</option>)}</select></F>
              </div>
              <div className="mb-3"><F label="Data do documento"><input className="input-field" type="date" value={form.data_documento} onChange={e => setForm({...form,data_documento:e.target.value})} /></F></div>
              <F label="URL do arquivo (opcional)"><input className="input-field" value={form.arquivo_url} onChange={e => setForm({...form,arquivo_url:e.target.value})} placeholder="https://..." /></F>
              <div className="flex gap-3 mt-5">
                <button className="btn-primary flex-1 justify-center" onClick={save} disabled={saving}><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
                <button className="btn-primary" onClick={() => setShowForm(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

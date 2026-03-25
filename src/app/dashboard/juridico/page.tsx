'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { FileText, Scale, Brain } from 'lucide-react'

const MODELOS = [
  { titulo: 'Contrato de honorários — êxito', tipo: 'Contrato', desc: 'Modelo padrão para honorários de êxito' },
  { titulo: 'Contrato de honorários — inicial + êxito', tipo: 'Contrato', desc: 'Modelo para honorários iniciais com êxito' },
  { titulo: 'Procuração ad judicia', tipo: 'Procuração', desc: 'Poderes gerais e especiais' },
  { titulo: 'Declaração de hipossuficiência', tipo: 'Declaração', desc: 'Para fins de justiça gratuita' },
  { titulo: 'Contrato de parceria — advogado', tipo: 'Contrato', desc: 'Divisão de honorários com parceiro' },
  { titulo: 'Declaração de residência', tipo: 'Declaração', desc: 'Para fins gerais' },
]

export default function JuridicoPage() {
  const [stats, setStats] = useState({ ativos: 0, sentenca: 0, acordo_judicial: 0, acordo_extrajudicial: 0 })
  const [analise, setAnalise] = useState('')
  const [resultado, setResultado] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadStats() {
      const [{ count: ativos }, { count: sentenca }, { count: aj }, { count: ae }] = await Promise.all([
        supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status', 'finalizado_sentenca'),
        supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status', 'finalizado_acordo_judicial'),
        supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status', 'finalizado_acordo_extrajudicial'),
      ])
      setStats({ ativos: ativos||0, sentenca: sentenca||0, acordo_judicial: aj||0, acordo_extrajudicial: ae||0 })
    }
    loadStats()
  }, [])

  async function analisarCaso() {
    if (!analise.trim()) return
    setLoading(true)
    setResultado('')
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'Você é uma assistente jurídica especializada nas áreas de Direito Previdenciário, Direito do Consumidor, Direito do Passageiro Aéreo, Direito Bancário e Direito Bancário aplicado ao Produtor Rural. Analise o caso apresentado de forma objetiva, clara e profissional. Indique os principais fundamentos jurídicos, probabilidade de êxito e próximos passos recomendados. Responda em português.',
          messages: [{ role: 'user', content: `Analise este caso jurídico:\n\n${analise}` }]
        })
      })
      const data = await response.json()
      const text = data.content?.find((c: any) => c.type === 'text')?.text || 'Não foi possível analisar. Verifique a configuração da API.'
      setResultado(text)
    } catch (e) {
      setResultado('Erro ao conectar com a IA. Verifique sua conexão.')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Jurídico" />
      <div className="p-6">
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="metric-card accent"><div className="label">Processos ativos</div><div className="font-serif text-3xl text-white">{stats.ativos}</div></div>
          <div className="metric-card"><div className="label">Finaliz. — sentença</div><div className="font-serif text-3xl text-white">{stats.sentenca}</div></div>
          <div className="metric-card green"><div className="label">Acordo judicial</div><div className="font-serif text-3xl text-white">{stats.acordo_judicial}</div></div>
          <div className="metric-card blue"><div className="label">Acordo extrajudicial</div><div className="font-serif text-3xl text-white">{stats.acordo_extrajudicial}</div></div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={14} className="text-brand-silver/60" />
              <div className="text-brand-silver text-xs font-medium tracking-wide">Modelos de documentos</div>
            </div>
            <div className="flex flex-col gap-1">
              {MODELOS.map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-brand-silver/5 last:border-0 hover:bg-brand-silver/3 px-1 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs">{m.titulo}</div>
                    <div className="text-brand-silver/35 text-xs mt-0.5">{m.desc}</div>
                  </div>
                  <span className={`badge text-xs ${m.tipo === 'Contrato' ? 'text-status-blue border-status-blue/25' : m.tipo === 'Procuração' ? 'text-status-green border-status-green/25' : 'text-status-amber border-status-amber/25'}`}>{m.tipo}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={14} className="text-brand-silver/60" />
              <div className="text-brand-silver text-xs font-medium tracking-wide">Análise de caso com IA</div>
            </div>
            <div className="text-brand-silver/35 text-xs mb-3">Descreva o caso para receber uma análise jurídica preliminar.</div>
            <textarea
              className="input-field min-h-28 resize-none mb-3 text-xs"
              placeholder="Descreva os fatos do caso, área do direito, pedido e qualquer informação relevante..."
              value={analise}
              onChange={e => setAnalise(e.target.value)}
            />
            <button className="btn-primary w-full justify-center mb-4" onClick={analisarCaso} disabled={loading || !analise.trim()}>
              <Brain size={13} /> {loading ? 'Analisando...' : 'Analisar com IA'}
            </button>
            {resultado && (
              <div className="bg-brand-dark border border-brand-silver/10 p-4 text-brand-silver/70 text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                {resultado}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

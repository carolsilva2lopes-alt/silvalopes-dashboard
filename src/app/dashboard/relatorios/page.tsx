'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatCurrency } from '@/lib/utils'

export default function RelatoriosPage() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [
      { data: processos },
      { data: clientes },
      { data: leads },
      { data: financeiro },
      { data: prazos },
    ] = await Promise.all([
      supabase.from('processos').select('status, area_direito, estado, parceria'),
      supabase.from('clientes').select('area_direito, status'),
      supabase.from('leads').select('etapa'),
      supabase.from('financeiro').select('tipo, valor, pago, parceiro_nome, parceiro_valor, parceiro_pago'),
      supabase.from('prazos').select('status'),
    ])

    const ativos = processos?.filter(p => p.status === 'ativo').length || 0
    const finalizados = processos?.filter(p => p.status !== 'ativo').length || 0
    const porSentenca = processos?.filter(p => p.status === 'finalizado_sentenca').length || 0
    const porAcordoJ = processos?.filter(p => p.status === 'finalizado_acordo_judicial').length || 0
    const porAcordoE = processos?.filter(p => p.status === 'finalizado_acordo_extrajudicial').length || 0
    const emParceria = processos?.filter(p => p.parceria).length || 0

    const porArea: Record<string,number> = {}
    processos?.forEach(p => { if (p.area_direito) porArea[p.area_direito] = (porArea[p.area_direito]||0) + 1 })

    const porEstado: Record<string,number> = {}
    processos?.forEach(p => { if (p.estado) porEstado[p.estado] = (porEstado[p.estado]||0) + 1 })

    const receitas = financeiro?.filter(f => f.tipo === 'receita') || []
    const previsto = receitas.reduce((s, f) => s + (f.valor||0), 0)
    const recebido = receitas.filter(f => f.pago).reduce((s, f) => s + (f.valor||0), 0)
    const repasseTotal = financeiro?.filter(f => f.parceiro_nome).reduce((s, f) => s + (f.parceiro_valor||0), 0) || 0
    const repassePago = financeiro?.filter(f => f.parceiro_nome && f.parceiro_pago).reduce((s, f) => s + (f.parceiro_valor||0), 0) || 0

    const totalLeads = leads?.length || 0
    const fechados = leads?.filter(l => ['contrato_assinado','peticionamento'].includes(l.etapa)).length || 0
    const conversao = totalLeads > 0 ? Math.round(fechados/totalLeads*100) : 0

    setData({
      ativos, finalizados, porSentenca, porAcordoJ, porAcordoE, emParceria,
      totalClientes: clientes?.length || 0,
      porArea, porEstado,
      previsto, recebido, pendente: previsto - recebido,
      repasseTotal, repassePago, repassePendente: repasseTotal - repassePago,
      totalLeads, fechados, conversao,
      prazosVencidos: prazos?.filter(p => p.status === 'vencido').length || 0,
      prazosConcluidos: prazos?.filter(p => p.status === 'concluido').length || 0,
    })
    setLoading(false)
  }

  const Row = ({ label, value, highlight }: any) => (
    <div className="flex justify-between items-center py-2.5 border-b border-brand-silver/5 last:border-0">
      <span className="text-brand-silver/50 text-xs">{label}</span>
      <span className={`text-xs font-medium ${highlight || 'text-white'}`}>{value}</span>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Relatórios" />
      <div className="p-6">
        {loading ? <div className="text-brand-silver/30 text-center py-12">Carregando relatórios...</div> : (
          <div className="grid grid-cols-3 gap-5">

            <div className="card">
              <div className="section-title">Processos</div>
              <Row label="Total ativos" value={data.ativos} />
              <Row label="Finalizados" value={data.finalizados} />
              <Row label="Por sentença" value={data.porSentenca} />
              <Row label="Acordo judicial" value={data.porAcordoJ} />
              <Row label="Acordo extrajudicial" value={data.porAcordoE} />
              <Row label="Em parceria" value={data.emParceria} highlight="text-status-amber" />
            </div>

            <div className="card">
              <div className="section-title">Financeiro</div>
              <Row label="Honorários previstos" value={formatCurrency(data.previsto)} />
              <Row label="Recebido" value={formatCurrency(data.recebido)} highlight="text-status-green" />
              <Row label="Pendente" value={formatCurrency(data.pendente)} highlight="text-status-amber" />
              <Row label="Repasse total" value={formatCurrency(data.repasseTotal)} />
              <Row label="Repasse pago" value={formatCurrency(data.repassePago)} highlight="text-status-green" />
              <Row label="Repasse pendente" value={formatCurrency(data.repassePendente)} highlight="text-status-amber" />
            </div>

            <div className="card">
              <div className="section-title">CRM e Prazos</div>
              <Row label="Total leads" value={data.totalLeads} />
              <Row label="Leads fechados" value={data.fechados} />
              <Row label="Taxa de conversão" value={`${data.conversao}%`} highlight="text-status-green" />
              <Row label="Total clientes" value={data.totalClientes} />
              <Row label="Prazos vencidos" value={data.prazosVencidos} highlight={data.prazosVencidos > 0 ? 'text-status-red' : 'text-white'} />
              <Row label="Prazos concluídos" value={data.prazosConcluidos} highlight="text-status-green" />
            </div>

            <div className="card col-span-2">
              <div className="section-title">Processos por área do direito</div>
              {Object.entries(data.porArea||{}).length === 0
                ? <div className="text-brand-silver/30 text-xs py-4">Nenhum dado disponível.</div>
                : Object.entries(data.porArea||{}).sort((a:any,b:any) => b[1]-a[1]).map(([area, qtd]: any) => {
                  const max = Math.max(...(Object.values(data.porArea||{}) as number[]))
                  const pct = max > 0 ? Math.round(qtd/max*100) : 0
                  return (
                    <div key={area} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-brand-silver/60 truncate">{area}</span>
                        <span className="text-brand-silver ml-2 flex-shrink-0">{qtd} processo{qtd !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="h-1 bg-brand-dark"><div className="h-full bg-brand-silver/40" style={{width:`${pct}%`}}></div></div>
                    </div>
                  )
                })}
            </div>

            <div className="card">
              <div className="section-title">Processos por estado</div>
              {Object.entries(data.porEstado||{}).length === 0
                ? <div className="text-brand-silver/30 text-xs py-4">Nenhum dado disponível.</div>
                : Object.entries(data.porEstado||{}).sort((a:any,b:any) => b[1]-a[1]).map(([estado, qtd]: any) => (
                  <div key={estado} className="flex justify-between items-center py-2 border-b border-brand-silver/5 last:border-0">
                    <span className="text-brand-silver/60 text-xs font-medium">{estado}</span>
                    <span className="text-white text-xs">{qtd}</span>
                  </div>
                ))}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

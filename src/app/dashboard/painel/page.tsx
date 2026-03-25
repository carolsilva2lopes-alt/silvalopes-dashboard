'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatCurrency, formatDate, getAreaColor } from '@/lib/utils'
import { AlertTriangle, TrendingUp, Users, FileText, DollarSign, Clock, Calendar, CheckSquare } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  processos_ativos: number
  processos_finalizados: number
  total_clientes: number
  total_leads: number
  honorarios_previstos: number
  honorarios_recebidos: number
  honorarios_pendentes: number
  prazos_vencendo: number
  audiencias_proximas: number
  tarefas_pendentes: number
}

export default function PainelPage() {
  const [stats, setStats] = useState<Stats>({
    processos_ativos: 0,
    processos_finalizados: 0,
    total_clientes: 0,
    total_leads: 0,
    honorarios_previstos: 0,
    honorarios_recebidos: 0,
    honorarios_pendentes: 0,
    prazos_vencendo: 0,
    audiencias_proximas: 0,
    tarefas_pendentes: 0,
  })
  const [processos, setProcessos] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])
  const [prazosUrgentes, setPrazosUrgentes] = useState<any[]>([])
  const [audienciasProximas, setAudienciasProximas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [
        { count: processosAtivos },
        { count: processosFinalizados },
        { count: totalClientes },
        { count: totalLeads },
        { data: financeiroData },
        { count: prazosVencendo },
        { count: audienciasCount },
        { count: tarefasCount },
        { data: processosRecentes },
        { data: prazosData },
        { data: audienciasData },
      ] = await Promise.all([
        supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('processos').select('*', { count: 'exact', head: true }).neq('status', 'ativo'),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('financeiro').select('valor, pago, tipo'),
        supabase.from('prazos').select('*', { count: 'exact', head: true }).eq('status', 'pendente').lte('data', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase.from('audiencias').select('*', { count: 'exact', head: true }).eq('status', 'agendada').gte('data', new Date().toISOString().split('T')[0]).lte('data', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase.from('tarefas').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('processos').select('*, processo_clientes(cliente:clientes(nome))').order('created_at', { ascending: false }).limit(5),
        supabase.from('prazos').select('*, processo:processos(titulo_interno, numero_processo)').eq('status', 'pendente').order('data').limit(5),
        supabase.from('audiencias').select('*, processo:processos(titulo_interno)').eq('status', 'agendada').gte('data', new Date().toISOString().split('T')[0]).order('data').limit(4),
      ])

      const receitas = financeiroData?.filter(f => f.tipo === 'receita') || []
      const previsto = receitas.reduce((sum, f) => sum + (f.valor || 0), 0)
      const recebido = receitas.filter(f => f.pago).reduce((sum, f) => sum + (f.valor || 0), 0)

      setStats({
        processos_ativos: processosAtivos || 0,
        processos_finalizados: processosFinalizados || 0,
        total_clientes: totalClientes || 0,
        total_leads: totalLeads || 0,
        honorarios_previstos: previsto,
        honorarios_recebidos: recebido,
        honorarios_pendentes: previsto - recebido,
        prazos_vencendo: prazosVencendo || 0,
        audiencias_proximas: audienciasCount || 0,
        tarefas_pendentes: tarefasCount || 0,
      })

      setProcessos(processosRecentes || [])
      setPrazosUrgentes(prazosData || [])
      setAudienciasProximas(audienciasData || [])
    } catch (error) {
      console.error('Erro ao carregar painel:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Painel Geral" />
      <div className="p-6 flex flex-col gap-5">

        {/* Métricas principais */}
        <div className="grid grid-cols-4 gap-3">
          <div className="metric-card accent">
            <div className="label">Processos ativos</div>
            <div className="font-serif text-3xl text-white">{loading ? '—' : stats.processos_ativos}</div>
            <div className="text-xs text-brand-silver/35 mt-1">{stats.processos_finalizados} finalizados</div>
          </div>
          <div className="metric-card green">
            <div className="label">Clientes</div>
            <div className="font-serif text-3xl text-white">{loading ? '—' : stats.total_clientes}</div>
            <div className="text-xs text-brand-silver/35 mt-1">{stats.total_leads} leads no funil</div>
          </div>
          <div className="metric-card amber">
            <div className="label">Honorários previstos</div>
            <div className="font-serif text-2xl text-white">{loading ? '—' : formatCurrency(stats.honorarios_previstos)}</div>
            <div className="text-xs text-status-green mt-1">{formatCurrency(stats.honorarios_recebidos)} recebido</div>
          </div>
          <div className="metric-card blue">
            <div className="label">Pendente a receber</div>
            <div className="font-serif text-2xl text-white">{loading ? '—' : formatCurrency(stats.honorarios_pendentes)}</div>
            <div className="text-xs text-brand-silver/35 mt-1">A receber</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="metric-card">
            <div className="label">Prazos (7 dias)</div>
            <div className={`font-serif text-3xl ${stats.prazos_vencendo > 0 ? 'text-status-amber' : 'text-white'}`}>{loading ? '—' : stats.prazos_vencendo}</div>
            <div className="text-xs text-brand-silver/35 mt-1">Requer atenção</div>
          </div>
          <div className="metric-card">
            <div className="label">Audiências / 30d</div>
            <div className="font-serif text-3xl text-white">{loading ? '—' : stats.audiencias_proximas}</div>
            <div className="text-xs text-brand-silver/35 mt-1">Próximas</div>
          </div>
          <div className="metric-card">
            <div className="label">Tarefas pendentes</div>
            <div className={`font-serif text-3xl ${stats.tarefas_pendentes > 0 ? 'text-status-amber' : 'text-white'}`}>{loading ? '—' : stats.tarefas_pendentes}</div>
            <div className="text-xs text-brand-silver/35 mt-1">Em aberto</div>
          </div>
          <div className="metric-card">
            <div className="label">Leads ativos</div>
            <div className="font-serif text-3xl text-white">{loading ? '—' : stats.total_leads}</div>
            <div className="text-xs text-brand-silver/35 mt-1">No funil CRM</div>
          </div>
        </div>

        {/* Linha central */}
        <div className="grid grid-cols-5 gap-4">
          {/* Processos recentes */}
          <div className="col-span-3 card">
            <div className="flex items-center justify-between mb-4">
              <div className="text-brand-silver text-xs font-medium tracking-wide">Processos recentes</div>
              <Link href="/dashboard/processos" className="text-brand-silver/35 text-xs uppercase tracking-wider hover:text-brand-silver transition-colors">Ver todos</Link>
            </div>
            {loading ? (
              <div className="text-brand-silver/30 text-sm py-4 text-center">Carregando...</div>
            ) : processos.length === 0 ? (
              <div className="text-brand-silver/30 text-sm py-8 text-center">Nenhum processo cadastrado ainda.</div>
            ) : (
              <div className="flex flex-col">
                {processos.map((proc) => (
                  <Link key={proc.id} href={`/dashboard/processos/${proc.id}`} className="flex items-center gap-3 py-2.5 border-b border-brand-silver/5 last:border-0 hover:bg-brand-silver/3 transition-colors px-1">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${proc.status === 'ativo' ? 'bg-status-green' : 'bg-brand-silver/30'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs truncate">{proc.titulo_interno}</div>
                      <div className={`text-xs mt-0.5 ${getAreaColor(proc.area_direito)}`}>{proc.area_direito || '—'} {proc.estado ? `· ${proc.estado}` : ''}</div>
                    </div>
                    <span className={`badge text-xs ${proc.status === 'ativo' ? 'text-status-green border-status-green/25 bg-status-green/7' : 'text-brand-silver/40 border-brand-silver/15'}`}>
                      {proc.status === 'ativo' ? 'Ativo' : 'Finalizado'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Alertas */}
          <div className="col-span-2 card">
            <div className="text-brand-silver text-xs font-medium tracking-wide mb-4">Alertas e notificações</div>
            <div className="flex flex-col gap-2">
              {prazosUrgentes.slice(0, 2).map((prazo) => (
                <div key={prazo.id} className="flex gap-2.5 p-2.5 bg-brand-dark border-l-2 border-status-amber">
                  <div>
                    <div className="text-white text-xs mb-0.5">Prazo: {prazo.descricao}</div>
                    <div className="text-brand-silver/35 text-xs">{prazo.processo?.titulo_interno || '—'} · {formatDate(prazo.data)}</div>
                  </div>
                </div>
              ))}
              {audienciasProximas.slice(0, 2).map((aud) => (
                <div key={aud.id} className="flex gap-2.5 p-2.5 bg-brand-dark border-l-2 border-status-blue">
                  <div>
                    <div className="text-white text-xs mb-0.5">Audiência: {aud.tipo}</div>
                    <div className="text-brand-silver/35 text-xs">{aud.processo?.titulo_interno || '—'} · {formatDate(aud.data)}</div>
                  </div>
                </div>
              ))}
              {prazosUrgentes.length === 0 && audienciasProximas.length === 0 && (
                <div className="text-brand-silver/30 text-xs py-4 text-center">Nenhum alerta no momento.</div>
              )}
            </div>
          </div>
        </div>

        {/* Linha inferior */}
        <div className="grid grid-cols-3 gap-4">
          {/* Prazos urgentes */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="text-brand-silver text-xs font-medium">Prazos próximos</div>
              <Link href="/dashboard/prazos" className="text-brand-silver/35 text-xs uppercase tracking-wider hover:text-brand-silver transition-colors">Ver todos</Link>
            </div>
            {prazosUrgentes.length === 0 ? (
              <div className="text-brand-silver/30 text-xs py-4 text-center">Nenhum prazo urgente.</div>
            ) : (
              prazosUrgentes.map((prazo) => (
                <div key={prazo.id} className="flex items-start gap-2.5 py-2 border-b border-brand-silver/5 last:border-0">
                  <Clock size={11} className="text-status-amber mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs truncate">{prazo.descricao}</div>
                    <div className="text-brand-silver/35 text-xs">{prazo.processo?.numero_processo || '—'} · {formatDate(prazo.data)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Audiências */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="text-brand-silver text-xs font-medium">Próximas audiências</div>
              <Link href="/dashboard/audiencias" className="text-brand-silver/35 text-xs uppercase tracking-wider hover:text-brand-silver transition-colors">Ver todas</Link>
            </div>
            {audienciasProximas.length === 0 ? (
              <div className="text-brand-silver/30 text-xs py-4 text-center">Nenhuma audiência próxima.</div>
            ) : (
              audienciasProximas.map((aud) => (
                <div key={aud.id} className="flex items-start gap-2.5 py-2 border-b border-brand-silver/5 last:border-0">
                  <Calendar size={11} className="text-status-red mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs truncate">{aud.tipo}</div>
                    <div className="text-brand-silver/35 text-xs">{formatDate(aud.data)} {aud.hora ? `· ${aud.hora.slice(0,5)}` : ''}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Financeiro resumo */}
          <div className="card">
            <div className="text-brand-silver text-xs font-medium mb-3">Financeiro — resumo</div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center p-2.5 bg-brand-dark">
                <span className="text-brand-silver/50 text-xs">Previsto</span>
                <span className="font-serif text-base text-brand-silver">{formatCurrency(stats.honorarios_previstos)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-brand-dark">
                <span className="text-brand-silver/50 text-xs">Recebido</span>
                <span className="font-serif text-base text-status-green">{formatCurrency(stats.honorarios_recebidos)}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-brand-dark">
                <span className="text-brand-silver/50 text-xs">Pendente</span>
                <span className="font-serif text-base text-status-amber">{formatCurrency(stats.honorarios_pendentes)}</span>
              </div>
            </div>
            <Link href="/dashboard/financeiro" className="btn-primary w-full justify-center mt-3 text-xs">
              Ver financeiro completo
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

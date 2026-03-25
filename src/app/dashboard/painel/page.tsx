'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Clock, Calendar, DollarSign, FileText, AlertTriangle, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const tipoColor: Record<string, string> = {
  audiencia: 'bg-status-red', prazo: 'bg-status-amber',
  tarefa: 'bg-status-blue', profissional: 'bg-status-green', pessoal: 'bg-brand-silver/40',
}

export default function PainelPage() {
  const [stats, setStats] = useState({ processos_ativos: 0, processos_finalizados: 0, total_clientes: 0, honorarios_previstos: 0, honorarios_recebidos: 0, prazos_vencendo: 0, audiencias_proximas: 0, tarefas_pendentes: 0 })
  const [processos, setProcessos] = useState<any[]>([])
  const [prazosLista, setPrazosLista] = useState<any[]>([])
  const [audienciasLista, setAudienciasLista] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])
  const [agendaSemana, setAgendaSemana] = useState<any[]>([])
  const [financeiroMeses, setFinanceiroMeses] = useState<any[]>([])
  const [processosPorArea, setProcessosPorArea] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const hoje = new Date()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const dHoje = hoje.toISOString().split('T')[0]
      const d7 = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      const d30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      // semana: dom até sáb
      const semanaInicio = new Date(hoje); semanaInicio.setDate(hoje.getDate() - hoje.getDay())
      const semanaFim = new Date(semanaInicio); semanaFim.setDate(semanaInicio.getDate() + 6)
      const sI = semanaInicio.toISOString().split('T')[0]
      const sF = semanaFim.toISOString().split('T')[0]

      const [
        { count: processosAtivos },
        { count: processosFinalizados },
        { count: totalClientes },
        { data: financeiroData },
        { count: prazosCount },
        { count: audienciasCount },
        { count: tarefasCount },
        { data: processosRecentes },
        { data: prazosData },
        { data: audienciasData },
        { data: agendaData },
        { data: finData },
        { data: procAreaData },
      ] = await Promise.all([
        supabase.from('processos').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('processos').select('*', { count: 'exact', head: true }).neq('status', 'ativo'),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('financeiro').select('valor, pago, tipo'),
        supabase.from('prazos').select('*', { count: 'exact', head: true }).eq('status', 'pendente').lte('data', d7),
        supabase.from('audiencias').select('*', { count: 'exact', head: true }).eq('status', 'agendada').gte('data', dHoje).lte('data', d30),
        supabase.from('tarefas').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('processos').select('id,titulo_interno,status,area_direito').order('created_at', { ascending: false }).limit(5),
        supabase.from('prazos').select('*, processo:processos(titulo_interno,numero_processo)').eq('status', 'pendente').order('data').limit(6),
        supabase.from('audiencias').select('*, processo:processos(titulo_interno)').eq('status', 'agendada').gte('data', dHoje).order('data').limit(6),
        supabase.from('agenda').select('*').gte('data', sI).lte('data', sF).order('data').order('hora_inicio'),
        supabase.from('financeiro').select('valor, pago, tipo, data'),
        supabase.from('processos').select('area_direito, status'),
      ])

      const receitas = financeiroData?.filter(f => f.tipo === 'receita') || []
      const previsto = receitas.reduce((s, f) => s + (f.valor || 0), 0)
      const recebido = receitas.filter(f => f.pago).reduce((s, f) => s + (f.valor || 0), 0)

      setStats({ processos_ativos: processosAtivos || 0, processos_finalizados: processosFinalizados || 0, total_clientes: totalClientes || 0, honorarios_previstos: previsto, honorarios_recebidos: recebido, prazos_vencendo: prazosCount || 0, audiencias_proximas: audienciasCount || 0, tarefas_pendentes: tarefasCount || 0 })
      setProcessos(processosRecentes || [])
      setPrazosLista(prazosData || [])
      setAudienciasLista(audienciasData || [])
      setAgendaSemana(agendaData || [])

      // Financeiro por mês (últimos 6 meses)
      const mesesFin: Record<string, { receita: number; despesa: number }> = {}
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${MESES[d.getMonth()].slice(0,3)}/${String(d.getFullYear()).slice(2)}`
        mesesFin[key] = { receita: 0, despesa: 0 }
      }
      finData?.forEach((f: any) => {
        if (!f.data) return
        const d = new Date(f.data)
        const key = `${MESES[d.getMonth()].slice(0,3)}/${String(d.getFullYear()).slice(2)}`
        if (mesesFin[key]) {
          if (f.tipo === 'receita') mesesFin[key].receita += f.valor || 0
          else mesesFin[key].despesa += f.valor || 0
        }
      })
      setFinanceiroMeses(Object.entries(mesesFin).map(([mes, v]) => ({ mes, ...v })))

      // Processos por área
      const areaCount: Record<string, number> = {}
      procAreaData?.forEach((p: any) => {
        const area = p.area_direito || 'Outros'
        areaCount[area] = (areaCount[area] || 0) + 1
      })
      setProcessosPorArea(Object.entries(areaCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name: name.length > 16 ? name.slice(0, 14) + '…' : name, value })))

      // alertas: prazos urgentes hoje/amanhã + audiências nos próximos 2 dias
      const alertasPrazos = (prazosData || []).slice(0, 2).map((p: any) => ({ tipo: 'prazo', texto: p.descricao, sub: p.processo?.titulo_interno || '—', data: p.data, cor: 'border-status-amber' }))
      const alertasAud = (audienciasData || []).slice(0, 2).map((a: any) => ({ tipo: 'audiencia', texto: a.tipo, sub: a.processo?.titulo_interno || '—', data: a.data, cor: 'border-status-red' }))
      setAlertas([...alertasPrazos, ...alertasAud])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // Monta os 7 dias da semana atual
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje); d.setDate(hoje.getDate() - hoje.getDay() + i)
    return d
  })

  function eventosNoDia(data: Date) {
    const key = data.toISOString().split('T')[0]
    return agendaSemana.filter(e => e.data === key)
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Painel Geral" />
      <div className="p-6 flex flex-col gap-4">

        {/* Linha 1: métricas */}
        <div className="grid grid-cols-4 gap-3">
          <div className="metric-card accent">
            <div className="label">Processos ativos</div>
            <div className="font-serif text-3xl text-white">{loading ? '—' : stats.processos_ativos}</div>
            <div className="text-xs text-brand-silver/35 mt-1">{stats.processos_finalizados} finalizados</div>
          </div>
          <div className="metric-card green">
            <div className="label">Clientes</div>
            <div className="font-serif text-3xl text-white">{loading ? '—' : stats.total_clientes}</div>
          </div>
          <div className="metric-card amber">
            <div className="label">Honorários previstos</div>
            <div className="font-serif text-2xl text-white">{loading ? '—' : formatCurrency(stats.honorarios_previstos)}</div>
            <div className="text-xs text-status-green mt-1">{formatCurrency(stats.honorarios_recebidos)} recebido</div>
          </div>
          <div className="metric-card">
            <div className="label">Tarefas pendentes</div>
            <div className={`font-serif text-3xl ${stats.tarefas_pendentes > 0 ? 'text-status-amber' : 'text-white'}`}>{loading ? '—' : stats.tarefas_pendentes}</div>
            <Link href="/dashboard/tarefas" className="text-xs text-brand-silver/35 mt-1 hover:text-brand-silver transition-colors">Ver tarefas →</Link>
          </div>
        </div>

        {/* Linha 2: agenda da semana */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={13} className="text-brand-silver/50" />
              <span className="text-brand-silver text-xs font-medium tracking-wide">Agenda — semana de {MESES[diasSemana[0].getMonth()]} {diasSemana[0].getDate()}</span>
            </div>
            <Link href="/dashboard/agenda" className="text-brand-silver/35 text-xs uppercase tracking-wider hover:text-brand-silver transition-colors">Ver agenda completa</Link>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {diasSemana.map((dia, i) => {
              const isHoje = dia.toDateString() === hoje.toDateString()
              const eventos = eventosNoDia(dia)
              return (
                <div key={i} className={`flex flex-col min-h-20 p-2 border ${isHoje ? 'border-brand-silver/30 bg-brand-silver/5' : 'border-brand-silver/8 bg-brand-dark'}`}>
                  <div className={`text-xs font-medium mb-1 ${isHoje ? 'text-brand-silver' : 'text-brand-silver/40'}`}>{DIAS[i]}</div>
                  <div className={`font-serif text-lg mb-1.5 ${isHoje ? 'text-white' : 'text-brand-silver/50'}`}>{dia.getDate()}</div>
                  <div className="flex flex-col gap-0.5">
                    {eventos.slice(0, 3).map((ev, j) => (
                      <div key={j} className={`text-xs px-1 py-0.5 truncate rounded-sm ${tipoColor[ev.tipo] || 'bg-brand-silver/20'} text-white`} title={ev.titulo}>
                        {ev.hora_inicio ? ev.hora_inicio.slice(0,5) + ' ' : ''}{ev.titulo}
                      </div>
                    ))}
                    {eventos.length > 3 && <div className="text-xs text-brand-silver/30">+{eventos.length - 3}</div>}
                    {eventos.length === 0 && <div className="text-xs text-brand-silver/15">—</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Linha 3: prazos + audiências + alertas */}
        <div className="grid grid-cols-3 gap-4">

          {/* Prazos próximos */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={12} className={stats.prazos_vencendo > 0 ? 'text-status-amber' : 'text-brand-silver/40'} />
                <span className="text-brand-silver text-xs font-medium">Prazos (7 dias)</span>
                {stats.prazos_vencendo > 0 && <span className="badge text-status-amber border-status-amber/25 bg-status-amber/7 text-xs">{stats.prazos_vencendo}</span>}
              </div>
              <Link href="/dashboard/prazos" className="text-brand-silver/35 text-xs hover:text-brand-silver">Ver todos</Link>
            </div>
            {loading ? <div className="text-brand-silver/30 text-xs py-4 text-center">...</div>
            : prazosLista.length === 0 ? <div className="text-brand-silver/30 text-xs py-4 text-center">Nenhum prazo urgente.</div>
            : prazosLista.map(p => (
              <div key={p.id} className="flex items-start gap-2 py-2 border-b border-brand-silver/5 last:border-0">
                <div className="w-1 h-1 rounded-full bg-status-amber mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs truncate">{p.descricao}</div>
                  <div className="text-brand-silver/35 text-xs">{p.processo?.numero_processo || '—'}</div>
                  <div className="text-status-amber text-xs">{formatDate(p.data)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Audiências próximas */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={12} className={stats.audiencias_proximas > 0 ? 'text-status-red' : 'text-brand-silver/40'} />
                <span className="text-brand-silver text-xs font-medium">Audiências / 30d</span>
                {stats.audiencias_proximas > 0 && <span className="badge text-status-red border-status-red/25 bg-status-red/7 text-xs">{stats.audiencias_proximas}</span>}
              </div>
              <Link href="/dashboard/audiencias" className="text-brand-silver/35 text-xs hover:text-brand-silver">Ver todas</Link>
            </div>
            {loading ? <div className="text-brand-silver/30 text-xs py-4 text-center">...</div>
            : audienciasLista.length === 0 ? <div className="text-brand-silver/30 text-xs py-4 text-center">Nenhuma audiência próxima.</div>
            : audienciasLista.map(a => (
              <div key={a.id} className="flex items-start gap-2 py-2 border-b border-brand-silver/5 last:border-0">
                <div className="w-1 h-1 rounded-full bg-status-red mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs truncate">{a.tipo}</div>
                  <div className="text-brand-silver/35 text-xs truncate">{a.processo?.titulo_interno || '—'}</div>
                  <div className="text-status-red text-xs">{formatDate(a.data)}{a.hora ? ` · ${a.hora.slice(0,5)}` : ''}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Alertas */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={12} className="text-status-amber" />
              <span className="text-brand-silver text-xs font-medium">Alertas e notificações</span>
            </div>
            {alertas.length === 0 && !loading
              ? <div className="text-brand-silver/30 text-xs py-4 text-center">Nenhum alerta no momento.</div>
              : alertas.map((al, i) => (
                <div key={i} className={`flex gap-2.5 p-2.5 mb-2 bg-brand-dark border-l-2 ${al.cor}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-brand-silver/50 text-xs uppercase tracking-wider mb-0.5">{al.tipo}</div>
                    <div className="text-white text-xs truncate">{al.texto}</div>
                    <div className="text-brand-silver/35 text-xs truncate">{al.sub} · {formatDate(al.data)}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Linha 4: gráficos */}
        <div className="grid grid-cols-2 gap-4">

          {/* Gráfico financeiro por mês */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={12} className="text-brand-silver/50" />
              <span className="text-brand-silver text-xs font-medium">Financeiro — últimos 6 meses</span>
            </div>
            {financeiroMeses.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={financeiroMeses} barGap={3} barCategoryGap="30%">
                  <XAxis dataKey="mes" tick={{ fill: 'rgba(209,211,218,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(209,211,218,0.25)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#0d1f35', border: '1px solid rgba(209,211,218,0.15)', borderRadius: 4, fontSize: 11, color: '#D1D3DA' }} formatter={(v: any) => formatCurrency(v)} cursor={{ fill: 'rgba(209,211,218,0.05)' }} />
                  <Bar dataKey="receita" name="Receita" fill="#5DCAA5" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="#E85D5D" radius={[3, 3, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 10, color: 'rgba(209,211,218,0.5)' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44 text-brand-silver/30 text-xs">Sem dados financeiros ainda.</div>
            )}
          </div>

          {/* Gráfico processos por área */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={12} className="text-brand-silver/50" />
              <span className="text-brand-silver text-xs font-medium">Processos por área do direito</span>
            </div>
            {processosPorArea.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={processosPorArea} cx="40%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {processosPorArea.map((_, i) => (
                      <Cell key={i} fill={['#5DCAA5','#5D9CE8','#E8A838','#E85D5D','#A85DE8','#D1D3DA'][i % 6]} />
                    ))}
                  </Pie>
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 10, color: 'rgba(209,211,218,0.6)', lineHeight: '22px' }} />
                  <Tooltip contentStyle={{ background: '#0d1f35', border: '1px solid rgba(209,211,218,0.15)', borderRadius: 4, fontSize: 11, color: '#D1D3DA' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-44 text-brand-silver/30 text-xs">Nenhum processo cadastrado ainda.</div>
            )}
          </div>
        </div>

        {/* Linha 5: processos recentes + financeiro resumo */}
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-brand-silver/50" />
                <span className="text-brand-silver text-xs font-medium tracking-wide">Processos recentes</span>
              </div>
              <Link href="/dashboard/processos" className="text-brand-silver/35 text-xs uppercase tracking-wider hover:text-brand-silver transition-colors">Ver todos</Link>
            </div>
            {loading ? <div className="text-brand-silver/30 text-sm py-4 text-center">Carregando...</div>
            : processos.length === 0 ? <div className="text-brand-silver/30 text-sm py-8 text-center">Nenhum processo ainda.</div>
            : processos.map(p => (
              <Link key={p.id} href={`/dashboard/processos/${p.id}`} className="flex items-center gap-3 py-2.5 border-b border-brand-silver/5 last:border-0 hover:bg-brand-silver/3 transition-colors px-1">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.status === 'ativo' ? 'bg-status-green' : 'bg-brand-silver/30'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs truncate">{p.titulo_interno}</div>
                  <div className="text-brand-silver/40 text-xs">{p.area_direito || '—'}</div>
                </div>
                <span className={`badge text-xs ${p.status === 'ativo' ? 'text-status-green border-status-green/25 bg-status-green/7' : 'text-brand-silver/40 border-brand-silver/15'}`}>{p.status === 'ativo' ? 'Ativo' : 'Finalizado'}</span>
              </Link>
            ))}
          </div>

          <div className="col-span-2 card">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={12} className="text-brand-silver/50" />
              <span className="text-brand-silver text-xs font-medium">Financeiro — resumo</span>
            </div>
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
                <span className="font-serif text-base text-status-amber">{formatCurrency(stats.honorarios_previstos - stats.honorarios_recebidos)}</span>
              </div>
            </div>
            <Link href="/dashboard/financeiro" className="btn-primary w-full justify-center mt-4 text-xs">Ver financeiro completo</Link>
          </div>
        </div>

      </div>
    </div>
  )
}

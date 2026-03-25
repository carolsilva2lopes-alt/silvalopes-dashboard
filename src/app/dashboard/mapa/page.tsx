'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/layout/Topbar'

const ESTADOS: Record<string, {x: number, y: number, nome: string, uf: string}> = {
  'AC': {x: 88, y: 310, nome: 'Acre', uf: 'AC'},
  'AL': {x: 570, y: 268, nome: 'Alagoas', uf: 'AL'},
  'AM': {x: 155, y: 220, nome: 'Amazonas', uf: 'AM'},
  'AP': {x: 430, y: 108, nome: 'Amapá', uf: 'AP'},
  'BA': {x: 490, y: 285, nome: 'Bahia', uf: 'BA'},
  'CE': {x: 548, y: 188, nome: 'Ceará', uf: 'CE'},
  'DF': {x: 405, y: 315, nome: 'DF', uf: 'DF'},
  'ES': {x: 530, y: 345, nome: 'Espírito Santo', uf: 'ES'},
  'GO': {x: 388, y: 308, nome: 'Goiás', uf: 'GO'},
  'MA': {x: 468, y: 178, nome: 'Maranhão', uf: 'MA'},
  'MG': {x: 468, y: 330, nome: 'Minas Gerais', uf: 'MG'},
  'MS': {x: 335, y: 368, nome: 'Mato Grosso do Sul', uf: 'MS'},
  'MT': {x: 285, y: 285, nome: 'Mato Grosso', uf: 'MT'},
  'PA': {x: 368, y: 188, nome: 'Pará', uf: 'PA'},
  'PB': {x: 572, y: 210, nome: 'Paraíba', uf: 'PB'},
  'PE': {x: 548, y: 228, nome: 'Pernambuco', uf: 'PE'},
  'PI': {x: 505, y: 208, nome: 'Piauí', uf: 'PI'},
  'PR': {x: 375, y: 408, nome: 'Paraná', uf: 'PR'},
  'RJ': {x: 505, y: 368, nome: 'Rio de Janeiro', uf: 'RJ'},
  'RN': {x: 578, y: 192, nome: 'Rio Grande do Norte', uf: 'RN'},
  'RO': {x: 198, y: 288, nome: 'Rondônia', uf: 'RO'},
  'RR': {x: 228, y: 118, nome: 'Roraima', uf: 'RR'},
  'RS': {x: 358, y: 452, nome: 'Rio Grande do Sul', uf: 'RS'},
  'SC': {x: 388, y: 432, nome: 'Santa Catarina', uf: 'SC'},
  'SE': {x: 562, y: 258, nome: 'Sergipe', uf: 'SE'},
  'SP': {x: 432, y: 382, nome: 'São Paulo', uf: 'SP'},
  'TO': {x: 425, y: 242, nome: 'Tocantins', uf: 'TO'},
}

export default function MapaPage() {
  const [porEstado, setPorEstado] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('processos').select('estado')
      const contagem: Record<string, number> = {}
      data?.forEach((p: any) => { if (p.estado) contagem[p.estado] = (contagem[p.estado] || 0) + 1 })
      setPorEstado(contagem)
      setLoading(false)
    }
    load()
  }, [])

  const maxVal = Math.max(...Object.values(porEstado), 1)
  const sorted = Object.entries(porEstado).sort((a, b) => b[1] - a[1])
  const total = Object.values(porEstado).reduce((a, b) => a + b, 0)

  function getRadius(uf: string) {
    const qtd = porEstado[uf] || 0
    if (qtd === 0) return 12
    return Math.max(16, Math.min(32, 16 + (qtd / maxVal) * 16))
  }

  function getFill(uf: string) {
    const qtd = porEstado[uf] || 0
    if (qtd === 0) return 'rgba(209,211,218,0.06)'
    const i = qtd / maxVal
    if (i >= 0.8) return '#D1D3DA'
    if (i >= 0.5) return 'rgba(209,211,218,0.65)'
    if (i >= 0.2) return 'rgba(209,211,218,0.35)'
    return 'rgba(209,211,218,0.18)'
  }

  function getTextFill(uf: string) {
    const qtd = porEstado[uf] || 0
    if (qtd === 0) return 'rgba(209,211,218,0.25)'
    const i = qtd / maxVal
    return i >= 0.5 ? '#0A182B' : '#D1D3DA'
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Topbar title="Mapa de Atuação Nacional" />
      <div className="p-6">
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="metric-card accent">
            <div className="label">Estados com atuação</div>
            <div className="font-serif text-3xl text-white">{Object.keys(porEstado).length}</div>
          </div>
          <div className="metric-card">
            <div className="label">Total processos</div>
            <div className="font-serif text-3xl text-white">{total}</div>
          </div>
          <div className="metric-card green">
            <div className="label">Estado principal</div>
            <div className="font-serif text-2xl text-white">{sorted[0]?.[0] || '—'}</div>
            {sorted[0] && <div className="text-xs text-status-green mt-1">{sorted[0][1]} processo{sorted[0][1] !== 1 ? 's' : ''}</div>}
          </div>
          <div className="metric-card blue">
            <div className="label">Concentração</div>
            <div className="font-serif text-2xl text-white">{total > 0 && sorted[0] ? Math.round(sorted[0][1]/total*100) : 0}%</div>
            <div className="text-xs text-status-blue mt-1">no estado principal</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 card">
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
              <div className="section-title" style={{margin:0, border:'none', paddingBottom:0}}>Distribuição geográfica — Brasil</div>
              <div style={{display:'flex', gap:'16px'}}>
                {[['#D1D3DA','Alta'],['rgba(209,211,218,0.45)','Média'],['rgba(209,211,218,0.18)','Baixa'],['rgba(209,211,218,0.06)','Nenhum']].map(([c,l]) => (
                  <div key={l} style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'10px', color:'rgba(209,211,218,0.4)'}}>
                    <div style={{width:'8px', height:'8px', borderRadius:'50%', background:c, border:'1px solid rgba(209,211,218,0.2)'}}></div>{l}
                  </div>
                ))}
              </div>
            </div>
            {loading ? (
              <div style={{textAlign:'center', padding:'60px 0', color:'rgba(209,211,218,0.3)', fontSize:'13px'}}>Carregando mapa...</div>
            ) : (
              <svg viewBox="0 0 680 530" style={{width:'100%', height:'auto'}}>
                <rect width="680" height="530" fill="#0A182B"/>
                <text x="340" y="490" textAnchor="middle" fontSize="10" fill="rgba(209,211,218,0.2)" fontFamily="DM Sans, sans-serif">Passe o mouse sobre os estados para ver detalhes</text>
                {Object.entries(ESTADOS).map(([uf, coords]) => {
                  const r = getRadius(uf)
                  const qtd = porEstado[uf] || 0
                  const isHover = hover === uf
                  return (
                    <g key={uf}
                      onMouseEnter={() => setHover(uf)}
                      onMouseLeave={() => setHover(null)}
                      style={{cursor: qtd > 0 ? 'pointer' : 'default'}}
                    >
                      <circle
                        cx={coords.x} cy={coords.y} r={isHover ? r + 3 : r}
                        fill={getFill(uf)}
                        stroke={isHover ? '#D1D3DA' : 'rgba(209,211,218,0.15)'}
                        strokeWidth={isHover ? 1.5 : 0.5}
                        style={{transition: 'all 0.15s'}}
                      />
                      <text
                        x={coords.x} y={coords.y + 1}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize={uf === 'DF' ? "7" : "9"}
                        fontFamily="DM Sans, sans-serif"
                        fontWeight="500"
                        fill={getTextFill(uf)}
                        style={{pointerEvents:'none'}}
                      >{uf}</text>
                      {qtd > 0 && !isHover && (
                        <text
                          x={coords.x} y={coords.y + r + 10}
                          textAnchor="middle"
                          fontSize="8"
                          fontFamily="DM Sans, sans-serif"
                          fill="rgba(209,211,218,0.5)"
                          style={{pointerEvents:'none'}}
                        >{qtd}</text>
                      )}
                      {isHover && (
                        <g>
                          <rect x={coords.x - 55} y={coords.y - r - 34} width="110" height="30" rx="3" fill="#111f33" stroke="rgba(209,211,218,0.25)" strokeWidth="0.5"/>
                          <text x={coords.x} y={coords.y - r - 24} textAnchor="middle" fontSize="11" fontFamily="DM Sans, sans-serif" fontWeight="500" fill="#D1D3DA">{coords.nome}</text>
                          <text x={coords.x} y={coords.y - r - 11} textAnchor="middle" fontSize="10" fontFamily="DM Sans, sans-serif" fill={qtd > 0 ? '#5DCAA5' : 'rgba(209,211,218,0.35)'}>{qtd > 0 ? `${qtd} processo${qtd !== 1 ? 's' : ''}` : 'Sem processos'}</text>
                        </g>
                      )}
                    </g>
                  )
                })}
              </svg>
            )}
          </div>

          <div className="card">
            <div className="section-title">Ranking por estado</div>
            {loading ? (
              <div style={{textAlign:'center', padding:'32px 0', color:'rgba(209,211,218,0.3)', fontSize:'12px'}}>Carregando...</div>
            ) : sorted.length === 0 ? (
              <div style={{textAlign:'center', padding:'32px 0', color:'rgba(209,211,218,0.3)', fontSize:'12px'}}>Nenhum processo cadastrado ainda. Cadastre processos com estado definido.</div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                {sorted.map(([uf, qtd], i) => (
                  <div key={uf} style={{display:'flex', alignItems:'center', gap:'10px', padding:'9px 0', borderBottom:'1px solid rgba(209,211,218,0.05)'}}>
                    <span style={{fontSize:'11px', color:'rgba(209,211,218,0.25)', minWidth:'18px', textAlign:'right'}}>{i+1}</span>
                    <span style={{fontSize:'12px', color:'#D1D3DA', fontWeight:'500', minWidth:'28px'}}>{uf}</span>
                    <span style={{fontSize:'11px', color:'rgba(209,211,218,0.4)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{ESTADOS[uf]?.nome || uf}</span>
                    <div style={{width:'60px', height:'2px', background:'rgba(209,211,218,0.08)'}}>
                      <div style={{height:'100%', background:'rgba(209,211,218,0.4)', width:`${(qtd/maxVal)*100}%`}}></div>
                    </div>
                    <span style={{fontSize:'12px', color:'#fff', fontWeight:'500', minWidth:'18px', textAlign:'right'}}>{qtd}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

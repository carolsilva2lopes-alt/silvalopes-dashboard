import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return '—'
    return format(d, 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(d)) return '—'
    return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return '—'
  }
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '')
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '')
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

export const AREAS_DIREITO = [
  'Direito Previdenciário',
  'Direito do Consumidor',
  'Direito do Passageiro Aéreo',
  'Direito Bancário Geral',
  'Direito Bancário — Produtor Rural',
]

export const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
]

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ativo: 'text-status-green border-status-green/30 bg-status-green/10',
    ativoprocesso: 'text-status-green border-status-green/30 bg-status-green/10',
    pendente: 'text-status-amber border-status-amber/30 bg-status-amber/10',
    ag_contrato: 'text-status-amber border-status-amber/30 bg-status-amber/10',
    vencido: 'text-status-red border-status-red/30 bg-status-red/10',
    urgente: 'text-status-red border-status-red/30 bg-status-red/10',
    concluido: 'text-brand-silver/50 border-brand-silver/20',
    finalizado_sentenca: 'text-brand-silver/50 border-brand-silver/20',
    lead: 'text-status-blue border-status-blue/30 bg-status-blue/10',
    parceria: 'text-status-amber border-status-amber/30 bg-status-amber/10',
    agendada: 'text-status-green border-status-green/30 bg-status-green/10',
    planejado: 'text-brand-silver/50 border-brand-silver/20',
    em_producao: 'text-status-amber border-status-amber/30 bg-status-amber/10',
    pronto: 'text-status-green border-status-green/30 bg-status-green/10',
    publicado: 'text-status-blue border-status-blue/30 bg-status-blue/10',
  }
  return map[status?.toLowerCase()] || 'text-brand-silver/50 border-brand-silver/20'
}

export function getAreaColor(area: string): string {
  if (!area) return 'text-brand-silver/50'
  const lower = area.toLowerCase()
  if (lower.includes('aéreo') || lower.includes('aviação') || lower.includes('passageiro')) return 'text-status-green'
  if (lower.includes('bancário') || lower.includes('bancario')) return 'text-status-blue'
  if (lower.includes('rural') || lower.includes('produtor')) return 'text-status-amber'
  if (lower.includes('previdenciário') || lower.includes('previdenciario')) return 'text-brand-silver'
  if (lower.includes('consumidor')) return 'text-pink-400'
  return 'text-brand-silver/50'
}

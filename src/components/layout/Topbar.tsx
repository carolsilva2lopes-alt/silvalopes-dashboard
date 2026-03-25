'use client'

import { Bell } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TopbarProps {
  title: string
}

export default function Topbar({ title }: TopbarProps) {
  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

  return (
    <header className="h-13 border-b border-brand-silver/8 flex items-center px-6 gap-4 flex-shrink-0 bg-brand-dark" style={{height:'52px'}}>
      <h1 className="text-brand-silver text-sm font-medium flex-1">{title}</h1>
      <span className="text-brand-silver/30 text-xs capitalize">{today}</span>
      <button className="w-7 h-7 border border-brand-silver/12 flex items-center justify-center relative hover:border-brand-silver/30 transition-colors">
        <Bell size={13} className="text-brand-silver/50" />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-status-green rounded-full"></span>
      </button>
    </header>
  )
}

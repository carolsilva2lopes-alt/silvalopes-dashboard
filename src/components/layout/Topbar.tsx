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
    <header className="topbar flex items-center px-6 gap-4 flex-shrink-0" style={{height:'52px'}}>
      <h1 className="font-serif text-brand-silver text-base font-medium tracking-wide flex-1">{title}</h1>
      <span className="text-brand-silver/30 text-xs capitalize hidden md:block">{today}</span>
      <button className="w-7 h-7 border border-brand-silver/12 rounded-lg flex items-center justify-center relative hover:border-status-blue/40 hover:bg-status-blue/5 transition-all">
        <Bell size={13} className="text-brand-silver/50" />
        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-status-green rounded-full ring-2 ring-brand-dark"></span>
      </button>
    </header>
  )
}

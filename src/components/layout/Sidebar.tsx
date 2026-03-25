'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  LayoutDashboard, Users, FileText, Scale, DollarSign,
  Clock, Calendar, CheckSquare, CalendarDays, FolderOpen,
  Package, Megaphone, BarChart3, Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard/painel', label: 'Painel Geral', icon: LayoutDashboard },
      { href: '/dashboard/crm', label: 'CRM / Comercial', icon: Mail, badge: null },
      { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
      { href: '/dashboard/processos', label: 'Processos', icon: FileText },
      { href: '/dashboard/juridico', label: 'Jurídico', icon: Scale },
    ]
  },
  {
    label: 'Gestão',
    items: [
      { href: '/dashboard/financeiro', label: 'Financeiro', icon: DollarSign },
      { href: '/dashboard/prazos', label: 'Prazos', icon: Clock },
      { href: '/dashboard/audiencias', label: 'Audiências', icon: Calendar },
      { href: '/dashboard/tarefas', label: 'Tarefas', icon: CheckSquare },
      { href: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
    ]
  },
  {
    label: 'Operacional',
    items: [
      { href: '/dashboard/documentos', label: 'Documentos', icon: FolderOpen },
      { href: '/dashboard/almoxarifado', label: 'Almoxarifado', icon: Package },
      { href: '/dashboard/marketing', label: 'Marketing', icon: Megaphone },
      { href: '/dashboard/mapa', label: 'Mapa Nacional', icon: BarChart3 },
      { href: '/dashboard/relatorios', label: 'Relatórios', icon: BarChart3 },
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-brand-darker border-r border-brand-silver/8 flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-brand-silver/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center border border-brand-silver/30 flex-shrink-0 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Silva Lopes"
              width={32}
              height={32}
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) parent.innerHTML = '<span class="font-serif text-brand-silver text-sm font-semibold">SL</span>'
              }}
            />
          </div>
          <div>
            <div className="font-serif text-brand-silver text-sm font-semibold leading-tight">Silva Lopes</div>
            <div className="text-brand-silver/30 text-xs tracking-widest uppercase" style={{fontSize:'9px'}}>Advocacia</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="px-3 mb-1">
            <div className="text-brand-silver/25 text-xs tracking-widest uppercase px-1.5 py-2" style={{fontSize:'9px', letterSpacing:'2px'}}>
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('sidebar-item', isActive && 'active')}
                >
                  <Icon size={13} className={cn('flex-shrink-0', isActive ? 'opacity-100' : 'opacity-60')} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-brand-silver/8">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-surface border border-brand-silver/20 flex items-center justify-center text-brand-silver text-xs font-medium flex-shrink-0">
            CL
          </div>
          <div>
            <div className="text-brand-silver/60 text-xs">Carol Silva Lopes</div>
            <div className="text-brand-silver/25 leading-tight" style={{fontSize:'9px', letterSpacing:'0.5px'}}>OAB/GO 56.972</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

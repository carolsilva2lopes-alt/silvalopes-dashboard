import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Silva Lopes Advocacia — Sistema de Gestão',
  description: 'Sistema interno de gestão jurídica — Silva Lopes Advocacia & Assessoria Jurídica',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}

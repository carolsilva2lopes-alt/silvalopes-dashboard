import Sidebar from '@/components/layout/Sidebar'
import { Toaster } from 'react-hot-toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-brand-dark">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111f33',
            color: '#D1D3DA',
            border: '1px solid rgba(209,211,218,0.15)',
            fontSize: '13px',
            fontFamily: 'DM Sans, sans-serif',
          },
          success: { iconTheme: { primary: '#5DCAA5', secondary: '#111f33' } },
          error: { iconTheme: { primary: '#E24B4A', secondary: '#111f33' } },
        }}
      />
    </div>
  )
}

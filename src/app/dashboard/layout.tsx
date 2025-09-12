import { AuthGuard } from '@/components/auth/AuthGuard'
import { AppLayout } from '@/components/layout'
import { BulkSelectionProvider } from '@/contexts/BulkSelectionContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <BulkSelectionProvider>
        <AppLayout>
          {children}
        </AppLayout>
      </BulkSelectionProvider>
    </AuthGuard>
  )
}
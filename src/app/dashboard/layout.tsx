import { AuthGuard } from '@/components/auth/AuthGuard'
import { AppLayout } from '@/components/layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AppLayout>
        {children}
      </AppLayout>
    </AuthGuard>
  )
}
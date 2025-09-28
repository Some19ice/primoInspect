import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout title="Executive Overview" role="executive">
      {children}
    </DashboardLayout>
  )
}

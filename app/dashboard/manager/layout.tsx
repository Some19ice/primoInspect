import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout title="Project Management" role="manager">
      {children}
    </DashboardLayout>
  )
}

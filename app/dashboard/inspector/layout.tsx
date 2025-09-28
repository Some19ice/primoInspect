import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayout title="Field Inspections" role="inspector">
      {children}
    </DashboardLayout>
  )
}

import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { DashboardHeader } from "@/components/admin/layout/dashboard-header"
import { DashboardGrid } from "@/components/admin/layout/dashboard-grid"

export default function AdminPage() {
  return (
    <AdminPageContainer>
      <DashboardHeader />
      <DashboardGrid />
    </AdminPageContainer>
  )
}

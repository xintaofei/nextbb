"use client"

import { AdminPageContainer } from "@/components/admin/admin-page-container"
import { DashboardHeader } from "@/components/admin/dashboard-header"
import { DashboardGrid } from "@/components/admin/dashboard-grid"

export default function AdminPage() {
  return (
    <AdminPageContainer>
      <DashboardHeader />
      <DashboardGrid />
    </AdminPageContainer>
  )
}

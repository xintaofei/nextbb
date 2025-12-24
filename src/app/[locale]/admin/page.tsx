"use client"

import { DashboardHeader } from "@/components/admin/dashboard-header"
import { DashboardGrid } from "@/components/admin/dashboard-grid"

export default function AdminPage() {
  return (
    <div className="relative px-6 py-8 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader />
        <DashboardGrid />
      </div>
    </div>
  )
}

import { ReactNode } from "react"
import { DashboardNav } from "@/components/admin/layout/dashboard-nav"
import { getServerSessionUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin")
  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  // 获取当前用户
  const auth = await getServerSessionUser()
  if (!auth) {
    // 如果用户未登录，重定向到登录页面
    redirect(`/login`)
  }

  // 检查用户是否是管理员
  const user = await prisma.users.findUnique({
    where: { id: auth.userId },
    select: { is_admin: true, is_deleted: true, status: true, name: true },
  })
  if (!user || user.is_deleted || user.status !== 1 || !user.is_admin) {
    redirect(`/`)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <DashboardNav />
      {children}
    </main>
  )
}

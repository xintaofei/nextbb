import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type NotificationsPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: NotificationsPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 通知中心`,
  }
}

export default async function NotificationsPage({
  params,
}: NotificationsPageProps) {
  const { username } = await params

  // 权限验证：仅本人可访问
  const session = await getSessionUser()
  if (!session) {
    redirect("/login")
  }

  const currentUser = await prisma.users.findUnique({
    where: { id: session.userId },
    select: { name: true },
  })

  if (currentUser?.name !== username) {
    redirect(`/u/${username}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">通知中心</h1>
      <div className="text-sm text-muted-foreground">
        用户 {username} 的通知列表 - 待实现
      </div>
    </div>
  )
}

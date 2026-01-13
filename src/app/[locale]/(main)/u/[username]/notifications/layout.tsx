import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decodeUsername, encodeUsername } from "@/lib/utils"
import { NotificationsNavigation } from "@/components/user/notifications-navigation"

type NotificationsLayoutProps = {
  children: ReactNode
  params: Promise<{ username: string }>
}

export default async function NotificationsLayout({
  children,
  params,
}: NotificationsLayoutProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)

  // 权限验证：仅本人可访问通知
  const session = await getSessionUser()
  if (!session) {
    redirect("/login")
  }

  const currentUser = await prisma.users.findUnique({
    where: { id: session.userId },
    select: { name: true },
  })

  if (currentUser?.name !== decodedUsername) {
    redirect(`/u/${encodeUsername(decodedUsername)}`)
  }

  return (
    <div className="flex flex-col w-full">
      <NotificationsNavigation username={decodedUsername} />
      <div className="max-w-5xl mx-auto w-full py-6">{children}</div>
    </div>
  )
}

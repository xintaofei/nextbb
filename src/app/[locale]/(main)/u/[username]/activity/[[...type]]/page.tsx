import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { getServerSessionUser } from "@/lib/server-auth"
import { ActivityClient } from "@/components/user/activity-client"
import { getTranslations } from "next-intl/server"

type ActivityPageProps = {
  params: Promise<{ username: string; type?: string[] }>
}

export async function generateMetadata({
  params,
}: ActivityPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  const t = await getTranslations("User.profile.activity")
  return {
    title: `${decodedUsername} - ${t("title")}`,
  }
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { username, type } = await params
  const decodedUsername = decodeUsername(username)
  const activityType = type?.[0] || "all"

  // 查询用户信息
  const user = await prisma.users.findFirst({
    where: {
      name: decodedUsername,
      is_deleted: false,
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (!user) {
    notFound()
  }

  // 获取当前用户会话
  const session = await getServerSessionUser()
  const currentUser = session
    ? await prisma.users.findUnique({
        where: { id: session.userId },
        select: { id: true, is_admin: true },
      })
    : null

  const isOwnProfile = currentUser?.id === user.id
  const isAdmin = currentUser?.is_admin || false

  return (
    <ActivityClient
      userId={String(user.id)}
      username={user.name}
      initialType={activityType}
      isOwnProfile={isOwnProfile}
      isAdmin={isAdmin}
    />
  )
}

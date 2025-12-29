import { ReactNode } from "react"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { UserInfoHeader } from "@/components/user/user-info-header"
import { UserNavigation } from "@/components/user/user-navigation"
import { decodeUsername } from "@/lib/utils"
import UserNotFound from "./not-found"

type UserProfileLayoutProps = {
  children: ReactNode
  params: Promise<{ username: string }>
}

export default async function UserProfileLayout({
  children,
  params,
}: UserProfileLayoutProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)

  // 查询用户信息
  const user = await prisma.users.findFirst({
    where: {
      name: decodedUsername,
      is_deleted: false,
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      email: true,
      status: true,
      is_admin: true,
      created_at: true,
      credits: true,
    },
  })

  // 用户不存在或被禁用 - 直接渲染错误页面
  if (!user || user.status !== 1) {
    return <UserNotFound />
  }

  // 获取当前登录用户
  const session = await getSessionUser()
  const currentUser = session
    ? await prisma.users.findUnique({
        where: { id: session.userId },
        select: { id: true, name: true, is_admin: true },
      })
    : null

  // 判断是否为本人
  const isOwnProfile = currentUser?.id === user.id
  // 判断是否为管理员
  const isAdmin = currentUser?.is_admin || false

  // 获取用户统计数据
  const [topicsCount, postsCount, likesReceived, bookmarksCount, badgesCount] =
    await Promise.all([
      prisma.topics.count({
        where: { user_id: user.id, is_deleted: false },
      }),
      prisma.posts.count({
        where: { user_id: user.id, is_deleted: false },
      }),
      prisma.posts.count({
        where: {
          topic: {
            user_id: user.id,
            is_deleted: false,
          },
          is_deleted: false,
        },
      }),
      prisma.post_bookmarks.count({
        where: { user_id: user.id },
      }),
      prisma.user_badges.count({
        where: { user_id: user.id, is_deleted: false },
      }),
    ])

  return (
    <div className="flex flex-col w-full p-8 max-sm:p-4">
      {/* 用户信息头部区域 */}
      <UserInfoHeader
        user={user}
        statistics={{
          topicsCount,
          postsCount,
          likesReceived,
          bookmarksCount,
          badgesCount,
          credits: user.credits,
        }}
        isOwnProfile={isOwnProfile}
        isAdmin={isAdmin}
      />

      {/* 导航标签栏 */}
      <UserNavigation username={user.name} isOwnProfile={isOwnProfile} />

      {/* 内容展示区 */}
      <div className="w-full">
        <div className="max-w-5xl mx-auto py-6">{children}</div>
      </div>
    </div>
  )
}

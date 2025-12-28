import { Metadata } from "next"
import { prisma } from "@/lib/prisma"

type UserOverviewPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: UserOverviewPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 用户主页`,
  }
}

export default async function UserOverviewPage({
  params,
}: UserOverviewPageProps) {
  const { username } = await params

  // 查询用户统计数据
  const user = await prisma.users.findFirst({
    where: {
      name: username,
      is_deleted: false,
    },
    select: {
      id: true,
      name: true,
    },
  })

  if (!user) {
    return null
  }

  // 统计数据（简化版，实际应该在 layout 中通过 context 传递）
  const [topicsCount, postsCount, badgesCount] = await Promise.all([
    prisma.topics.count({
      where: { user_id: user.id, is_deleted: false },
    }),
    prisma.posts.count({
      where: { user_id: user.id, is_deleted: false },
    }),
    prisma.user_badges.count({
      where: { user_id: user.id, is_deleted: false },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 统计卡片 */}
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">{topicsCount}</div>
          <div className="text-sm text-muted-foreground">发布的话题</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">{postsCount}</div>
          <div className="text-sm text-muted-foreground">回复的帖子</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-2xl font-bold">{badgesCount}</div>
          <div className="text-sm text-muted-foreground">获得的徽章</div>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">最近活动</h2>
        <div className="text-sm text-muted-foreground">
          最近活动列表 - 待实现
        </div>
      </div>

      {/* 热门话题 */}
      <div className="border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">热门话题</h2>
        <div className="text-sm text-muted-foreground">
          热门话题列表 - 待实现
        </div>
      </div>
    </div>
  )
}

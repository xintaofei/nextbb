import { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { decodeUsername } from "@/lib/utils"
import { UserOverviewClient } from "@/components/user/user-overview-client"

type UserOverviewPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: UserOverviewPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 用户主页`,
  }
}

export default async function UserOverviewPage({
  params,
}: UserOverviewPageProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)

  // 查询用户统计数据
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
    return null
  }

  return <UserOverviewClient userId={user.id.toString()} />
}

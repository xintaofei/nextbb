import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import FollowsClient from "@/components/user/follows-client"

type FollowsPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: FollowsPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  const t = await getTranslations("User.profile")

  return {
    title: `${decodedUsername} - ${t("follows.title")}`,
  }
}

export default async function FollowsPage({ params }: FollowsPageProps) {
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
    },
  })

  if (!user) {
    notFound()
  }

  return <FollowsClient userId={user.id.toString()} username={user.name} />
}

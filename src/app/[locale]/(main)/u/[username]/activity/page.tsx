import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"

type ActivityPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: ActivityPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 活动记录`,
  }
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">活动记录</h1>
      <div className="text-sm text-muted-foreground">
        用户 {decodedUsername} 的活动时间线 - 待实现
      </div>
    </div>
  )
}

import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"

type BadgesPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: BadgesPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 徽章`,
  }
}

export default async function BadgesPage({ params }: BadgesPageProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">徽章展示</h1>
      <div className="text-sm text-muted-foreground">
        用户 {decodedUsername} 的徽章列表 - 待实现
      </div>
    </div>
  )
}

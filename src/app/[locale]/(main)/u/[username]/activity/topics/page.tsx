import { Metadata } from "next"

type TopicsPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: TopicsPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 发布的话题`,
  }
}

export default async function TopicsPage({ params }: TopicsPageProps) {
  const { username } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">发布的话题</h1>
      <div className="text-sm text-muted-foreground">
        用户 {username} 的话题列表 - 待实现
      </div>
    </div>
  )
}

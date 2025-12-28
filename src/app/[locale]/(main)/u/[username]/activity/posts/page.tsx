import { Metadata } from "next"

type PostsPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: PostsPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 回复的帖子`,
  }
}

export default async function PostsPage({ params }: PostsPageProps) {
  const { username } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">回复的帖子</h1>
      <div className="text-sm text-muted-foreground">
        用户 {username} 的帖子列表 - 待实现
      </div>
    </div>
  )
}

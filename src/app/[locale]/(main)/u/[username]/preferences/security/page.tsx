import { Metadata } from "next"

type SecurityPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: SecurityPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 安全设置`,
  }
}

export default async function SecurityPage({ params }: SecurityPageProps) {
  const { username } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">安全设置</h1>
      <div className="text-sm text-muted-foreground">
        用户 {username} 的安全设置 - 待实现
      </div>
    </div>
  )
}

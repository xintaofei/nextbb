import { Metadata } from "next"

type PrivacyPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 隐私设置`,
  }
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { username } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">隐私设置</h1>
      <div className="text-sm text-muted-foreground">
        用户 {username} 的隐私设置 - 待实现
      </div>
    </div>
  )
}

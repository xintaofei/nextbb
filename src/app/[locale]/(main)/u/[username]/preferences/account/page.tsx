import { Metadata } from "next"

type AccountPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: AccountPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 账户设置`,
  }
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { username } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">账户设置</h1>
      <div className="text-sm text-muted-foreground">
        用户 {username} 的账户设置 - 待实现
      </div>
    </div>
  )
}

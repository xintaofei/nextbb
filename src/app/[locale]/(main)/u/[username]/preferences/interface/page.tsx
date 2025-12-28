import { Metadata } from "next"

type InterfacePageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: InterfacePageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 界面设置`,
  }
}

export default async function InterfacePage({ params }: InterfacePageProps) {
  const { username } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">界面设置</h1>
      <div className="text-sm text-muted-foreground">
        用户 {username} 的界面设置 - 待实现
      </div>
    </div>
  )
}

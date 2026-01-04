import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"
import { Palette } from "lucide-react"

type InterfacePageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: InterfacePageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 界面设置`,
  }
}

export default async function InterfacePage({ params }: InterfacePageProps) {
  const { username } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">界面设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          自定义主题、语言等界面偏好
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
        <Palette className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">功能开发中</p>
        <p className="text-sm text-muted-foreground mt-2">
          主题、语言、时区等设置功能即将上线
        </p>
      </div>
    </div>
  )
}

import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"
import { Lock } from "lucide-react"

type PrivacyPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 隐私设置`,
  }
}

export default async function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">隐私设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          控制个人资料的可见性
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
        <Lock className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">功能开发中</p>
        <p className="text-sm text-muted-foreground mt-2">
          隐私设置功能即将上线
        </p>
      </div>
    </div>
  )
}

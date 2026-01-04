import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"
import { Shield } from "lucide-react"

type SecurityPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: SecurityPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 安全设置`,
  }
}

export default async function SecurityPage({ params }: SecurityPageProps) {
  const { username } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">安全设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理密码和第三方账号绑定
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">功能开发中</p>
        <p className="text-sm text-muted-foreground mt-2">
          密码修改、第三方账号绑定等功能即将上线
        </p>
      </div>
    </div>
  )
}

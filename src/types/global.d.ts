// 导入默认语言的 JSON 结构作为类型源
import zh from "../i18n/messages/zh.json"
import type { DefaultSession } from "next-auth"
import type { LinuxDoProfile } from "@/lib/providers/linuxdo"

// 推断类型
type Messages = typeof zh

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
  }
}

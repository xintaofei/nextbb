// 导入默认语言的 JSON 结构作为类型源
import zh from "../i18n/messages/zh.json"
import type { DefaultSession } from "next-auth"

// 推断类型
type Messages = typeof zh

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      avatar: string
      isAdmin: boolean
      credits: number
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image: string
    isAdmin?: boolean
    credits?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    picture: string
    isAdmin: boolean
    credits: number
  }
}

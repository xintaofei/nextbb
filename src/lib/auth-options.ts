import type { NextAuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { LinuxDoProvider } from "@/lib/providers/linuxdo"
import { uploadAvatarFromUrl } from "@/lib/blob"

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v || v.length === 0) {
    throw new Error(`${name} is not set`)
  }
  return v
}

/**
 * 生成随机字母数字组合
 * @param length 长度
 * @returns 随机字符串
 */
function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 确保用户名唯一，如果已存在则添加随机后缀
 * @param name 原始用户名
 * @returns 唯一的用户名
 */
async function ensureUniqueName(name: string): Promise<string> {
  // 先检查原始用户名是否存在
  const existingUser = await prisma.users.findFirst({
    where: { name },
  })

  if (!existingUser) {
    return name
  }

  // 用户名已存在，添加5位随机字母数字组合
  let uniqueName = `${name}${generateRandomString(5)}`

  // 万一生成的名称还是重复（概率极低），继续尝试
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const check = await prisma.users.findFirst({
      where: { name: uniqueName },
    })

    if (!check) {
      return uniqueName
    }

    uniqueName = `${name}${generateRandomString(5)}`
    attempts++
  }

  // 如果10次都失败，使用时间戳作为后备方案
  return `${name}${Date.now().toString().slice(-8)}`
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== "production",
  providers: [
    GitHubProvider({
      clientId: getEnv("GITHUB_CLIENT_ID"),
      clientSecret: getEnv("GITHUB_CLIENT_SECRET"),
      httpOptions: { timeout: 60000 },
    }),
    GoogleProvider({
      clientId: getEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
      httpOptions: { timeout: 60000 },
    }),
    LinuxDoProvider,
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account) return false
      const provider = account.provider
      if (
        provider !== "github" &&
        provider !== "google" &&
        provider !== "linuxdo"
      )
        return false
      const email =
        user.email ??
        (typeof profile?.email === "string" ? profile.email : null) ??
        null
      if (!email) return false
      const existing = await prisma.users.findUnique({
        where: { email },
      })
      const avatarSrc =
        user.image ??
        (typeof (profile as { picture?: string }).picture === "string"
          ? (profile as { picture?: string }).picture
          : null) ??
        null
      if (existing) {
        // 用户已存在，直接返回，不修改任何信息
        return true
      }
      const id = generateId()
      let name =
        user.name ??
        (typeof profile?.name === "string" && profile.name.length > 0
          ? profile.name
          : null)
      if (!name && provider === "linuxdo") {
        const p = profile as { username?: string; login?: string }
        name =
          (typeof p.username === "string" && p.username.length > 0
            ? p.username
            : null) ??
          (typeof p.login === "string" && p.login.length > 0 ? p.login : null)
      }
      if (!name) {
        name = email.split("@")[0]
      }

      // 确保用户名唯一
      const uniqueName = await ensureUniqueName(name)

      let avatar = ""
      if (avatarSrc && avatarSrc.length > 0) {
        try {
          avatar = await uploadAvatarFromUrl(id, avatarSrc)
        } catch {
          avatar = avatarSrc
        }
      }
      await prisma.users.create({
        data: {
          id,
          email,
          name: uniqueName,
          avatar,
          password: "oauth",
          status: 1,
          is_deleted: false,
        },
      })
      return true
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const u = await prisma.users.findUnique({
          where: { email: user.email },
          select: { id: true, email: true, name: true, avatar: true },
        })
        if (u) {
          token.id = u.id.toString()
          token.email = u.email
          token.name = u.name
          token.picture = u.avatar
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = typeof token.id === "string" ? token.id : undefined
      }
      return session
    },
  },
  secret: getEnv("NEXTAUTH_SECRET"),
}

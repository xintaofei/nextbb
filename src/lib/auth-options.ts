import type { NextAuthOptions } from "next-auth"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { uploadAvatarFromUrl } from "@/lib/blob"
import { AutomationEvents } from "@/lib/automation/event-bus"
import { recordLogin } from "@/lib/auth"
import { getOAuthConfigs } from "@/lib/services/config-service"
import {
  createGitHubProvider,
  createGoogleProvider,
  createLinuxDoProvider,
} from "@/lib/providers/oauth-factory"

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

export async function createAuthOptions(): Promise<NextAuthOptions> {
  // 从数据库加载 OAuth 配置（带缓存）
  const oauthConfigs = await getOAuthConfigs()

  // 动态构建 providers 数组
  const providers: NextAuthOptions["providers"] = []

  const githubProvider = createGitHubProvider(oauthConfigs.github)
  if (githubProvider) providers.push(githubProvider)

  const googleProvider = createGoogleProvider(oauthConfigs.google)
  if (googleProvider) providers.push(googleProvider)

  const linuxdoProvider = createLinuxDoProvider(oauthConfigs.linuxdo)
  if (linuxdoProvider) providers.push(linuxdoProvider)

  // 如果没有启用任何 Provider，记录警告
  if (providers.length === 0) {
    console.warn("[Auth] 警告: 没有启用任何 OAuth Provider")
  }

  return {
    debug: process.env.NODE_ENV !== "production",
    providers,
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

        if (existing && (existing.is_deleted || existing.status !== 1)) {
          await recordLogin(existing.id, "FAILED", provider.toUpperCase())
          return false
        }

        const avatarSrc =
          user.image ??
          (typeof (profile as { picture?: string }).picture === "string"
            ? (profile as { picture?: string }).picture
            : null) ??
          null

        let targetUser = existing

        if (!targetUser) {
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
              (typeof p.login === "string" && p.login.length > 0
                ? p.login
                : null)
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
          targetUser = await prisma.users.create({
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

          // 触发用户注册事件
          await AutomationEvents.userRegister({
            userId: targetUser.id,
            email: targetUser.email,
            oauthProvider: provider,
          })
        }

        // 记录登录信息（包括新用户和老用户）
        await recordLogin(targetUser.id, "SUCCESS", provider.toUpperCase())

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
}

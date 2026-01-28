import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { uploadAvatarFromUrl } from "@/lib/blob"
import { AutomationEvents } from "@/lib/automation/event-bus"
import { recordLogin } from "@/lib/auth"
import { getSocialProviders } from "@/lib/services/social-provider-service"
import { createOAuthProvider } from "@/lib/providers/oauth-factory"
import { encodeUsername } from "@/lib/utils"

export const SOCIAL_LINK_COOKIE = "social_link_user_id"

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
  const socialProviders = await getSocialProviders()

  // 动态构建 providers 数组
  const providers: NextAuthOptions["providers"] = []

  for (const config of socialProviders) {
    const provider = createOAuthProvider(config)
    if (provider) {
      providers.push(provider)
    }
  }

  // 添加 Credentials Provider 用于邮箱密码登录
  providers.push(
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        })

        if (!user || user.is_deleted || user.status !== 1) {
          await recordLogin(user?.id || null, "FAILED", "CREDENTIALS")
          return null
        }

        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) {
          await recordLogin(user.id, "FAILED", "CREDENTIALS")
          return null
        }

        await recordLogin(user.id, "SUCCESS", "CREDENTIALS")

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.avatar,
        }
      },
    })
  )

  if (providers.length === 0) {
    console.warn("[Auth] 警告: 没有启用任何 OAuth Provider")
  }

  const validProviderIds = new Set(socialProviders.map((p) => p.providerKey))

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

        // 对于 credentials provider，直接返回 true
        if (provider === "credentials") {
          return true
        }

        if (!validProviderIds.has(provider)) {
          return false
        }

        const email =
          user.email ??
          (typeof profile?.email === "string" ? profile.email : null) ??
          null
        if (!email) return false

        const providerUid = account.providerAccountId
        const providerUsername =
          (profile as { login?: string })?.login ??
          (profile as { username?: string })?.username ??
          user.name ??
          null

        const avatarSrc =
          user.image ??
          (typeof (profile as { picture?: string }).picture === "string"
            ? (profile as { picture?: string }).picture
            : null) ??
          null

        const cookieStore = await cookies()
        const linkUserIdStr = cookieStore.get(SOCIAL_LINK_COOKIE)?.value
        const isLinkMode = !!linkUserIdStr

        if (isLinkMode) {
          cookieStore.delete(SOCIAL_LINK_COOKIE)
          const linkUserId = BigInt(linkUserIdStr)

          // 查询要链接的用户信息
          const linkUser = await prisma.users.findUnique({
            where: { id: linkUserId },
            select: { name: true },
          })

          if (!linkUser) {
            return false
          }

          const encodedLinkUsername = encodeUsername(linkUser.name)

          const existingLink = await prisma.user_social_accounts.findUnique({
            where: {
              provider_key_provider_uid: {
                provider_key: provider,
                provider_uid: providerUid,
              },
            },
          })

          if (existingLink) {
            if (existingLink.user_id === linkUserId) {
              return `/u/${encodedLinkUsername}/preferences/account?error=already_linked`
            }
            return `/u/${encodedLinkUsername}/preferences/account?error=account_linked_other`
          }

          await prisma.user_social_accounts.create({
            data: {
              id: generateId(),
              user_id: linkUserId,
              provider_key: provider,
              provider_uid: providerUid,
              provider_username: providerUsername,
              provider_email: email,
              provider_avatar: avatarSrc,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              token_expires_at: account.expires_at
                ? new Date(account.expires_at * 1000)
                : null,
              last_used_at: new Date(),
            },
          })

          return `/u/${encodedLinkUsername}/preferences/account?success=linked`
        }

        const existingSocialAccount =
          await prisma.user_social_accounts.findUnique({
            where: {
              provider_key_provider_uid: {
                provider_key: provider,
                provider_uid: providerUid,
              },
            },
            include: { user: true },
          })

        if (existingSocialAccount) {
          const linkedUser = existingSocialAccount.user
          if (linkedUser.is_deleted || linkedUser.status !== 1) {
            await recordLogin(linkedUser.id, "FAILED", provider.toUpperCase())
            return false
          }

          await prisma.user_social_accounts.update({
            where: { id: existingSocialAccount.id },
            data: {
              provider_username: providerUsername,
              provider_email: email,
              provider_avatar: avatarSrc,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              token_expires_at: account.expires_at
                ? new Date(account.expires_at * 1000)
                : null,
              last_used_at: new Date(),
            },
          })

          await recordLogin(linkedUser.id, "SUCCESS", provider.toUpperCase())
          return true
        }

        const existingUserByEmail = await prisma.users.findUnique({
          where: { email },
          include: {
            social_accounts: {
              where: { provider_key: provider },
            },
          },
        })

        if (existingUserByEmail) {
          if (
            existingUserByEmail.is_deleted ||
            existingUserByEmail.status !== 1
          ) {
            await recordLogin(
              existingUserByEmail.id,
              "FAILED",
              provider.toUpperCase()
            )
            return false
          }

          if (existingUserByEmail.social_accounts.length === 0) {
            await prisma.user_social_accounts.create({
              data: {
                id: generateId(),
                user_id: existingUserByEmail.id,
                provider_key: provider,
                provider_uid: providerUid,
                provider_username: providerUsername,
                provider_email: email,
                provider_avatar: avatarSrc,
                access_token: account.access_token ?? null,
                refresh_token: account.refresh_token ?? null,
                token_expires_at: account.expires_at
                  ? new Date(account.expires_at * 1000)
                  : null,
                last_used_at: new Date(),
              },
            })
          }

          await recordLogin(
            existingUserByEmail.id,
            "SUCCESS",
            provider.toUpperCase()
          )
          return true
        }

        const id = generateId()
        let name: string =
          user.name ??
          (typeof profile?.name === "string" && profile.name.length > 0
            ? profile.name
            : "")
        if (!name && provider === "linuxdo") {
          const p = profile as { username?: string; login?: string }
          name =
            (typeof p.username === "string" && p.username.length > 0
              ? p.username
              : "") ||
            (typeof p.login === "string" && p.login.length > 0 ? p.login : "")
        }
        if (!name) {
          name = email.split("@")[0]
        }

        const uniqueName = await ensureUniqueName(name)

        let avatar = ""
        if (avatarSrc && avatarSrc.length > 0) {
          try {
            avatar = await uploadAvatarFromUrl(id, avatarSrc)
          } catch {
            avatar = avatarSrc
          }
        }

        // 检查是否是第一个用户
        const userCount = await prisma.users.count()
        const isFirstUser = userCount === 0

        await prisma.$transaction(async (tx) => {
          await tx.users.create({
            data: {
              id,
              email,
              name: uniqueName,
              avatar,
              password: "oauth",
              status: 1,
              is_deleted: false,
              is_admin: isFirstUser,
            },
          })

          await tx.user_social_accounts.create({
            data: {
              id: generateId(),
              user_id: id,
              provider_key: provider,
              provider_uid: providerUid,
              provider_username: providerUsername,
              provider_email: email,
              provider_avatar: avatarSrc,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              token_expires_at: account.expires_at
                ? new Date(account.expires_at * 1000)
                : null,
              last_used_at: new Date(),
            },
          })
        })

        await AutomationEvents.userRegister({
          userId: id,
          email,
          oauthProvider: provider,
        })

        await recordLogin(id, "SUCCESS", provider.toUpperCase())

        return true
      },
      async jwt({ token, user, trigger }) {
        // 初始登录或强制刷新
        if (user || trigger === "update") {
          const email = user?.email || token.email
          if (!email) return token

          const dbUser = await prisma.users.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              is_admin: true,
              credits: true,
              is_deleted: true,
              status: true,
            },
          })

          if (!dbUser || dbUser.is_deleted || dbUser.status !== 1) {
            return token
          }

          token.id = dbUser.id.toString()
          token.email = dbUser.email
          token.name = dbUser.name
          token.picture = dbUser.avatar
          token.isAdmin = dbUser.is_admin
          token.credits = dbUser.credits
        }

        return token
      },
      async session({ session, token }) {
        if (
          token &&
          token.id &&
          token.email &&
          token.name &&
          token.picture &&
          typeof token.isAdmin === "boolean" &&
          typeof token.credits === "number"
        ) {
          session.user = {
            id: token.id,
            email: token.email,
            name: token.name,
            avatar: token.picture,
            isAdmin: token.isAdmin,
            credits: token.credits,
          }
        }
        return session
      },
    },
    secret: getEnv("NEXTAUTH_SECRET"),
  }
}

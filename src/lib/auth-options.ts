import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getSocialProviders } from "@/lib/services/social-provider-service"
import { createOAuthProvider } from "@/lib/providers/oauth-factory"
import {
  checkLoginRateLimit,
  recordFailedLoginAttempt,
  clearLoginAttempts,
} from "@/lib/rate-limit"
import { getClientIp } from "@/lib/get-client-ip"
import { recordLogin } from "@/lib/auth"
import {
  handleSocialLinkMode,
  handleExistingSocialAccount,
  handleExistingUserByEmail,
  createNewOAuthUser,
} from "@/lib/auth-helpers"
import { logSecurityEvent } from "@/lib/security-logger"
import { isUserForcedLogout } from "@/lib/session-blacklist"

export const SOCIAL_LINK_COOKIE = "social_link_user_id"

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v || v.length === 0) {
    throw new Error(`${name} is not set`)
  }
  return v
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

        // Rate limiting 检查
        const clientIp = await getClientIp()
        const emailRateLimit = await checkLoginRateLimit(
          `email:${credentials.email}`
        )
        const ipRateLimit = await checkLoginRateLimit(`ip:${clientIp}`)

        if (!emailRateLimit.allowed) {
          logSecurityEvent({
            event: "LOGIN_RATE_LIMITED",
            email: credentials.email,
            ip: clientIp,
            details: `邮箱被限流，剩余时间：${emailRateLimit.remainingTime}秒`,
          })
          return null
        }

        if (!ipRateLimit.allowed) {
          logSecurityEvent({
            event: "LOGIN_RATE_LIMITED",
            ip: clientIp,
            email: credentials.email,
            details: `IP 被限流，剩余时间：${ipRateLimit.remainingTime}秒`,
          })
          return null
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        })

        if (!user || user.is_deleted || user.status !== 1) {
          logSecurityEvent({
            event: "LOGIN_FAILED",
            userId: user?.id || null,
            email: credentials.email,
            ip: clientIp,
            provider: "CREDENTIALS",
            details: user
              ? user.is_deleted
                ? "账户已删除"
                : "账户已禁用"
              : "用户不存在",
          })
          await recordLogin(user?.id || null, "FAILED", "CREDENTIALS")
          await recordFailedLoginAttempt(`email:${credentials.email}`)
          await recordFailedLoginAttempt(`ip:${clientIp}`)
          return null
        }

        // OAuth 用户没有密码，不能使用密码登录
        if (!user.password) {
          logSecurityEvent({
            event: "LOGIN_FAILED",
            userId: user.id,
            email: credentials.email,
            ip: clientIp,
            provider: "CREDENTIALS",
            details: "OAuth 用户不能使用密码登录",
          })
          await recordLogin(user.id, "FAILED", "CREDENTIALS")
          await recordFailedLoginAttempt(`email:${credentials.email}`)
          await recordFailedLoginAttempt(`ip:${clientIp}`)
          return null
        }

        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) {
          logSecurityEvent({
            event: "PASSWORD_MISMATCH",
            userId: user.id,
            email: credentials.email,
            ip: clientIp,
            provider: "CREDENTIALS",
          })
          await recordLogin(user.id, "FAILED", "CREDENTIALS")
          await recordFailedLoginAttempt(`email:${credentials.email}`)
          await recordFailedLoginAttempt(`ip:${clientIp}`)
          return null
        }

        await recordLogin(user.id, "SUCCESS", "CREDENTIALS")
        await clearLoginAttempts(`email:${credentials.email}`)
        await clearLoginAttempts(`ip:${clientIp}`)
        logSecurityEvent({
          event: "LOGIN_SUCCESS",
          userId: user.id,
          email: user.email,
          ip: clientIp,
          provider: "CREDENTIALS",
        })

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

        // 检查是否是链接模式
        const cookieStore = await cookies()
        const linkUserIdStr = cookieStore.get(SOCIAL_LINK_COOKIE)?.value
        const isLinkMode = !!linkUserIdStr

        if (isLinkMode) {
          return await handleSocialLinkMode(
            provider,
            providerUid,
            providerUsername,
            email,
            avatarSrc,
            account
          )
        }

        // 检查是否已存在社交账号
        const existingResult = await handleExistingSocialAccount(
          provider,
          providerUid,
          providerUsername,
          email,
          avatarSrc,
          account
        )
        if (existingResult !== false) return existingResult

        // 检查是否已存在邮箱（自动关联）
        const emailResult = await handleExistingUserByEmail(
          provider,
          providerUid,
          providerUsername,
          email,
          avatarSrc,
          account
        )
        if (emailResult !== false) return emailResult

        // 创建新用户
        if (!profile) return false
        return await createNewOAuthUser(
          provider,
          providerUid,
          providerUsername,
          email,
          avatarSrc,
          account,
          profile
        )
      },
      async jwt({ token, user, trigger }) {
        // 检查用户是否被强制登出
        if (token.id) {
          const isBlacklisted = await isUserForcedLogout(token.id)
          if (isBlacklisted) {
            logSecurityEvent({
              event: "UNAUTHORIZED_ACCESS",
              userId: token.id,
              email: token.email,
              details: "用户已被强制登出",
            })
            // 返回无效 token，强制用户重新登录
            return {
              id: "",
              email: "",
              name: "",
              picture: "",
              isAdmin: false,
            }
          }
        }

        // 初始登录：user 对象存在，直接使用
        if (user) {
          token.id = user.id
          token.email = user.email
          token.name = user.name
          token.picture = user.image
          token.isAdmin = user.isAdmin ?? false
          return token
        }

        // 仅在显式调用 update() 时才刷新用户信息
        if (trigger === "update") {
          const email = token.email
          if (!email) return token

          const dbUser = await prisma.users.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
              is_admin: true,
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
        }

        // 其他情况（正常请求）：直接返回现有 token，不查询数据库
        return token
      },
      async session({ session, token }) {
        if (
          token &&
          token.id &&
          token.email &&
          token.name &&
          token.picture &&
          typeof token.isAdmin === "boolean"
        ) {
          session.user = {
            id: token.id,
            email: token.email,
            name: token.name,
            avatar: token.picture,
            isAdmin: token.isAdmin,
          }
        }
        return session
      },
    },
    secret: getEnv("NEXTAUTH_SECRET"),
    pages: {
      signIn: "/login",
      error: "/login",
    },
    // 安全配置
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
      sessionToken: {
        name:
          process.env.NODE_ENV === "production"
            ? "__Secure-next-auth.session-token"
            : "next-auth.session-token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
        },
      },
    },
  }
}

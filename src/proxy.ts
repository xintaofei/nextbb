import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { logSecurityEvent } from "@/lib/security-logger"
import { isUserForcedLogout } from "@/lib/session-blacklist"

const intlMiddleware = createMiddleware(routing)

/**
 * 敏感操作路由配置（需要检查用户黑名单）
 * 支持通配符 * 匹配任意路径段
 */
const SENSITIVE_ROUTES: Array<{ path: string; methods: string[] }> = [
  { path: "/api/topics", methods: ["POST"] }, // 发帖
  { path: "/api/topic/*/reply", methods: ["POST"] }, // 回帖
  // 未来可以添加更多敏感路由，例如：
  // { path: "/api/users/*/profile", methods: ["PUT", "PATCH"] }, // 修改个人资料
  // { path: "/api/post/*/like", methods: ["POST"] },             // 点赞
]

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * 将路径模式转换为正则表达式
 * @param pattern 路径模式（支持 * 通配符）
 */
function patternToRegex(pattern: string): RegExp {
  // 1. 转义所有正则特殊字符
  const escaped = escapeRegExp(pattern)
  // 2. 将 \* (已转义的 *) 替换为 [^/]+ (匹配一个或多个非斜杠字符)
  const regexPattern = "^" + escaped.replace(/\\\*/g, "[^/]+") + "$"
  return new RegExp(regexPattern)
}

/**
 * 预编译的敏感路由配置（性能优化：正则表达式只编译一次）
 */
const SENSITIVE_ROUTES_COMPILED = SENSITIVE_ROUTES.map((route) => ({
  ...route,
  regex: patternToRegex(route.path),
}))

/**
 * 检查路径是否匹配敏感路由模式
 * @param pathname 请求路径
 * @param method HTTP 方法
 */
function matchesSensitiveRoute(pathname: string, method: string): boolean {
  for (const route of SENSITIVE_ROUTES_COMPILED) {
    // 检查 HTTP 方法是否匹配
    if (!route.methods.includes(method)) {
      continue
    }

    // 使用预编译的正则表达式匹配
    if (route.regex.test(pathname)) {
      return true
    }
  }

  return false
}

export default async function middleware(request: NextRequest) {
  let token = null
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
  } catch (error) {
    console.error("[Middleware] Token获取失败:", error)
  }

  const { pathname } = request.nextUrl
  // 统一处理 API 请求
  if (pathname.includes("/api/")) {
    // 1. 检查敏感操作路由的用户黑名单
    if (matchesSensitiveRoute(pathname, request.method)) {
      try {
        // 如果用户已登录，检查是否被强制登出
        if (token && token.id) {
          const isBlacklisted = await isUserForcedLogout(token.id as string)
          if (isBlacklisted) {
            logSecurityEvent({
              event: "UNAUTHORIZED_ACCESS",
              userId: token.id as string,
              email: token.email,
              ip: request.headers.get("x-forwarded-for") || "unknown",
              details: `用户已被强制登出，尝试访问: ${pathname}`,
            })
            return NextResponse.json(
              { error: "Session invalidated" },
              { status: 401 }
            )
          }
        }
      } catch (error) {
        console.error("[Middleware] 黑名单检查失败:", error)
        // 黑名单检查失败时不阻止请求，让 API 路由自行处理
      }
    }

    // 2. Check if the path is an admin API route
    if (pathname.includes("/api/admin")) {
      if (!token) {
        logSecurityEvent({
          event: "UNAUTHORIZED_ACCESS",
          ip: request.headers.get("x-forwarded-for") || "unknown",
          details: `尝试访问管理员 API: ${pathname}`,
        })
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      if (!token.isAdmin) {
        logSecurityEvent({
          event: "ADMIN_ACCESS_DENIED",
          userId: token.id,
          email: token.email,
          ip: request.headers.get("x-forwarded-for") || "unknown",
          details: `非管理员尝试访问: ${pathname}`,
        })
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
  }

  // 为请求注入用户信息到 Header (优化 server-auth 获取性能)
  const requestHeaders = new Headers(request.headers)
  if (token && token.id) {
    requestHeaders.set("x-user-id", token.id as string)
    requestHeaders.set("x-user-email", token.email || "")
    requestHeaders.set("x-user-is-admin", String(!!token.isAdmin))
  } else {
    // 强制清除用户身份相关的 Header，防止客户端伪造
    requestHeaders.delete("x-user-id")
    requestHeaders.delete("x-user-email")
    requestHeaders.delete("x-user-is-admin")
  }

  // 使用带有净化/注入后 Header 的请求对象传递给下一个中间件
  return intlMiddleware(
    new NextRequest(request, {
      headers: requestHeaders,
    })
  )
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
}

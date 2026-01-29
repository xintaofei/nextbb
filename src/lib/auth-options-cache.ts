import { createAuthOptions } from "./auth-options"
import type { NextAuthOptions } from "next-auth"
import { cache as reactCache } from "react"

type AuthOptionsCache = {
  options: NextAuthOptions
  timestamp: number
}

// 使用 globalThis 避免开发环境热重载时重复初始化
const globalForAuth = globalThis as unknown as {
  authOptionsCache: AuthOptionsCache | null
}

// 缓存有效期: 5 分钟 (作为兜底,防止 serverless 不同实例间配置不一致)
const CACHE_TTL = 5 * 60 * 1000

/**
 * 内部实现：获取 authOptions（带全局内存缓存）
 * - 优先使用缓存,减少数据库查询
 * - 30 分钟有效期作为兜底,防止 serverless 环境下配置长期不同步
 * - 可通过 invalidateAuthOptionsCache() 主动失效当前实例缓存
 */
async function _getAuthOptions(): Promise<NextAuthOptions> {
  const now = Date.now()
  const cache = globalForAuth.authOptionsCache

  // 如果缓存存在且未过期,直接返回
  if (cache && now - cache.timestamp < CACHE_TTL) {
    return cache.options
  }

  // 缓存不存在或已过期,重新创建
  const options = await createAuthOptions()
  globalForAuth.authOptionsCache = {
    options,
    timestamp: now,
  }

  return options
}

/**
 * 获取 authOptions
 * 使用 React cache 包装，确保在同一次请求生命周期内只执行一次
 */
export const getAuthOptions = reactCache(_getAuthOptions)

/**
 * 主动失效缓存
 * 在更新 social providers 配置时调用
 * 注意: serverless 环境中只会失效当前实例的缓存
 */
export function invalidateAuthOptionsCache(): void {
  globalForAuth.authOptionsCache = null
}

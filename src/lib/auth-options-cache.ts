import { createAuthOptions } from "./auth-options"
import type { NextAuthOptions } from "next-auth"

let cachedAuthOptions: NextAuthOptions | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5分钟

/**
 * 获取 authOptions（带缓存）
 * 缓存 5 分钟，减少数据库查询
 */
export async function getAuthOptions(): Promise<NextAuthOptions> {
  const now = Date.now()

  // 如果缓存有效，直接返回
  if (cachedAuthOptions && now - cacheTimestamp < CACHE_TTL) {
    return cachedAuthOptions
  }

  // 缓存失效或不存在，重新创建
  cachedAuthOptions = await createAuthOptions()
  cacheTimestamp = now

  return cachedAuthOptions
}

/**
 * 主动失效缓存
 * 在更新 social providers 配置时调用
 */
export function invalidateAuthOptionsCache(): void {
  cachedAuthOptions = null
  cacheTimestamp = 0
  console.log("[AuthOptionsCache] 缓存已失效")
}

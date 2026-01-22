import { unstable_cache, revalidateTag } from "next/cache"
import {
  getPublicConfigs as getPublicConfigsFromService,
  invalidateConfigCache as invalidateRedisCache,
} from "@/lib/services/config-service"
import type { PublicConfigs } from "@/types/config"

/**
 * 获取公开配置（服务端组件使用）
 *
 * 使用 Next.js unstable_cache 提供额外的缓存层：
 * 1. Next.js 缓存（ISR）
 * 2. Redis 缓存（由 config-service 提供）
 * 3. 数据库
 */
export const getPublicConfigs = unstable_cache(
  async (): Promise<PublicConfigs> => {
    return getPublicConfigsFromService()
  },
  ["public-configs"],
  {
    tags: ["public-configs"],
    revalidate: 300, // 5分钟重新验证
  }
)

/**
 * 重新验证配置缓存
 *
 * 在管理员更新配置后调用，清除 Redis 缓存和 Next.js 缓存
 * Next.js 缓存会在下次访问时自动重新验证
 */
export async function revalidateConfigs(): Promise<void> {
  // 清除 Redis 缓存
  await invalidateRedisCache()

  // 清除 Next.js unstable_cache 缓存
  revalidateTag("public-configs", "default")

  console.log("[Config] 配置缓存已重新验证")
}

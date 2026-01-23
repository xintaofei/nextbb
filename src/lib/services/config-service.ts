import { prisma } from "@/lib/prisma"
import { getRedisClient } from "@/lib/redis"
import type { PublicConfigs, ConfigKey } from "@/types/config"

const CACHE_KEY = "config:public"
const CACHE_TTL = 300

function parseConfigValue(value: string, type: string): unknown {
  if (type === "boolean") {
    return value === "true"
  } else if (type === "number") {
    return Number(value)
  } else if (type === "json") {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

async function fetchConfigsFromDatabase(): Promise<PublicConfigs> {
  const configs = await prisma.system_configs.findMany({
    where: { is_public: true },
    select: {
      config_key: true,
      config_value: true,
      config_type: true,
    },
  })

  const result: Record<string, unknown> = {}

  for (const config of configs) {
    result[config.config_key] = parseConfigValue(
      config.config_value,
      config.config_type
    )
  }

  return result as unknown as PublicConfigs
}

/**
 * 获取公开配置（带Redis缓存）
 *
 * 缓存策略：
 * 1. 先尝试从Redis获取
 * 2. 如果Redis不可用或缓存miss，从数据库获取
 * 3. 将结果缓存到Redis（如果Redis可用）
 */
export async function getPublicConfigs(): Promise<PublicConfigs> {
  try {
    const redis = getRedisClient()
    const cached = await redis.get(CACHE_KEY)

    if (cached) {
      return JSON.parse(cached) as PublicConfigs
    }

    const configs = await fetchConfigsFromDatabase()

    try {
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(configs))
    } catch (cacheError) {
      console.error("[ConfigService] 缓存配置失败:", cacheError)
    }

    return configs
  } catch (error) {
    console.error("[ConfigService] Redis不可用，从数据库获取配置:", error)
    return fetchConfigsFromDatabase()
  }
}

/**
 * 获取单个配置值（类型安全）
 */
export async function getConfigValue<K extends ConfigKey>(
  key: K
): Promise<PublicConfigs[K]> {
  const configs = await getPublicConfigs()
  return configs[key]
}

/**
 * 清除配置缓存
 *
 * 在管理员更新配置后调用，确保前台获取最新值
 */
export async function invalidateConfigCache(): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.del(CACHE_KEY)
    console.log("[ConfigService] 配置缓存已清除")
  } catch (error) {
    console.error("[ConfigService] 清除缓存失败:", error)
  }
}

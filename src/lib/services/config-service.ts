import { prisma } from "@/lib/prisma"
import { getRedisClient } from "@/lib/redis"
import type { PublicConfigs, ConfigKey } from "@/types/config"

/**
 * OAuth Provider 配置类型
 */
export type OAuthProviderConfig = {
  enabled: boolean
  clientId: string
  clientSecret: string
}

/**
 * OAuth 配置集合类型
 */
export type OAuthConfigs = {
  github: OAuthProviderConfig
  google: OAuthProviderConfig
  linuxdo: OAuthProviderConfig
}

const CACHE_KEY = "config:public"
const OAUTH_CACHE_KEY = "config:oauth"
const CACHE_TTL = 300 // 5分钟

/**
 * 解析配置值
 */
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

/**
 * 从数据库获取公开配置
 */
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

    // 缓存miss，从数据库获取
    const configs = await fetchConfigsFromDatabase()

    // 缓存结果
    try {
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(configs))
    } catch (cacheError) {
      console.error("[ConfigService] 缓存配置失败:", cacheError)
      // 缓存失败不影响功能，继续返回配置
    }

    return configs
  } catch (error) {
    // Redis不可用，直接从数据库获取
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
    await redis.del(OAUTH_CACHE_KEY)
    console.log("[ConfigService] 配置缓存已清除")
  } catch (error) {
    console.error("[ConfigService] 清除缓存失败:", error)
    // 缓存清除失败不抛出错误,缓存会自然过期
  }
}

/**
 * 从数据库获取 OAuth 配置
 */
async function fetchOAuthConfigsFromDatabase(): Promise<OAuthConfigs> {
  const configs = await prisma.system_configs.findMany({
    where: {
      config_key: {
        startsWith: "oauth.",
      },
    },
    select: {
      config_key: true,
      config_value: true,
      config_type: true,
    },
  })

  // 初始化默认配置
  const result: OAuthConfigs = {
    github: { enabled: false, clientId: "", clientSecret: "" },
    google: { enabled: false, clientId: "", clientSecret: "" },
    linuxdo: { enabled: false, clientId: "", clientSecret: "" },
  }

  // 解析配置
  for (const config of configs) {
    const key = config.config_key
    const value = parseConfigValue(config.config_value, config.config_type)

    // 解析配置键格式：oauth.{provider}.{field}
    const parts = key.split(".")
    if (parts.length === 3 && parts[0] === "oauth") {
      const provider = parts[1] as keyof OAuthConfigs
      const field = parts[2]

      if (result[provider]) {
        if (field === "enabled") {
          result[provider].enabled = value as boolean
        } else if (field === "client_id") {
          result[provider].clientId = value as string
        } else if (field === "client_secret") {
          result[provider].clientSecret = value as string
        }
      }
    }
  }

  return result
}

/**
 * 获取 OAuth 配置（带Redis缓存）
 *
 * 缓存策略：
 * 1. 先尝试从Redis获取
 * 2. 如果Redis不可用或缓存miss，从数据库获取
 * 3. 将结果缓存到Redis（如果Redis可用）
 */
export async function getOAuthConfigs(): Promise<OAuthConfigs> {
  try {
    const redis = getRedisClient()
    const cached = await redis.get(OAUTH_CACHE_KEY)

    if (cached) {
      return JSON.parse(cached) as OAuthConfigs
    }

    // 缓存miss，从数据库获取
    const configs = await fetchOAuthConfigsFromDatabase()

    // 缓存结果
    try {
      await redis.setex(OAUTH_CACHE_KEY, CACHE_TTL, JSON.stringify(configs))
    } catch (cacheError) {
      console.error("[ConfigService] 缓存OAuth配置失败:", cacheError)
      // 缓存失败不影响功能，继续返回配置
    }

    return configs
  } catch (error) {
    // Redis不可用，直接从数据库获取
    console.error("[ConfigService] Redis不可用，从数据库获取OAuth配置:", error)
    return fetchOAuthConfigsFromDatabase()
  }
}

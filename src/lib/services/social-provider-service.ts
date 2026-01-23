import { prisma } from "@/lib/prisma"
import { getRedisClient } from "@/lib/redis"

export type SocialProviderConfig = {
  id: bigint
  providerKey: string
  name: string
  clientId: string
  clientSecret: string
  authorizeUrl: string | null
  tokenUrl: string | null
  userinfoUrl: string | null
  wellKnownUrl: string | null
  scope: string | null
  icon: string | null
  sort: number
}

export type PublicSocialProvider = {
  providerKey: string
  name: string
  icon: string | null
  sort: number
}

const CACHE_KEY = "social_providers:enabled"
const CACHE_TTL = 300

async function fetchEnabledProvidersFromDatabase(): Promise<
  SocialProviderConfig[]
> {
  const providers = await prisma.social_providers.findMany({
    where: { is_enabled: true },
    orderBy: { sort: "asc" },
  })

  return providers.map((p) => ({
    id: p.id,
    providerKey: p.provider_key,
    name: p.name,
    clientId: p.client_id,
    clientSecret: p.client_secret,
    authorizeUrl: p.authorize_url,
    tokenUrl: p.token_url,
    userinfoUrl: p.userinfo_url,
    wellKnownUrl: p.well_known_url,
    scope: p.scope,
    icon: p.icon,
    sort: p.sort,
  }))
}

export async function getSocialProviders(): Promise<SocialProviderConfig[]> {
  try {
    const redis = getRedisClient()
    const cached = await redis.get(CACHE_KEY)

    if (cached) {
      const parsed = JSON.parse(cached) as Array<
        Omit<SocialProviderConfig, "id"> & { id: string }
      >
      return parsed.map((p) => ({
        ...p,
        id: BigInt(p.id),
      }))
    }

    const providers = await fetchEnabledProvidersFromDatabase()

    try {
      const serializable = providers.map((p) => ({
        ...p,
        id: p.id.toString(),
      }))
      await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(serializable))
    } catch (cacheError) {
      console.error("[SocialProviderService] 缓存失败:", cacheError)
    }

    return providers
  } catch (error) {
    console.error(
      "[SocialProviderService] Redis不可用，从数据库获取配置:",
      error
    )
    return fetchEnabledProvidersFromDatabase()
  }
}

export async function getPublicSocialProviders(): Promise<
  PublicSocialProvider[]
> {
  const providers = await getSocialProviders()
  return providers.map((p) => ({
    providerKey: p.providerKey,
    name: p.name,
    icon: p.icon,
    sort: p.sort,
  }))
}

export async function invalidateSocialProviderCache(): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.del(CACHE_KEY)
    console.log("[SocialProviderService] 缓存已清除")
  } catch (error) {
    console.error("[SocialProviderService] 清除缓存失败:", error)
  }
}

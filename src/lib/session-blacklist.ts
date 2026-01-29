import { getRedisClient } from "@/lib/redis"

const BLACKLIST_PREFIX = "jwt:blacklist:"
const DEFAULT_TTL = 24 * 60 * 60 // 24小时（应该大于等于 JWT 过期时间）

/**
 * 将 JWT token 加入黑名单
 * @param tokenId JWT token ID (jti claim)
 * @param expiresIn 过期时间（秒），默认24小时
 */
export async function blacklistToken(
  tokenId: string,
  expiresIn: number = DEFAULT_TTL
): Promise<void> {
  try {
    const redis = getRedisClient()
    const key = `${BLACKLIST_PREFIX}${tokenId}`
    await redis.setex(key, expiresIn, "1")
    console.log(`[SessionBlacklist] Token ${tokenId} 已加入黑名单`)
  } catch (error) {
    console.error("[SessionBlacklist] 加入黑名单失败:", error)
    throw error
  }
}

/**
 * 检查 token 是否在黑名单中
 * @param tokenId JWT token ID (jti claim)
 * @returns 是否在黑名单中
 */
export async function isTokenBlacklisted(tokenId: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `${BLACKLIST_PREFIX}${tokenId}`
    const result = await redis.get(key)
    return result !== null
  } catch (error) {
    console.error("[SessionBlacklist] 检查黑名单失败，允许访问:", error)
    // Redis 不可用时，允许访问（fail-open）
    return false
  }
}

/**
 * 强制用户登出（将用户所有 session 加入黑名单）
 * @param userId 用户 ID
 */
export async function forceLogoutUser(userId: string): Promise<void> {
  try {
    const redis = getRedisClient()
    // 使用用户 ID 作为黑名单标记
    const key = `${BLACKLIST_PREFIX}user:${userId}`
    await redis.setex(key, DEFAULT_TTL, "1")
    console.log(`[SessionBlacklist] 用户 ${userId} 已被强制登出`)
  } catch (error) {
    console.error("[SessionBlacklist] 强制登出失败:", error)
    throw error
  }
}

/**
 * 检查用户是否被强制登出
 * @param userId 用户 ID
 * @returns 是否被强制登出
 */
export async function isUserForcedLogout(userId: string): Promise<boolean> {
  try {
    const redis = getRedisClient()
    const key = `${BLACKLIST_PREFIX}user:${userId}`
    const result = await redis.get(key)
    return result !== null
  } catch (error) {
    console.error("[SessionBlacklist] 检查用户强制登出状态失败:", error)
    return false
  }
}

/**
 * 取消用户强制登出状态
 * @param userId 用户 ID
 */
export async function clearForceLogout(userId: string): Promise<void> {
  try {
    const redis = getRedisClient()
    const key = `${BLACKLIST_PREFIX}user:${userId}`
    await redis.del(key)
    console.log(`[SessionBlacklist] 用户 ${userId} 强制登出状态已清除`)
  } catch (error) {
    console.error("[SessionBlacklist] 清除强制登出状态失败:", error)
    throw error
  }
}

/**
 * 检查用户会话是否有效（用于敏感操作）
 * @param userId 用户 ID (bigint)
 * @throws Error 如果用户被强制登出
 */
export async function requireActiveSession(userId: bigint): Promise<void> {
  const isForced = await isUserForcedLogout(userId.toString())
  if (isForced) {
    throw new Error("Session invalidated - user has been forced to logout")
  }
}

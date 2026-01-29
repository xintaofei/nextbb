import { getRedisClient } from "@/lib/redis"

const MAX_LOGIN_ATTEMPTS = 5 // 最大尝试次数
const LOCKOUT_DURATION = 15 * 60 // 锁定时长（秒）：15分钟
const ATTEMPT_WINDOW = 5 * 60 // 尝试窗口（秒）：5分钟

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; remainingTime: number }

/**
 * 检查登录 rate limit
 * @param identifier 唯一标识符（IP 或 email）
 * @returns 是否允许登录
 */
export async function checkLoginRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  try {
    const redis = getRedisClient()
    const lockKey = `login:lock:${identifier}`
    const attemptKey = `login:attempts:${identifier}`

    // 检查是否被锁定
    const isLocked = await redis.get(lockKey)
    if (isLocked) {
      const ttl = await redis.ttl(lockKey)
      return { allowed: false, remainingTime: ttl > 0 ? ttl : 0 }
    }

    // 检查尝试次数
    const attempts = await redis.get(attemptKey)
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0

    if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
      // 锁定账号
      await redis.setex(lockKey, LOCKOUT_DURATION, "1")
      await redis.del(attemptKey)
      return { allowed: false, remainingTime: LOCKOUT_DURATION }
    }

    return { allowed: true }
  } catch (error) {
    console.error("[RateLimit] 检查失败，允许请求继续:", error)
    // Redis 不可用时，允许请求继续（fail-open）
    return { allowed: true }
  }
}

/**
 * 记录失败的登录尝试
 * @param identifier 唯一标识符（IP 或 email）
 */
export async function recordFailedLoginAttempt(
  identifier: string
): Promise<void> {
  try {
    const redis = getRedisClient()
    const attemptKey = `login:attempts:${identifier}`

    const current = await redis.get(attemptKey)
    const attempts = current ? parseInt(current, 10) : 0

    if (attempts === 0) {
      // 第一次尝试，设置过期时间
      await redis.setex(attemptKey, ATTEMPT_WINDOW, "1")
    } else {
      // 增加尝试次数
      await redis.incr(attemptKey)
    }
  } catch (error) {
    console.error("[RateLimit] 记录失败尝试失败:", error)
  }
}

/**
 * 清除登录尝试记录（成功登录后调用）
 * @param identifier 唯一标识符（IP 或 email）
 */
export async function clearLoginAttempts(identifier: string): Promise<void> {
  try {
    const redis = getRedisClient()
    const attemptKey = `login:attempts:${identifier}`
    await redis.del(attemptKey)
  } catch (error) {
    console.error("[RateLimit] 清除尝试记录失败:", error)
  }
}

import { createHash, randomBytes } from "crypto"
import { getRedisClient } from "@/lib/redis"

const RESET_TOKEN_TTL_SECONDS = 30 * 60 // 30 minutes
const RESET_COOLDOWN_SECONDS = 60

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function buildTokenKey(tokenHash: string): string {
  return `pwd_reset:token:${tokenHash}`
}

function buildCooldownKey(userId: bigint): string {
  return `pwd_reset:cooldown:${userId.toString()}`
}

function buildUserTokenKey(userId: bigint): string {
  return `pwd_reset:user_token:${userId.toString()}`
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex")
}

export async function storeResetToken(
  userId: bigint,
  token: string
): Promise<void> {
  const redis = getRedisClient()
  const tokenHash = hashToken(token)
  const tokenKey = buildTokenKey(tokenHash)
  const cooldownKey = buildCooldownKey(userId)
  const userTokenKey = buildUserTokenKey(userId)

  // 先删除该用户的旧 token
  const oldTokenHash = await redis.get(userTokenKey)
  if (oldTokenHash) {
    await redis.del(buildTokenKey(oldTokenHash))
  }

  // 使用 pipeline 原子写入新 token、冷却时间和用户映射
  const pipeline = redis.pipeline()
  pipeline.setex(tokenKey, RESET_TOKEN_TTL_SECONDS, userId.toString())
  pipeline.setex(cooldownKey, RESET_COOLDOWN_SECONDS, "1")
  pipeline.setex(userTokenKey, RESET_TOKEN_TTL_SECONDS, tokenHash)
  await pipeline.exec()
}

export async function clearResetToken(token: string): Promise<void> {
  const redis = getRedisClient()
  const tokenHash = hashToken(token)
  const tokenKey = buildTokenKey(tokenHash)
  await redis.del(tokenKey)
}

export async function verifyResetToken(token: string): Promise<bigint | null> {
  const redis = getRedisClient()
  const tokenHash = hashToken(token)
  const tokenKey = buildTokenKey(tokenHash)

  // 原子性地获取并删除 token（防止重放攻击）
  const userId = await redis.getdel(tokenKey)
  if (!userId) return null

  // 清理用户映射
  const parsedUserId = BigInt(userId)
  const userTokenKey = buildUserTokenKey(parsedUserId)
  await redis.del(userTokenKey)

  return parsedUserId
}

export async function getResetCooldown(userId: bigint): Promise<number> {
  const redis = getRedisClient()
  const cooldownKey = buildCooldownKey(userId)
  const ttl = await redis.ttl(cooldownKey)
  return ttl > 0 ? ttl : 0
}

export const PasswordResetConfig = {
  tokenTtlSeconds: RESET_TOKEN_TTL_SECONDS,
  cooldownSeconds: RESET_COOLDOWN_SECONDS,
}

// 发送邮件: 5 次 / 15 分钟
const SEND_RATE_LIMIT_MAX = 5
const SEND_RATE_LIMIT_WINDOW = 15 * 60

// 重置密码: 10 次 / 15 分钟
const RESET_RATE_LIMIT_MAX = 10
const RESET_RATE_LIMIT_WINDOW = 15 * 60

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; remainingTime: number }

/**
 * 原子性地检查并记录速率限制
 * 使用 Lua 脚本确保 check-and-increment 操作不可分割
 */
const RATE_LIMIT_LUA_SCRIPT = `
local key = KEYS[1]
local max = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

local current = tonumber(redis.call('GET', key) or '0')
if current >= max then
  local ttl = redis.call('TTL', key)
  return {0, ttl > 0 and ttl or 0}
end

local newCount = redis.call('INCR', key)
if newCount == 1 then
  redis.call('EXPIRE', key, window)
end
return {1, 0}
`

function evalRateLimit(
  key: string,
  max: number,
  window: number
): Promise<RateLimitResult> {
  const redis = getRedisClient()
  return (
    redis.eval(RATE_LIMIT_LUA_SCRIPT, 1, key, max, window) as Promise<
      [number, number]
    >
  ).then(([allowed, remainingTime]) =>
    allowed === 0 ? { allowed: false, remainingTime } : { allowed: true }
  )
}

/** 发送重置邮件的速率限制（5 次 / 15 分钟） */
export function checkSendResetRateLimit(ip: string): Promise<RateLimitResult> {
  return evalRateLimit(
    `pwd_reset:rl:send:${ip}`,
    SEND_RATE_LIMIT_MAX,
    SEND_RATE_LIMIT_WINDOW
  )
}

/** 提交重置密码的速率限制（10 次 / 15 分钟） */
export function checkResetAttemptRateLimit(
  ip: string
): Promise<RateLimitResult> {
  return evalRateLimit(
    `pwd_reset:rl:reset:${ip}`,
    RESET_RATE_LIMIT_MAX,
    RESET_RATE_LIMIT_WINDOW
  )
}

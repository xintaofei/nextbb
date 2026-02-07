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
  await redis.setex(tokenKey, RESET_TOKEN_TTL_SECONDS, userId.toString())
  await redis.setex(cooldownKey, RESET_COOLDOWN_SECONDS, "1")
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
  const userId = await redis.get(tokenKey)
  if (!userId) return null
  await redis.del(tokenKey)
  return BigInt(userId)
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

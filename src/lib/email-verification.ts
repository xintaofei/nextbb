import { createHash, randomInt } from "crypto"
import { getRedisClient } from "@/lib/redis"

const EMAIL_CODE_TTL_SECONDS = 10 * 60
const EMAIL_CODE_COOLDOWN_SECONDS = 60

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function buildCodeKey(email: string): string {
  return `email_verify:code:${normalizeEmail(email)}`
}

function buildCooldownKey(email: string): string {
  return `email_verify:cooldown:${normalizeEmail(email)}`
}

function hashEmailCode(email: string, code: string): string {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}`)
    .digest("hex")
}

export function generateEmailCode(): string {
  return String(randomInt(0, 1000000)).padStart(6, "0")
}

export async function getEmailCodeCooldown(email: string): Promise<number> {
  const redis = getRedisClient()
  const cooldownKey = buildCooldownKey(email)
  const ttl = await redis.ttl(cooldownKey)
  return ttl > 0 ? ttl : 0
}

export async function storeEmailCode(
  email: string,
  code: string
): Promise<void> {
  const redis = getRedisClient()
  const codeKey = buildCodeKey(email)
  const cooldownKey = buildCooldownKey(email)
  const hash = hashEmailCode(email, code)
  await redis.setex(codeKey, EMAIL_CODE_TTL_SECONDS, hash)
  await redis.setex(cooldownKey, EMAIL_CODE_COOLDOWN_SECONDS, "1")
}

export async function clearEmailCode(email: string): Promise<void> {
  const redis = getRedisClient()
  const codeKey = buildCodeKey(email)
  const cooldownKey = buildCooldownKey(email)
  await redis.del(codeKey, cooldownKey)
}

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<boolean> {
  const redis = getRedisClient()
  const codeKey = buildCodeKey(email)
  const storedHash = await redis.get(codeKey)
  if (!storedHash) return false
  const inputHash = hashEmailCode(email, code)
  if (inputHash !== storedHash) return false
  await redis.del(codeKey)
  return true
}

export const EmailVerificationConfig = {
  codeTtlSeconds: EMAIL_CODE_TTL_SECONDS,
  cooldownSeconds: EMAIL_CODE_COOLDOWN_SECONDS,
}

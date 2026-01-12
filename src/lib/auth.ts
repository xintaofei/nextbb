import { cookies, headers } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { prisma } from "@/lib/prisma"
import { getGeoInfo } from "@/lib/geo"
import { differenceInCalendarDays } from "date-fns"
import { generateId } from "@/lib/id"
import { emitUserLoginEvent } from "@/lib/automation/events"

const ALG = "HS256"
const ISS = "nextbb"
const AUD = "nextbb-web"

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET is not set")
  }
  return new TextEncoder().encode(secret)
}

export type AuthTokenPayload = {
  sub: string
  email: string
  isAdmin: boolean
}

export async function signAuthToken(
  payload: AuthTokenPayload
): Promise<string> {
  const secret = getSecret()
  const now = Math.floor(Date.now() / 1000)

  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISS)
    .setAudience(AUD)
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 24 * 7)
    .sign(secret)
}

export async function verifyAuthToken(
  token: string
): Promise<AuthTokenPayload | null> {
  const secret = getSecret()
  try {
    const { payload } = await jwtVerify<AuthTokenPayload>(token, secret, {
      issuer: ISS,
      audience: AUD,
    })
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      isAdmin: Boolean(payload.isAdmin),
    }
  } catch {
    return null
  }
}

export const AUTH_COOKIE_NAME = "nextbb_auth"

export async function setAuthCookie(token: string): Promise<void> {
  const jar = await cookies()
  jar.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearAuthCookie(): Promise<void> {
  const jar = await cookies()
  jar.delete(AUTH_COOKIE_NAME)
}

export async function getAuthTokenFromCookies(): Promise<string | null> {
  const jar = await cookies()
  const value = jar.get(AUTH_COOKIE_NAME)?.value
  return value ?? null
}

export type SessionUser = {
  userId: bigint
  email: string
  isAdmin: boolean
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getAuthTokenFromCookies()
  if (!token) return null
  const payload = await verifyAuthToken(token)
  if (!payload) return null
  return {
    userId: BigInt(payload.sub),
    email: payload.email,
    isAdmin: payload.isAdmin,
  }
}

/**
 * 记录用户登录信息
 */
export async function recordLogin(
  userId: bigint | null,
  status: "SUCCESS" | "FAILED" = "SUCCESS",
  loginMethod: string = "UNKNOWN"
) {
  try {
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for") || "unknown"
    const userAgent = headersList.get("user-agent")
    const geo = await getGeoInfo(ip)
    const now = new Date()

    if (status === "SUCCESS" && userId) {
      // Get current stats
      const stats = await prisma.user_login_stats.findUnique({
        where: { user_id: userId },
      })

      let consecutiveDays = stats?.consecutive_login_days || 0
      let totalLoginDays = stats?.total_login_days || 0

      if (stats?.last_login_at) {
        const diff = differenceInCalendarDays(now, stats.last_login_at)
        if (diff === 1) {
          consecutiveDays += 1
          totalLoginDays += 1
        } else if (diff > 1) {
          consecutiveDays = 1 // reset
          totalLoginDays += 1
        }
        // if diff == 0, same day, do not increase total or consecutive
      } else {
        // first time
        consecutiveDays = 1
        totalLoginDays = 1
      }

      // Upsert stats
      await prisma.user_login_stats.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          last_login_at: now,
          last_login_ip: ip,
          consecutive_login_days: consecutiveDays,
          total_login_days: totalLoginDays,
          location_lat: geo.latitude,
          location_long: geo.longitude,
        },
        update: {
          last_login_at: now,
          last_login_ip: ip,
          consecutive_login_days: consecutiveDays,
          total_login_days: totalLoginDays,
          location_lat: geo.latitude,
          location_long: geo.longitude,
        },
      })

      // Emit event
      await emitUserLoginEvent({
        userId: userId,
        loginTime: now,
        consecutiveDays: consecutiveDays,
      })
    }

    // Create log
    // For FAILED status, userId might be null if email not found
    await prisma.user_login_logs.create({
      data: {
        id: generateId(),
        user_id: userId || BigInt(0), // Use 0 for unknown user
        ip: ip,
        user_agent: userAgent,
        location_lat: geo.latitude,
        location_long: geo.longitude,
        status: status,
        login_method: loginMethod,
        login_at: now,
      },
    })
  } catch (error) {
    console.error("Error recording login:", error)
  }
}

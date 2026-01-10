import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

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

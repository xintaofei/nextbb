/**
 * 2FA (TOTP) 工具函数
 * 基于 RFC 6238 标准
 */

/**
 * 生成随机密钥（Base32 编码）
 */
export function generateTOTPSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const length = 32
  let secret = ""
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)

  for (let i = 0; i < length; i++) {
    secret += chars[randomValues[i] % chars.length]
  }

  return secret
}

/**
 * Base32 解码
 */
function base32Decode(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const cleanedBase32 = base32.toUpperCase().replace(/=+$/, "")
  const bits: number[] = []

  for (const char of cleanedBase32) {
    const val = alphabet.indexOf(char)
    if (val === -1) throw new Error("Invalid base32 character")
    bits.push(...val.toString(2).padStart(5, "0").split("").map(Number))
  }

  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8).join(""), 2))
  }

  return new Uint8Array(bytes)
}

/**
 * 生成 HOTP 值
 */
async function generateHOTP(secret: string, counter: number): Promise<string> {
  const key = base32Decode(secret)
  const counterBuffer = new ArrayBuffer(8)
  const dataView = new DataView(counterBuffer)
  dataView.setBigUint64(0, BigInt(counter), false)

  const keyBuffer = await crypto.subtle.importKey(
    "raw",
    key as BufferSource,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign("HMAC", keyBuffer, counterBuffer)

  const hmac = new Uint8Array(signature)
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const otp = (binary % 1000000).toString().padStart(6, "0")
  return otp
}

/**
 * 生成 TOTP 验证码
 * @param secret Base32 编码的密钥
 * @param timeStep 时间步长（秒），默认 30 秒
 */
export async function generateTOTP(
  secret: string,
  timeStep: number = 30
): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / timeStep)
  return await generateHOTP(secret, counter)
}

/**
 * 验证 TOTP 验证码
 * @param secret Base32 编码的密钥
 * @param token 用户输入的 6 位验证码
 * @param window 允许的时间窗口（前后各允许几个时间步），默认 1
 */
export async function verifyTOTP(
  secret: string,
  token: string,
  window: number = 1
): Promise<boolean> {
  const timeStep = 30
  const currentCounter = Math.floor(Date.now() / 1000 / timeStep)

  for (let i = -window; i <= window; i++) {
    const counter = currentCounter + i
    const expectedToken = await generateHOTP(secret, counter)
    if (expectedToken === token) {
      return true
    }
  }

  return false
}

/**
 * 生成 TOTP URI（用于生成二维码）
 * @param secret Base32 编码的密钥
 * @param accountName 账户名（通常是用户邮箱）
 * @param issuer 发行者（应用名称）
 */
export function generateTOTPUri(
  secret: string,
  accountName: string,
  issuer: string = "NextBB"
): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedAccount = encodeURIComponent(accountName)
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
}

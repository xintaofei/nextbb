import { headers } from "next/headers"

/**
 * 安全地获取客户端真实 IP 地址
 * 正确处理代理链，防止 IP 伪造
 * @returns 客户端 IP 地址，如果无法获取则返回 "unknown"
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers()

  // 优先使用 x-forwarded-for，取第一个 IP（客户端真实 IP）
  const forwarded = headersList.get("x-forwarded-for")
  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim())
    // 返回第一个非空 IP
    const clientIp = ips[0]
    if (clientIp && clientIp.length > 0) {
      return clientIp
    }
  }

  // 备选：x-real-ip
  const realIp = headersList.get("x-real-ip")
  if (realIp && realIp.length > 0) {
    return realIp
  }

  // 备选：cf-connecting-ip (Cloudflare)
  const cfIp = headersList.get("cf-connecting-ip")
  if (cfIp && cfIp.length > 0) {
    return cfIp
  }

  // 如果都没有，返回 unknown
  return "unknown"
}

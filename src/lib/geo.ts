import { headers } from "next/headers"

interface GeoInfo {
  latitude: string | null
  longitude: string | null
}

/**
 * 获取地理位置信息
 * 优先从请求头获取 (Vercel, Cloudflare, Generic)
 * 如果没有请求头，尝试通过 IP 获取 (TODO: 集成 IP 库)
 */
export async function getGeoInfo(ip: string): Promise<GeoInfo> {
  try {
    const headersList = await headers()

    // 1. Vercel
    const vercelLat = headersList.get("x-vercel-ip-latitude")
    const vercelLong = headersList.get("x-vercel-ip-longitude")
    if (vercelLat && vercelLong) {
      return { latitude: vercelLat, longitude: vercelLong }
    }

    // 2. Cloudflare
    const cfLat = headersList.get("cf-ip-latitude")
    const cfLong = headersList.get("cf-ip-longitude")
    if (cfLat && cfLong) {
      return { latitude: cfLat, longitude: cfLong }
    }

    // 3. Generic
    const geoLat = headersList.get("x-geo-latitude")
    const geoLong = headersList.get("x-geo-longitude")
    if (geoLat && geoLong) {
      return { latitude: geoLat, longitude: geoLong }
    }

    // 4. IP fallback (Placeholder for now)
    // 这里可以集成 IP 库 API，例如 ip-api.com
    // 注意：如果在服务端且没有 header，可能需要发起请求
    // 暂时返回 null，避免引入外部依赖或不可靠的公共 API 调用

    return { latitude: null, longitude: null }
  } catch (error) {
    console.error("Error getting geo info:", error)
    return { latitude: null, longitude: null }
  }
}

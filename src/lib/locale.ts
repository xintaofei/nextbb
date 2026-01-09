import { routing } from "@/i18n/routing"

/**
 * 从请求中获取语言标识
 * 优先级：Cookie > Accept-Language 头 > 默认语言
 */
export function getLocaleFromRequest(request: Request): string {
  // 1. 尝试从 Cookie 中获取
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader)
    const cookieLocale = cookies["NEXT_LOCALE"]
    if (
      cookieLocale &&
      routing.locales.includes(cookieLocale as (typeof routing.locales)[number])
    ) {
      return cookieLocale
    }
  }

  // 2. 尝试从 Accept-Language 头获取
  const acceptLanguage = request.headers.get("accept-language")
  if (acceptLanguage) {
    // 解析 Accept-Language 头，取第一个语言代码
    const languages = acceptLanguage.split(",")
    for (const lang of languages) {
      // 提取语言代码（如 "zh-CN" -> "zh"）
      const langCode = lang.split(";")[0].trim().split("-")[0].toLowerCase()
      if (
        routing.locales.includes(langCode as (typeof routing.locales)[number])
      ) {
        return langCode
      }
    }
  }

  // 3. 返回默认语言
  return routing.defaultLocale
}

/**
 * 解析 Cookie 字符串
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  const items = cookieHeader.split(";")
  for (const item of items) {
    const [key, value] = item.split("=").map((s) => s.trim())
    if (key && value) {
      cookies[key] = decodeURIComponent(value)
    }
  }
  return cookies
}

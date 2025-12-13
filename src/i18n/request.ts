import { getRequestConfig } from "next-intl/server"
import { Locale, routing } from "@/i18n/routing"

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale
  const safeLocale: Locale = routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : routing.defaultLocale
  return {
    locale: safeLocale,
    messages: (await import(`./messages/${safeLocale}.json`)).default,
  }
})

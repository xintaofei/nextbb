import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  // 支持的语言列表
  locales: ["en", "zh"],

  // 默认语言
  defaultLocale: "zh",

  // 路径前缀策略
  localePrefix: "as-needed",
})

export type Locale = (typeof routing.locales)[number]

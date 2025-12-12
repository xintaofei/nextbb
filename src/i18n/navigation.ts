import { createNavigation } from "next-intl/navigation"
import { routing } from "@/i18n/routing"

// 使用 createNavigation 生成类型安全的导航组件
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)

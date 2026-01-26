"use client"

import { SearchIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useConfig } from "@/components/providers/config-provider"
import { useTranslations } from "next-intl"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

export function Aside() {
  const pathname = usePathname()
  const isTopicPage = pathname.includes("/topic/")
  const t = useTranslations("Index")
  const tc = useTranslations("Common")

  const { configs } = useConfig()
  const welcomeMessage = configs?.["basic.welcome_message"] as
    | string
    | undefined

  return (
    <aside className="hidden lg:flex w-64 flex-col gap-4 ml-7 max-xl:mr-8 py-8 pl-1 sticky top-0 h-screen overflow-y-auto scrollbar-none">
      {isTopicPage ? (
        <div id="topic-aside-portal" className="w-full p-4 border rounded-xl" />
      ) : (
        <>
          {/* Search */}
          <InputGroup className="w-full h-10 rounded-full">
            <InputGroupInput
              className="h-full"
              placeholder={tc("Search.placeholder")}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>

          {/* Welcome */}
          <div className="p-4 border rounded-xl text-lg break-all">
            {welcomeMessage || t("title")}
          </div>

          {/* Skeleton */}
          <div className="w-full h-36 flex items-center justify-center border bg-muted/50 rounded-xl">
            Skeleton1
          </div>
          <div className="w-full h-36 flex items-center justify-center border bg-muted/50 rounded-xl">
            Skeleton2
          </div>

          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
            <span className="hover:underline cursor-pointer">
              Terms of Service
            </span>
            <span className="hover:underline cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:underline cursor-pointer">
              Cookie Policy
            </span>
            <span>© 2026 NextBB</span>
          </div>
        </>
      )}
    </aside>
  )
}

"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { usePathname } from "next/navigation"

export function Aside() {
  const pathname = usePathname()
  const isTopicPage = pathname.includes("/topic/")

  return (
    <aside className="hidden lg:flex w-72 flex-col gap-4 ml-8 py-8 sticky top-0 h-screen overflow-y-auto scrollbar-none">
      {isTopicPage ? (
        <div id="topic-aside-portal" className="w-full h-full" />
      ) : (
        <>
          {/* Search */}
          <div className="sticky top-0 bg-background pb-2 z-10 pt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-9 rounded-full bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background"
              />
            </div>
          </div>

          {/* What's happening */}
          <div className="rounded-xl bg-muted p-4 flex flex-col gap-4">
            <h2 className="font-bold text-xl">What&apos;s happening</h2>
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 cursor-pointer hover:bg-background/50 -mx-4 px-4 py-2 transition-colors"
                >
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Trending in Technology</span>
                    <span>...</span>
                  </div>
                  <div className="font-bold text-sm">#Nextjs16</div>
                  <div className="text-xs text-muted-foreground">
                    12.5K posts
                  </div>
                </div>
              ))}
            </div>
            <div className="text-primary text-sm cursor-pointer hover:underline">
              Show more
            </div>
          </div>

          <div className="text-xs text-muted-foreground px-4 flex flex-wrap gap-x-2 gap-y-1">
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

"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import useSWRInfinite from "swr/infinite"
import { ChevronRight, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardLogsResponse } from "@/types/admin"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface InfiniteDetailedCardProps {
  title: string
  apiUrl: string
}

export function InfiniteDetailedCard({
  title,
  apiUrl,
}: InfiniteDetailedCardProps) {
  const getKey = (
    pageIndex: number,
    previousPageData: DashboardLogsResponse
  ) => {
    if (previousPageData && !previousPageData.items.length) return null
    const limit = 10
    return `${apiUrl}?limit=${limit}&offset=${pageIndex * limit}`
  }

  const { data, size, setSize, isLoading, isValidating } =
    useSWRInfinite<DashboardLogsResponse>(getKey, fetcher)

  const items = useMemo(() => {
    return data ? data.flatMap((page) => page.items) : []
  }, [data])

  const isEmpty = data?.[0]?.items.length === 0
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.items.length < 10)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (
      scrollHeight - scrollTop <= clientHeight + 50 &&
      !isValidating &&
      !isReachingEnd
    ) {
      setSize(size + 1)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
    >
      <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground">
          {title}
        </h3>

        <ScrollArea className="h-[360px] pr-4" onScrollCapture={handleScroll}>
          <div className="space-y-3 pb-4">
            {items.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                className="group/item w-full text-left"
              >
                <div className="flex items-center justify-between rounded-lg border border-border/20 bg-background/40 p-3 transition-all hover:border-border/40 hover:bg-background/60">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={item.avatar || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10">
                        {item.label[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.label}
                      </p>
                      <p className="text-xs text-foreground/60 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full">
                      {item.value}
                    </p>
                    <ChevronRight className="h-4 w-4 text-foreground/40 transition-transform group-hover/item:translate-x-1" />
                  </div>
                </div>
              </motion.button>
            ))}

            {(isLoading || isValidating) && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {isReachingEnd && !isEmpty && (
              <p className="text-center text-[10px] text-muted-foreground p-4 uppercase tracking-widest opacity-50">
                End of records
              </p>
            )}

            {isEmpty && !isLoading && (
              <p className="text-center text-xs text-muted-foreground p-8">
                No records found
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  )
}

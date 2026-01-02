import * as React from "react"
import {
  TimelineStepsItem,
  TimelineStepsConnector,
  TimelineStepsIcon,
  TimelineStepsContent,
  TimelineStepsAction,
} from "@/components/ui/timeline-steps"
import { Skeleton } from "@/components/ui/skeleton"

export function PostSkeletonList({
  count,
  lastIsSentinel,
  sentinelId,
  sentinelRef,
}: {
  count: number
  lastIsSentinel?: boolean
  sentinelId?: string
  sentinelRef?: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => i).map((i) => (
        <TimelineStepsItem
          key={`post-skeleton-${i}`}
          id={lastIsSentinel && i === count - 1 ? sentinelId : undefined}
        >
          <TimelineStepsConnector className="max-sm:hidden" />
          <TimelineStepsIcon
            size="lg"
            className="overflow-hidden p-0 max-sm:hidden"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
          </TimelineStepsIcon>
          <TimelineStepsContent className="border-b">
            <div className="flex flex-row justify-between items-center w-full">
              <div className="flex flex-row gap-2 items-center">
                <Skeleton className="size-5 rounded-full hidden max-sm:block" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-8/12" />
            </div>
            <TimelineStepsAction>
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </TimelineStepsAction>
            {lastIsSentinel && i === count - 1 ? (
              <div ref={sentinelRef} className="h-1 w-full" />
            ) : null}
          </TimelineStepsContent>
        </TimelineStepsItem>
      ))}
    </>
  )
}

"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  )
}

export function ChartCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-[300px] w-full" />
    </div>
  )
}

export function DetailedCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-4 mt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

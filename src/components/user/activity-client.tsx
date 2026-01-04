"use client"

import { useState } from "react"
import useSWR from "swr"
import { ActivityFilter } from "./activity-filter"
import { ActivityList } from "./activity-list"
import type { ActivityType, ActivitiesResponse } from "@/types/activity"

type ActivityClientProps = {
  userId: string
  isOwnProfile: boolean
  isAdmin: boolean
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ActivityClient({
  userId,
  isOwnProfile,
  isAdmin,
}: ActivityClientProps) {
  const [activeFilter, setActiveFilter] = useState<ActivityType>("all")
  const [page, setPage] = useState(1)

  const hasPermission = isOwnProfile || isAdmin

  const { data, isLoading } = useSWR<ActivitiesResponse>(
    `/api/users/${userId}/activities?type=${activeFilter}&page=${page}&pageSize=20`,
    fetcher,
    {
      keepPreviousData: true,
    }
  )

  const handleFilterChange = (filter: ActivityType) => {
    setActiveFilter(filter)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      <ActivityFilter
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        hasPermission={hasPermission}
      />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <ActivityList
          items={data?.items || []}
          isLoading={isLoading}
          activityType={activeFilter}
          page={page}
          hasMore={data?.hasMore || false}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}

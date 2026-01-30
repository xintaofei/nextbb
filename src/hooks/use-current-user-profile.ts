"use client"

import useSWR from "swr"
import type { CurrentUserProfile } from "@/types/user"

const fetcher = async (url: string): Promise<CurrentUserProfile> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("Failed to fetch user info")
  }
  return res.json()
}

/**
 * 获取当前用户的完整资料（包括实时积分）
 * 使用 SWR 进行缓存和自动刷新
 */
export function useCurrentUserProfile() {
  const { data, error, isLoading, mutate } = useSWR<CurrentUserProfile>(
    "/api/users/me",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // 2秒内的重复请求会被去重
    }
  )

  return {
    userProfile: data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  }
}

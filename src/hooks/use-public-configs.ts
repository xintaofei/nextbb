"use client"

import useSWR from "swr"
import type { PublicConfigs, ConfigKey } from "@/types/config"

interface ConfigsResponse {
  configs: PublicConfigs
}

const fetcher = async (url: string): Promise<ConfigsResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("获取配置失败")
  }
  return res.json()
}

/**
 * 客户端获取公开配置的 Hook
 *
 * 使用 SWR 进行数据获取和缓存
 *
 * @param fallbackData - 可选的初始数据（从服务端注入）
 * @returns 配置数据、加载状态和错误信息
 */
export function usePublicConfigs(fallbackData?: PublicConfigs) {
  const { data, error, isLoading, mutate } = useSWR<ConfigsResponse>(
    "/api/configs/public",
    fetcher,
    {
      fallbackData: fallbackData ? { configs: fallbackData } : undefined,
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  )

  return {
    configs: data?.configs,
    isLoading,
    error,
    mutate,
  }
}

/**
 * 获取单个配置值的 Hook（类型安全）
 *
 * @param key - 配置键
 * @param fallbackData - 可选的初始数据
 * @returns 配置值、加载状态和错误信息
 */
export function useConfigValue<K extends ConfigKey>(
  key: K,
  fallbackData?: PublicConfigs
) {
  const { configs, isLoading, error } = usePublicConfigs(fallbackData)

  return {
    value: configs?.[key],
    isLoading,
    error,
  }
}

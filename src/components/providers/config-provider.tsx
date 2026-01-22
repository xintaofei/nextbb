"use client"

import { createContext, useContext, type ReactNode } from "react"
import { usePublicConfigs } from "@/hooks/use-public-configs"
import type { PublicConfigs } from "@/types/config"

interface ConfigContextValue {
  configs: PublicConfigs | undefined
  isLoading: boolean
  error: Error | undefined
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined)

interface ConfigProviderProps {
  children: ReactNode
  initialConfigs: PublicConfigs
}

/**
 * 配置提供者组件
 *
 * 从服务端注入初始配置数据，并通过 SWR 在客户端保持更新
 *
 * @param initialConfigs - 从服务端获取的初始配置数据
 */
export function ConfigProvider({
  children,
  initialConfigs,
}: ConfigProviderProps) {
  const { configs, isLoading, error } = usePublicConfigs(initialConfigs)

  return (
    <ConfigContext.Provider
      value={{
        configs: configs || initialConfigs,
        isLoading,
        error,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

/**
 * 使用配置的 Hook
 *
 * 必须在 ConfigProvider 内部使用
 */
export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext)

  if (context === undefined) {
    throw new Error("useConfig must be used within ConfigProvider")
  }

  return context
}

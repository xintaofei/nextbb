"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { PublicConfigs } from "@/types/config"

interface ConfigContextValue {
  configs: PublicConfigs
  refresh: () => Promise<void>
  isRefreshing: boolean
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined)

interface ConfigProviderProps {
  children: ReactNode
  initialConfigs: PublicConfigs
}

/**
 * 配置提供者组件
 *
 * 从服务端注入初始配置数据，通过 Context 提供给所有子组件
 * 避免客户端重复请求，所有组件通过 useConfig() 获取配置
 *
 * @param children - 子组件
 * @param initialConfigs - 从服务端获取的初始配置数据
 */
export function ConfigProvider({
  children,
  initialConfigs,
}: ConfigProviderProps) {
  const [configs, setConfigs] = useState<PublicConfigs>(initialConfigs)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 提供手动刷新配置的方法（如果需要）
  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch("/api/configs/public")
      if (res.ok) {
        const data = await res.json()
        setConfigs(data.configs)
      }
    } catch (error) {
      console.error("Failed to refresh configs:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      configs,
      refresh,
      isRefreshing,
    }),
    [configs, refresh, isRefreshing]
  )

  return (
    <ConfigContext.Provider value={contextValue}>
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

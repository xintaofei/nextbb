/**
 * 服务生命周期管理工具
 * 用于统一处理服务的初始化状态和单例锁
 */

interface ServiceState {
  isInitialized: boolean
  initializationPromise: Promise<void> | null
}

const globalForService = globalThis as unknown as {
  serviceStates: Map<string, ServiceState>
}

// 确保 Map 存在
if (!globalForService.serviceStates) {
  globalForService.serviceStates = new Map()
}

/**
 * 创建服务初始化器
 *
 * 封装了初始化锁逻辑，防止并发初始化和开发环境 HMR 重复初始化
 *
 * @param serviceName 服务名称 (用于日志和状态键名)
 * @param initFn 初始化逻辑函数
 * @returns 包装后的初始化函数
 */
export function createServiceInitializer(
  serviceName: string,
  initFn: () => Promise<void>
): () => Promise<void> {
  // 获取或初始化状态
  if (!globalForService.serviceStates.has(serviceName)) {
    globalForService.serviceStates.set(serviceName, {
      isInitialized: false,
      initializationPromise: null,
    })
  }

  const state = globalForService.serviceStates.get(serviceName)!

  return async () => {
    // 如果已初始化，直接返回
    if (state.isInitialized) {
      return
    }

    // 如果正在初始化，返回当前的 Promise
    if (state.initializationPromise) {
      return state.initializationPromise
    }

    // 开始初始化
    state.initializationPromise = (async () => {
      try {
        await initFn()
        state.isInitialized = true
        console.log(`[${serviceName}] System initialized successfully`)
      } catch (error) {
        console.error(`[${serviceName}] System initialization failed:`, error)
        // 初始化失败，重置 Promise 以便重试
        state.initializationPromise = null
        throw error
      }
    })()

    return state.initializationPromise
  }
}

/**
 * 重置服务状态 (用于测试或重新初始化)
 */
export function resetServiceState(serviceName: string): void {
  if (globalForService.serviceStates.has(serviceName)) {
    globalForService.serviceStates.set(serviceName, {
      isInitialized: false,
      initializationPromise: null,
    })
  }
}

/**
 * 自动化规则系统 - 入口文件
 *
 * 统一导出所有模块,并提供初始化函数
 */

export * from "./types"
export * from "./events"
export * from "./action-handlers"
export * from "./rule-engine"
export * from "./cron-manager"

import { RedisEventBus } from "./redis-event-bus"
import { RuleEngine } from "./rule-engine"
import { CronManager } from "./cron-manager"
import type { RuleTriggerType } from "./types"

/**
 * 全局状态类型，用于在 Next.js 开发模式下保持单例状态
 */
interface AutomationSystemState {
  isInitialized: boolean
  initializationPromise: Promise<void> | null
}

/**
 * 使用 globalThis 确保在开发模式下状态持久化
 * 避免 HMR 导致的重复初始化问题
 */
const globalForAutomation = globalThis as unknown as {
  automationSystemState: AutomationSystemState
}

// 初始化或获取全局状态
if (!globalForAutomation.automationSystemState) {
  globalForAutomation.automationSystemState = {
    isInitialized: false,
    initializationPromise: null,
  }
}

const state = globalForAutomation.automationSystemState

/**
 * 初始化自动化规则系统
 *
 * 在应用启动时由 instrumentation.ts 自动调用
 * 使用单例模式确保只初始化一次
 */
export async function initializeAutomationSystem(): Promise<void> {
  if (state.isInitialized) {
    return
  }

  if (state.initializationPromise) {
    return state.initializationPromise
  }

  state.initializationPromise = (async () => {
    try {
      // 1. 注册事件监听器（必须在初始化前注册）
      registerEventListeners()

      // 2. 初始化 Redis 事件总线（启动消息处理循环）
      await RedisEventBus.initialize()

      // 3. 初始化定时任务管理器
      await CronManager.initialize()

      state.isInitialized = true
      console.log("[Automation] System initialized successfully")
    } catch (error) {
      console.error("[Automation] System initialization failed:", error)
      state.initializationPromise = null
      throw error
    }
  })()

  return state.initializationPromise
}

/**
 * 注册事件监听器
 */
function registerEventListeners(): void {
  // 发帖事件
  RedisEventBus.on("post:create", async (data) => {
    await RuleEngine.executeRule("POST_CREATE" as RuleTriggerType, data)
  })

  // 回帖事件
  RedisEventBus.on("post:reply", async (data) => {
    await RuleEngine.executeRule("POST_REPLY" as RuleTriggerType, data)
  })

  // 签到事件
  RedisEventBus.on("user:checkin", async (data) => {
    await RuleEngine.executeRule("CHECKIN" as RuleTriggerType, data)
  })

  // 捐赠确认事件
  RedisEventBus.on("donation:confirmed", async (data) => {
    await RuleEngine.executeRule("DONATION" as RuleTriggerType, data)
  })

  // 送出点赞事件
  RedisEventBus.on("post:like:given", async (data) => {
    await RuleEngine.executeRule("POST_LIKE_GIVEN" as RuleTriggerType, data)
  })

  // 收到点赞事件
  RedisEventBus.on("post:like:received", async (data) => {
    await RuleEngine.executeRule("POST_LIKE_RECEIVED" as RuleTriggerType, data)
  })

  // 注册事件
  RedisEventBus.on("user:register", async (data) => {
    await RuleEngine.executeRule("USER_REGISTER" as RuleTriggerType, data)
  })

  // 登录事件
  RedisEventBus.on("user:login", async (data) => {
    await RuleEngine.executeRule("USER_LOGIN" as RuleTriggerType, data)
  })
}

/**
 * 关闭自动化规则系统
 */
export function shutdownAutomationSystem(): void {
  CronManager.stopAll()
}

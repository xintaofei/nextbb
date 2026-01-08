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
 * 全局初始化标志
 * 使用全局单例模式，确保在整个应用生命周期中只初始化一次
 */
let isInitialized = false
let initializationPromise: Promise<void> | null = null

/**
 * 初始化自动化规则系统
 *
 * 在应用启动时由 instrumentation.ts 自动调用
 * 使用单例模式确保只初始化一次
 */
export async function initializeAutomationSystem(): Promise<void> {
  if (isInitialized) {
    return
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    try {
      // 1. 注册事件监听器（必须在初始化前注册）
      registerEventListeners()

      // 2. 初始化 Redis 事件总线（启动消息处理循环）
      await RedisEventBus.initialize()

      // 3. 初始化定时任务管理器
      await CronManager.initialize()

      isInitialized = true
    } catch (error) {
      console.error("[Automation] 初始化失败:", error)
      initializationPromise = null
      throw error
    }
  })()

  return initializationPromise
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

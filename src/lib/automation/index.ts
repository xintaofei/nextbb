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

import { automationEvents } from "./events"
import { RuleEngine } from "./rule-engine"
import { CronManager } from "./cron-manager"
import type { RuleTriggerType } from "./types"

/**
 * 初始化自动化规则系统
 *
 * 在应用启动时调用此函数:
 * ```ts
 * import { initializeAutomationSystem } from "@/lib/automation"
 *
 * // 在 server.ts 或 app initialization 中
 * await initializeAutomationSystem()
 * ```
 */
export async function initializeAutomationSystem(): Promise<void> {
  console.log("[Automation] 初始化自动化规则系统...")

  try {
    // 1. 初始化定时任务管理器
    await CronManager.initialize()

    // 2. 注册事件监听器
    registerEventListeners()

    console.log("[Automation] 自动化规则系统初始化完成")
  } catch (error) {
    console.error("[Automation] 初始化失败:", error)
    throw error
  }
}

/**
 * 注册事件监听器
 *
 * 将业务事件与规则引擎关联
 */
function registerEventListeners(): void {
  // 发帖事件
  automationEvents.on("post:create", async (data) => {
    await RuleEngine.executeRule("POST_CREATE" as RuleTriggerType, data)
  })

  // 回帖事件
  automationEvents.on("post:reply", async (data) => {
    await RuleEngine.executeRule("POST_REPLY" as RuleTriggerType, data)
  })

  // 签到事件
  automationEvents.on("user:checkin", async (data) => {
    await RuleEngine.executeRule("CHECKIN" as RuleTriggerType, data)
  })

  // 捐赠确认事件
  automationEvents.on("donation:confirmed", async (data) => {
    await RuleEngine.executeRule("DONATION" as RuleTriggerType, data)
  })

  // 点赞事件
  automationEvents.on("post:like", async (data) => {
    await RuleEngine.executeRule("POST_LIKE" as RuleTriggerType, data)
  })

  // 注册事件
  automationEvents.on("user:register", async (data) => {
    await RuleEngine.executeRule("USER_REGISTER" as RuleTriggerType, data)
  })

  // 登录事件
  automationEvents.on("user:login", async (data) => {
    await RuleEngine.executeRule("USER_LOGIN" as RuleTriggerType, data)
  })

  console.log("[Automation] 已注册 7 个事件监听器")
}

/**
 * 关闭自动化规则系统
 */
export function shutdownAutomationSystem(): void {
  console.log("[Automation] 关闭自动化规则系统...")

  // 停止所有定时任务
  CronManager.stopAll()

  // 移除所有事件监听器
  automationEvents.removeAllListeners()

  console.log("[Automation] 自动化规则系统已关闭")
}

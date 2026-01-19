/**
 * 自动化规则系统 - 入口文件
 *
 * 统一导出所有模块,并提供初始化函数
 */

export * from "./types"
export * from "./action-handlers"
export * from "./rule-engine"
export * from "./cron-manager"

import { createServiceInitializer } from "@/lib/utils/service-lifecycle"
import { AutomationEvents } from "./event-bus"
import { RuleEngine } from "./rule-engine"
import { CronManager } from "./cron-manager"
import type { RuleTriggerType } from "./types"

/**
 * 初始化自动化规则系统
 *
 * 在应用启动时由 instrumentation.ts 自动调用
 * 使用通用生命周期管理器处理单例和初始化锁
 */
export const initializeAutomationSystem = createServiceInitializer(
  "Automation",
  async () => {
    // 1. 注册事件监听器（必须在初始化前注册）
    registerEventListeners()

    // 2. 初始化事件总线（根据配置启动 Redis 或本地消息处理）
    await AutomationEvents.initialize()

    // 3. 初始化定时任务管理器
    await CronManager.initialize()
  }
)

/**
 * 注册事件监听器
 */
function registerEventListeners(): void {
  // 发帖事件
  AutomationEvents.on("post:create", async (data) => {
    await RuleEngine.executeRule("POST_CREATE" as RuleTriggerType, data)
  })

  // 回帖事件
  AutomationEvents.on("post:reply", async (data) => {
    await RuleEngine.executeRule("POST_REPLY" as RuleTriggerType, data)
  })

  // 签到事件
  AutomationEvents.on("user:checkin", async (data) => {
    await RuleEngine.executeRule("CHECKIN" as RuleTriggerType, data)
  })

  // 捐赠确认事件
  AutomationEvents.on("donation:confirmed", async (data) => {
    await RuleEngine.executeRule("DONATION" as RuleTriggerType, data)
  })

  // 送出点赞事件
  AutomationEvents.on("post:like:given", async (data) => {
    await RuleEngine.executeRule("POST_LIKE_GIVEN" as RuleTriggerType, data)
  })

  // 收到点赞事件
  AutomationEvents.on("post:like:received", async (data) => {
    await RuleEngine.executeRule("POST_LIKE_RECEIVED" as RuleTriggerType, data)
  })

  // 注册事件
  AutomationEvents.on("user:register", async (data) => {
    await RuleEngine.executeRule("USER_REGISTER" as RuleTriggerType, data)
  })

  // 登录事件
  AutomationEvents.on("user:login", async (data) => {
    await RuleEngine.executeRule("USER_LOGIN" as RuleTriggerType, data)
  })
}

/**
 * 关闭自动化规则系统
 */
export function shutdownAutomationSystem(): void {
  CronManager.stopAll()
  AutomationEvents.stop()
}

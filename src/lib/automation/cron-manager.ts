/**
 * 自动化规则系统 - 定时任务管理器
 *
 * 动态管理 Cron 任务,支持规则的添加、更新和删除
 * 使用 node-cron 库实现
 */

import * as nodeCron from "node-cron"
import { prisma } from "@/lib/prisma"
import type { RuleTriggerType } from "./types"

// ==================== Cron 任务管理器 ====================

interface CronTask {
  ruleId: bigint
  schedule: string
  job: nodeCron.ScheduledTask
}

/**
 * 全局状态类型，用于在 Next.js 开发模式下保持单例状态
 */
interface CronManagerState {
  tasks: Map<string, CronTask>
  isInitialized: boolean
}

/**
 * 使用 globalThis 确保在开发模式下状态持久化
 * 避免 HMR 导致的重复初始化问题
 */
const globalForCronManager = globalThis as unknown as {
  cronManagerState: CronManagerState
}

// 初始化或获取全局状态
if (!globalForCronManager.cronManagerState) {
  globalForCronManager.cronManagerState = {
    tasks: new Map(),
    isInitialized: false,
  }
}

const state = globalForCronManager.cronManagerState

/**
 * Cron 任务管理器
 *
 * 职责:
 * 1. 启动时加载所有 CRON 类型的规则
 * 2. 动态添加/删除/更新定时任务
 * 3. 执行定时规则
 */
export class CronManager {
  /**
   * 初始化定时任务管理器
   */
  static async initialize(): Promise<void> {
    if (state.isInitialized) {
      return
    }

    try {
      // 加载所有启用的 CRON 规则
      const rules = await prisma.automation_rules.findMany({
        where: {
          trigger_type: "CRON" as RuleTriggerType,
          is_enabled: true,
          is_deleted: false,
        },
      })

      // 为每个规则创建定时任务
      for (const rule of rules) {
        await this.addTask(rule)
      }

      state.isInitialized = true
      if (rules.length > 0) {
        console.log(`[CronManager] 已初始化 ${rules.length} 个定时规则`)
      } else {
        console.log("[CronManager] 没有设置定时规则")
      }
    } catch (error) {
      console.error("[CronManager] 初始化失败:", error)
      throw error
    }
  }

  /**
   * 添加定时任务
   */
  static async addTask(rule: {
    id: bigint
    trigger_conditions: unknown
    actions: unknown
  }): Promise<void> {
    try {
      const conditions = rule.trigger_conditions as Record<
        string,
        unknown
      > | null
      const cronExpression = conditions?.cron as string | undefined

      if (!cronExpression) {
        console.warn(`[CronManager] 规则 ${rule.id} 缺少 cron 配置`)
        return
      }

      // 验证 cron 表达式格式(简单验证)
      if (!this.isValidCron(cronExpression)) {
        console.error(
          `[CronManager] 规则 ${rule.id} 的 cron 表达式无效: ${cronExpression}`
        )
        return
      }

      const taskKey = rule.id.toString()

      // 如果任务已存在,先删除
      if (state.tasks.has(taskKey)) {
        this.removeTask(rule.id)
      }

      // 使用 node-cron 创建定时任务
      const job = nodeCron.schedule(
        cronExpression,
        async () => {
          await this.executeCronRule(rule.id)
        },
        {
          timezone: "Asia/Shanghai",
        }
      )

      state.tasks.set(taskKey, {
        ruleId: rule.id,
        schedule: cronExpression,
        job,
      })

      console.log(
        `[CronManager] 已添加任务: 规则=${rule.id}, cron=${cronExpression}`
      )
    } catch (error) {
      console.error(`[CronManager] 添加任务失败: 规则=${rule.id}`, error)
    }
  }

  /**
   * 移除定时任务
   */
  static removeTask(ruleId: bigint): void {
    const taskKey = ruleId.toString()
    const task = state.tasks.get(taskKey)

    if (task) {
      task.job.stop()
      state.tasks.delete(taskKey)
      console.log(`[CronManager] 已移除任务: 规则=${ruleId}`)
    }
  }

  /**
   * 更新定时任务
   */
  static async updateTask(rule: {
    id: bigint
    trigger_conditions: unknown
    actions: unknown
  }): Promise<void> {
    this.removeTask(rule.id)
    await this.addTask(rule)
  }

  /**
   * 执行定时规则
   */
  private static async executeCronRule(ruleId: bigint): Promise<void> {
    try {
      console.log(`[CronManager] 执行定时规则: ${ruleId}`)

      // 重新查询规则,确保使用最新数据
      const rule = await prisma.automation_rules.findUnique({
        where: { id: ruleId },
      })

      if (!rule || !rule.is_enabled || rule.is_deleted) {
        console.log(`[CronManager] 规则 ${ruleId} 已禁用或删除,移除任务`)
        this.removeTask(ruleId)
        return
      }

      // 检查时间范围
      const now = new Date()
      if (rule.start_time && now < rule.start_time) {
        console.log(`[CronManager] 规则 ${ruleId} 尚未生效`)
        return
      }
      if (rule.end_time && now > rule.end_time) {
        console.log(`[CronManager] 规则 ${ruleId} 已过期,移除任务`)
        this.removeTask(ruleId)
        return
      }

      // 执行规则(定时任务通常没有特定的用户触发)
      // 这里需要从 action_params 中获取目标用户或批量处理
      // 简化实现: 假设定时任务针对所有用户或特定用户组
      console.log(`[CronManager] 定时任务暂不支持自动执行,需要实现具体业务逻辑`)

      // TODO: 实现定时任务的具体执行逻辑
      // 例如: 每日重置签到、发送通知等
    } catch (error) {
      console.error(`[CronManager] 执行定时规则失败: ${ruleId}`, error)
    }
  }

  /**
   * 验证 cron 表达式
   */
  private static isValidCron(cronExpression: string): boolean {
    return nodeCron.validate(cronExpression)
  }

  /**
   * 停止所有任务
   */
  static stopAll(): void {
    for (const [, task] of state.tasks.entries()) {
      task.job.stop()
      console.log(`[CronManager] 已停止任务: 规则=${task.ruleId}`)
    }
    state.tasks.clear()
    state.isInitialized = false
    console.log("[CronManager] 已停止所有任务")
  }

  /**
   * 获取所有运行中的任务
   */
  static getTasks(): Array<{ ruleId: string; schedule: string }> {
    return Array.from(state.tasks.values()).map((task) => ({
      ruleId: task.ruleId.toString(),
      schedule: task.schedule,
    }))
  }
}

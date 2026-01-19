/**
 * 自动化规则系统 - 规则引擎核心
 *
 * 负责规则匹配、执行和日志记录
 */

import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import {
  ActionHandlerFactory,
  type ActionContext,
  type ActionResult,
} from "./action-handlers"
import {
  RuleTriggerType,
  RuleActionType,
  RuleExecutionStatus,
  type AutomationEventMap,
} from "./types"

// ==================== 规则条件匹配器 ====================

/**
 * 检查规则条件是否匹配
 */
export class RuleConditionMatcher {
  /**
   * 匹配发帖条件
   */
  static matchPostCreate(
    conditions: Record<string, unknown> | null,
    eventData: AutomationEventMap["post:create"]
  ): boolean {
    if (!conditions) return true

    // 检查分类ID
    if (conditions.category_ids) {
      const categoryIds = conditions.category_ids as bigint[]
      if (!categoryIds.includes(eventData.categoryId)) {
        return false
      }
    }

    // 检查最小内容长度
    if (conditions.min_content_length) {
      const minLength = conditions.min_content_length as number
      if (eventData.content.length < minLength) {
        return false
      }
    }

    return true
  }

  /**
   * 匹配回帖条件
   */
  static matchPostReply(
    conditions: Record<string, unknown> | null,
    eventData: AutomationEventMap["post:reply"]
  ): boolean {
    if (!conditions) return true

    // 检查主题类型
    if (conditions.topic_type && eventData.topicType) {
      if (conditions.topic_type !== eventData.topicType) {
        return false
      }
    }

    // 检查是否首次回复
    if (conditions.is_first_reply !== undefined) {
      if (conditions.is_first_reply !== eventData.isFirstReply) {
        return false
      }
    }

    return true
  }

  /**
   * 匹配签到条件
   */
  static matchCheckin(
    conditions: Record<string, unknown> | null,
    eventData: AutomationEventMap["user:checkin"]
  ): boolean {
    if (!conditions) return true

    // 检查连续签到天数
    if (conditions.consecutive_days) {
      const days = conditions.consecutive_days as number
      if (eventData.consecutiveDays !== days) {
        return false
      }
    }

    return true
  }

  /**
   * 匹配捐赠条件
   */
  static matchDonation(
    conditions: Record<string, unknown> | null,
    eventData: AutomationEventMap["donation:confirmed"]
  ): boolean {
    if (!conditions) return true

    // 检查最小金额
    if (conditions.min_amount) {
      const minAmount = conditions.min_amount as number
      if (eventData.amount < minAmount) {
        return false
      }
    }

    // 检查货币类型
    if (conditions.currency) {
      if (conditions.currency !== eventData.currency) {
        return false
      }
    }

    // 检查捐赠来源
    if (conditions.sources) {
      const sources = conditions.sources as string[]
      if (!sources.includes(eventData.source)) {
        return false
      }
    }

    return true
  }

  /**
   * 匹配送出点赞条件
   */
  static matchPostLikeGiven(
    conditions: Record<string, unknown> | null,
    eventData: AutomationEventMap["post:like:given"]
  ): boolean {
    if (!conditions) return true

    // 检查最小点赞数量
    if (conditions.min_count) {
      const minCount = conditions.min_count as number
      if (eventData.totalLikesGiven < minCount) {
        return false
      }
    }

    return true
  }

  /**
   * 匹配收到点赞条件
   */
  static matchPostLikeReceived(
    conditions: Record<string, unknown> | null,
    eventData: AutomationEventMap["post:like:received"]
  ): boolean {
    if (!conditions) return true

    // 检查最小点赞数量
    if (conditions.min_count) {
      const minCount = conditions.min_count as number
      if (eventData.totalLikesReceived < minCount) {
        return false
      }
    }

    return true
  }

  /**
   * 匹配注册条件
   */
  static matchUserRegister(
    conditions: Record<string, unknown> | null,
    eventData: AutomationEventMap["user:register"]
  ): boolean {
    if (!conditions) return true

    // 检查 OAuth 提供商
    if (conditions.oauth_provider && eventData.oauthProvider) {
      if (conditions.oauth_provider !== eventData.oauthProvider) {
        return false
      }
    }

    return true
  }

  /**
   * 匹配登录条件
   */
  static matchUserLogin(
    conditions: Record<string, unknown> | null,
    eventData: AutomationEventMap["user:login"]
  ): boolean {
    if (!conditions) return true

    // 检查连续登录天数
    if (conditions.consecutive_days) {
      const days = conditions.consecutive_days as number
      if (eventData.consecutiveDays !== days) {
        return false
      }
    }

    return true
  }
}

// ==================== 规则引擎 ====================

/**
 * 规则引擎核心类
 */
export class RuleEngine {
  /**
   * 执行规则
   */
  static async executeRule<K extends keyof AutomationEventMap>(
    triggerType: RuleTriggerType,
    eventData: AutomationEventMap[K]
  ): Promise<void> {
    try {
      // 查询所有启用的规则
      const rules = await prisma.automation_rules.findMany({
        where: {
          trigger_type: triggerType,
          is_enabled: true,
          is_deleted: false,
          OR: [{ start_time: null }, { start_time: { lte: new Date() } }],
          AND: [
            {
              OR: [{ end_time: null }, { end_time: { gte: new Date() } }],
            },
          ],
        },
        orderBy: { priority: "desc" },
      })

      if (rules.length === 0) {
        return
      }

      // 筛选出符合执行条件的规则
      const matchedRules = rules.filter((rule) => {
        const conditions = rule.trigger_conditions as Record<
          string,
          unknown
        > | null
        return this.matchConditions(
          rule.trigger_type as RuleTriggerType,
          conditions,
          eventData
        )
      })

      if (matchedRules.length === 0) {
        return
      }

      // 只执行优先级最高的规则(已按 priority desc 排序,取第一个即可)
      const highestPriorityRule = matchedRules[0]
      await this.processRule(highestPriorityRule, eventData)
    } catch (error) {
      console.error(`[RuleEngine] 执行规则失败:`, error)
    }
  }

  /**
   * 处理单个规则
   */
  private static async processRule<K extends keyof AutomationEventMap>(
    rule: {
      id: bigint
      trigger_type: string
      trigger_conditions: unknown
      actions: unknown
      is_repeatable: boolean
      max_executions: number | null
      cooldown_seconds: number | null
    },
    eventData: AutomationEventMap[K]
  ): Promise<void> {
    try {
      // 解析条件
      const conditions = rule.trigger_conditions as Record<
        string,
        unknown
      > | null

      // 提取目标用户ID
      const userId = this.extractUserId(
        rule.trigger_type as RuleTriggerType,
        conditions,
        eventData
      )
      if (!userId) {
        console.warn(`[RuleEngine] 无法提取用户ID, 规则 ${rule.id}`)
        return
      }

      // 预先计算执行对象(默认为触发用户)
      // 对于积分变动、徽章授予/撤销等操作,执行对象就是 userId
      const targetUserId = userId

      // 优化：合并检查逻辑，减少数据库查询次数
      // 不可重复规则：只需要检查是否存在任意一条记录
      if (!rule.is_repeatable) {
        const existingLog = await prisma.automation_rule_logs.findFirst({
          where: {
            rule_id: rule.id,
            target_user_id: targetUserId,
          },
          select: { id: true },
        })

        if (existingLog) {
          return // 已有记录，不允许重复执行
        }
        // 不可重复规则只执行一次，无需检查次数和冷却时间
      } else {
        // 可重复规则：需要检查最大次数和/或冷却时间
        const needCheckMaxExec = rule.max_executions !== null
        const needCheckCooldown = rule.cooldown_seconds !== null

        if (needCheckMaxExec && needCheckCooldown) {
          // 同时需要检查次数和冷却：查询总数 + 最近一条
          const [count, lastLog] = await Promise.all([
            prisma.automation_rule_logs.count({
              where: {
                rule_id: rule.id,
                target_user_id: targetUserId,
              },
            }),
            prisma.automation_rule_logs.findFirst({
              where: {
                rule_id: rule.id,
                target_user_id: targetUserId,
              },
              select: { executed_at: true },
              orderBy: { executed_at: "desc" },
            }),
          ])

          // 检查最大执行次数
          if (count >= rule.max_executions!) {
            return
          }

          // 检查冷却时间
          if (lastLog) {
            const cooldownMs = rule.cooldown_seconds! * 1000
            const elapsed = Date.now() - lastLog.executed_at.getTime()
            if (elapsed < cooldownMs) {
              return
            }
          }
        } else if (needCheckMaxExec) {
          // 只需要检查最大次数
          const count = await prisma.automation_rule_logs.count({
            where: {
              rule_id: rule.id,
              target_user_id: targetUserId,
            },
          })

          if (count >= rule.max_executions!) {
            return
          }
        } else if (needCheckCooldown) {
          // 只需要检查冷却时间
          const lastLog = await prisma.automation_rule_logs.findFirst({
            where: {
              rule_id: rule.id,
              target_user_id: targetUserId,
            },
            select: { executed_at: true },
            orderBy: { executed_at: "desc" },
          })

          if (lastLog) {
            const cooldownMs = rule.cooldown_seconds! * 1000
            const elapsed = Date.now() - lastLog.executed_at.getTime()
            if (elapsed < cooldownMs) {
              return
            }
          }
        }
      }

      // 执行所有 Actions
      const actions = rule.actions as Array<{
        type: RuleActionType
        params: Record<string, unknown>
      }>

      if (!Array.isArray(actions) || actions.length === 0) {
        console.warn(`[RuleEngine] 规则 ${rule.id} 没有配置动作`)
        return
      }

      // 使用 Promise.allSettled 异步并行执行所有动作
      const results = await Promise.allSettled(
        actions.map((action) =>
          this.executeAction(
            {
              id: rule.id,
              action_type: action.type,
              action_params: action.params,
              is_repeatable: rule.is_repeatable,
            },
            userId,
            targetUserId,
            eventData
          )
        )
      )

      // 聚合执行结果
      const actionResults: Array<{
        actionType: RuleActionType
        status: string
        data?: Record<string, unknown>
        message?: string
        messageParams?: Record<string, string | number>
      }> = []

      let finalStatus = RuleExecutionStatus.SUCCESS // 默认为成功
      let hasFailedAction = false
      let hasSkippedAction = false

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          // Promise 被拒绝,记录为 FAILED
          const actionType =
            actions[index]?.type || RuleActionType.CREDIT_CHANGE // 默认值
          actionResults.push({
            actionType,
            status: RuleExecutionStatus.FAILED,
            message: "Automation.error.unexpectedError",
            messageParams: {
              error: String(result.reason),
            },
          })
          hasFailedAction = true
          console.error(
            `[RuleEngine] 规则 ${rule.id} 动作 ${index + 1} (${actionType}) 执行失败:`,
            result.reason
          )
        } else {
          // Promise 成功,使用 ActionResult 的状态
          const actionResult = result.value
          actionResults.push({
            actionType: actionResult.actionType,
            status: actionResult.status,
            data: actionResult.data,
            message: actionResult.message,
            messageParams: actionResult.messageParams,
          })

          // 更新最终状态：按优先级 FAILED > SKIPPED > SUCCESS
          if (actionResult.status === RuleExecutionStatus.FAILED) {
            hasFailedAction = true
          } else if (actionResult.status === RuleExecutionStatus.SKIPPED) {
            hasSkippedAction = true
          }
        }
      })

      // 根据优先级设置最终状态
      if (hasFailedAction) {
        finalStatus = RuleExecutionStatus.FAILED
      } else if (hasSkippedAction) {
        finalStatus = RuleExecutionStatus.SKIPPED
      }

      // 记录一条聚合日志
      await prisma.automation_rule_logs.create({
        data: {
          id: generateId(),
          rule_id: rule.id,
          triggered_by: userId,
          target_user_id: targetUserId,
          trigger_context: eventData as never,
          execution_status: finalStatus,
          execution_result: actionResults as never,
          error_message: null,
          executed_at: new Date(),
        },
      })
    } catch (error) {
      console.error(`[RuleEngine] 处理规则 ${rule.id} 失败:`, error)
    }
  }

  /**
   * 匹配条件
   */
  private static matchConditions<K extends keyof AutomationEventMap>(
    triggerType: RuleTriggerType,
    conditions: Record<string, unknown> | null,
    eventData: AutomationEventMap[K]
  ): boolean {
    switch (triggerType) {
      case "POST_CREATE":
        return RuleConditionMatcher.matchPostCreate(
          conditions,
          eventData as AutomationEventMap["post:create"]
        )
      case "POST_REPLY":
        return RuleConditionMatcher.matchPostReply(
          conditions,
          eventData as AutomationEventMap["post:reply"]
        )
      case "CHECKIN":
        return RuleConditionMatcher.matchCheckin(
          conditions,
          eventData as AutomationEventMap["user:checkin"]
        )
      case "DONATION":
        return RuleConditionMatcher.matchDonation(
          conditions,
          eventData as AutomationEventMap["donation:confirmed"]
        )
      case "POST_LIKE_GIVEN":
        return RuleConditionMatcher.matchPostLikeGiven(
          conditions,
          eventData as AutomationEventMap["post:like:given"]
        )
      case "POST_LIKE_RECEIVED":
        return RuleConditionMatcher.matchPostLikeReceived(
          conditions,
          eventData as AutomationEventMap["post:like:received"]
        )
      case "USER_REGISTER":
        return RuleConditionMatcher.matchUserRegister(
          conditions,
          eventData as AutomationEventMap["user:register"]
        )
      case "USER_LOGIN":
        return RuleConditionMatcher.matchUserLogin(
          conditions,
          eventData as AutomationEventMap["user:login"]
        )
      default:
        return false
    }
  }

  /**
   * 提取用户ID
   */
  private static extractUserId<K extends keyof AutomationEventMap>(
    triggerType: RuleTriggerType,
    _conditions: Record<string, unknown> | null,
    eventData: AutomationEventMap[K]
  ): bigint | null {
    const data = eventData as Record<string, unknown>

    // 对于送出点赞事件,目标用户是点赞者
    if (triggerType === "POST_LIKE_GIVEN" && "userId" in data) {
      return data.userId as bigint
    }

    // 对于收到点赞事件,目标用户是帖子作者
    if (triggerType === "POST_LIKE_RECEIVED" && "postAuthorId" in data) {
      return data.postAuthorId as bigint
    }

    if ("userId" in data && typeof data.userId === "bigint") {
      return data.userId
    }

    return null
  }

  /**
   * 执行 Action
   */
  private static async executeAction<K extends keyof AutomationEventMap>(
    rule: {
      id: bigint
      action_type: string
      action_params: unknown
      is_repeatable: boolean
    },
    userId: bigint,
    targetUserId: bigint,
    eventData: AutomationEventMap[K]
  ): Promise<ActionResult> {
    // 获取 Action Handler
    const handler = ActionHandlerFactory.getHandler(rule.action_type as never)

    // 构建执行上下文
    const context: ActionContext = {
      userId,
      ruleId: rule.id,
      triggerContext: eventData as Record<string, unknown>,
    }

    // 执行 Action 并返回结果
    return await handler.execute(rule.action_params, context)
  }
}

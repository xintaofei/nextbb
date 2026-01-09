/**
 * 自动化规则系统 - Action Handlers (策略模式)
 *
 * 使用策略模式设计,每个 Action 类型对应一个独立的 Handler
 * 便于扩展新的动作类型,而无需修改核心代码
 */

import { RuleActionType, RuleExecutionStatus } from "@/lib/automation/types"
import { prisma } from "@/lib/prisma"
import { CreditService } from "@/lib/credit-service"
import { CreditLogType } from "@prisma/client"

// ==================== Action 参数类型定义 ====================

/**
 * 积分变动参数
 */
export interface CreditChangeParams {
  amount: number // 积分数量(正数为增加,负数为减少)
  description: string // 积分变动描述
}

/**
 * 授予徽章参数
 */
export interface BadgeGrantParams {
  badge_id: bigint // 徽章ID
  auto_grant?: boolean // 是否自动授予(跳过审核)
}

/**
 * 撤销徽章参数
 */
export interface BadgeRevokeParams {
  badge_id: bigint // 徽章ID
  reason?: string // 撤销原因
}

/**
 * 用户组变更参数(预留)
 */
export interface UserGroupChangeParams {
  group_id: number
  expire_days?: number // 过期天数(null表示永久)
}

// ==================== Action Handler 接口 ====================

/**
 * Action 执行上下文
 */
export interface ActionContext {
  userId: bigint // 目标用户ID
  ruleId: bigint // 规则ID
  triggerId?: bigint // 触发者ID(可能与目标用户不同,如点赞事件)
  triggerContext?: Record<string, unknown> // 触发上下文数据
}

/**
 * Action 执行结果
 */
export interface ActionResult {
  actionType: RuleActionType // 动作类型(枚举)
  status: RuleExecutionStatus // 执行状态: SUCCESS, FAILED, SKIPPED
  targetUserId?: bigint // 执行对象的用户ID(如授予徽章的目标用户)
  message?: string // 失败/跳过原因的多语言键值(如 "Automation.skipReason.badgeAlreadyOwned")
  messageParams?: Record<string, string | number> // 失败/跳过原因的变量参数
  data?: Record<string, unknown>
}

/**
 * Action Handler 基类接口
 */
export interface IActionHandler<T = unknown> {
  /**
   * 执行 Action
   */
  execute(params: T, context: ActionContext): Promise<ActionResult>
}

// ==================== 具体 Action Handler 实现 ====================

/**
 * 积分变动 Handler
 */
export class CreditChangeHandler implements IActionHandler<CreditChangeParams> {
  async execute(
    params: CreditChangeParams,
    context: ActionContext
  ): Promise<ActionResult> {
    try {
      const { amount, description } = params
      const { userId } = context

      // 使用统一的积分服务（并发安全）
      const result = await CreditService.changeCredits({
        userId,
        amount,
        type: CreditLogType.OTHER, // 自动化规则触发使用 OTHER 类型
        description: description || "自动化规则触发",
      })

      if (!result.success) {
        // 如果是积分不足，返回 SKIPPED
        if (result.error?.includes("积分不足")) {
          return {
            actionType: RuleActionType.CREDIT_CHANGE,
            status: RuleExecutionStatus.SKIPPED,
            targetUserId: userId,
            message: "Automation.skipReason.insufficientCredits",
            messageParams: {
              amount: amount,
            },
          }
        }

        // 其他错误返回 FAILED
        return {
          actionType: RuleActionType.CREDIT_CHANGE,
          status: RuleExecutionStatus.FAILED,
          message: "Automation.error.creditChangeFailed",
          messageParams: {
            error: result.error || "未知错误",
          },
        }
      }

      return {
        actionType: RuleActionType.CREDIT_CHANGE,
        status: RuleExecutionStatus.SUCCESS,
        targetUserId: userId,
        data: {
          credit_changed: amount,
          new_balance: result.newBalance,
        },
      }
    } catch (error) {
      return {
        actionType: RuleActionType.CREDIT_CHANGE,
        status: RuleExecutionStatus.FAILED,
        message: "Automation.error.databaseError",
        messageParams: {
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }
}

/**
 * 授予徽章 Handler
 */
export class BadgeGrantHandler implements IActionHandler<BadgeGrantParams> {
  async execute(
    params: BadgeGrantParams,
    context: ActionContext
  ): Promise<ActionResult> {
    try {
      // 从 JSON 字段解析参数，需要处理类型转换
      const rawParams = params as unknown as Record<string, unknown>
      const badgeIdRaw = rawParams.badge_id

      // 将 badge_id 转换为 bigint
      let badge_id: bigint
      if (typeof badgeIdRaw === "string") {
        badge_id = BigInt(badgeIdRaw)
      } else if (typeof badgeIdRaw === "number") {
        badge_id = BigInt(badgeIdRaw)
      } else if (typeof badgeIdRaw === "bigint") {
        badge_id = badgeIdRaw
      } else {
        return {
          actionType: RuleActionType.BADGE_GRANT,
          status: RuleExecutionStatus.FAILED,
          message: "Automation.error.invalidParams",
          messageParams: {
            message: `无效的徽章ID类型: ${typeof badgeIdRaw}`,
          },
        }
      }

      const { userId } = context

      // 检查徽章是否存在
      const badge = await prisma.badges.findUnique({
        where: { id: badge_id },
        select: {
          id: true,
          name: true,
          is_enabled: true,
          is_deleted: true,
        },
      })

      if (!badge || badge.is_deleted || !badge.is_enabled) {
        const error = `徽章不存在或已禁用: ${badge_id}`
        console.error(`[BadgeGrantHandler] ${error}`)
        return {
          actionType: RuleActionType.BADGE_GRANT,
          status: RuleExecutionStatus.FAILED,
          message: "Automation.error.badgeNotFound",
          messageParams: {
            badgeId: badge_id.toString(),
          },
        }
      }

      // 检查用户是否已拥有该徽章
      const existing = await prisma.user_badges.findUnique({
        where: {
          user_id_badge_id: {
            user_id: userId,
            badge_id: badge_id,
          },
        },
      })

      if (existing && !existing.is_deleted) {
        return {
          actionType: RuleActionType.BADGE_GRANT,
          status: RuleExecutionStatus.SKIPPED,
          targetUserId: userId,
          message: "Automation.skipReason.badgeAlreadyOwned",
          messageParams: {
            badgeName: badge.name,
          },
        }
      }

      // 授予徽章
      if (existing && existing.is_deleted) {
        // 恢复已删除的徽章
        await prisma.user_badges.update({
          where: {
            user_id_badge_id: {
              user_id: userId,
              badge_id: badge_id,
            },
          },
          data: {
            is_deleted: false,
            awarded_at: new Date(),
            awarded_by: null, // 自动授予
          },
        })
      } else {
        // 创建新徽章记录
        await prisma.user_badges.create({
          data: {
            user_id: userId,
            badge_id: badge_id,
            awarded_by: null, // 自动授予
            is_deleted: false,
          },
        })
      }

      return {
        actionType: RuleActionType.BADGE_GRANT,
        status: RuleExecutionStatus.SUCCESS,
        targetUserId: userId,
        data: {
          badge_granted: {
            badge_id: badge_id.toString(),
            badge_name: badge.name,
          },
        },
      }
    } catch (error) {
      return {
        actionType: RuleActionType.BADGE_GRANT,
        status: RuleExecutionStatus.FAILED,
        message: "Automation.error.databaseError",
        messageParams: {
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }
}

/**
 * 撤销徽章 Handler
 */
export class BadgeRevokeHandler implements IActionHandler<BadgeRevokeParams> {
  async execute(
    params: BadgeRevokeParams,
    context: ActionContext
  ): Promise<ActionResult> {
    try {
      // 从 JSON 字段解析参数，需要处理类型转换
      const rawParams = params as unknown as Record<string, unknown>
      const badgeIdRaw = rawParams.badge_id
      const reason = rawParams.reason as string | undefined

      // 将 badge_id 转换为 bigint
      let badge_id: bigint
      if (typeof badgeIdRaw === "string") {
        badge_id = BigInt(badgeIdRaw)
      } else if (typeof badgeIdRaw === "number") {
        badge_id = BigInt(badgeIdRaw)
      } else if (typeof badgeIdRaw === "bigint") {
        badge_id = badgeIdRaw
      } else {
        return {
          actionType: RuleActionType.BADGE_REVOKE,
          status: RuleExecutionStatus.FAILED,
          message: "Automation.error.invalidParams",
          messageParams: {
            message: `无效的徽章ID类型: ${typeof badgeIdRaw}`,
          },
        }
      }

      const { userId } = context

      // 检查用户是否拥有该徽章
      const userBadge = await prisma.user_badges.findUnique({
        where: {
          user_id_badge_id: {
            user_id: userId,
            badge_id: badge_id,
          },
        },
        include: {
          badge: {
            select: { name: true },
          },
        },
      })

      if (!userBadge || userBadge.is_deleted) {
        return {
          actionType: RuleActionType.BADGE_REVOKE,
          status: RuleExecutionStatus.SKIPPED,
          targetUserId: userId,
          message: "Automation.skipReason.badgeNotOwned",
          messageParams: {
            badgeName: userBadge?.badge.name || "Unknown",
          },
        }
      }

      // 软删除徽章
      await prisma.user_badges.update({
        where: {
          user_id_badge_id: {
            user_id: userId,
            badge_id: badge_id,
          },
        },
        data: {
          is_deleted: true,
        },
      })

      return {
        actionType: RuleActionType.BADGE_REVOKE,
        status: RuleExecutionStatus.SUCCESS,
        targetUserId: userId,
        data: {
          badge_revoked: {
            badge_id: badge_id.toString(),
            badge_name: userBadge.badge.name,
            reason: reason || "自动化规则触发",
          },
        },
      }
    } catch (error) {
      return {
        actionType: RuleActionType.BADGE_REVOKE,
        status: RuleExecutionStatus.FAILED,
        message: "Automation.error.databaseError",
        messageParams: {
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }
}

/**
 * 用户组变更 Handler (预留实现)
 */
export class UserGroupChangeHandler implements IActionHandler<UserGroupChangeParams> {
  async execute(
    _params: UserGroupChangeParams,
    _context: ActionContext
  ): Promise<ActionResult> {
    // TODO: 实现用户组变更逻辑
    return {
      actionType: RuleActionType.USER_GROUP_CHANGE,
      status: RuleExecutionStatus.FAILED,
      message: "用户组变更功能暂未实现",
    }
  }
}

// ==================== Action Handler 工厂 ====================

/**
 * Action Handler 工厂类
 *
 * 使用工厂模式,根据 ActionType 返回对应的 Handler
 * 便于扩展新的 Action 类型
 */
export class ActionHandlerFactory {
  private static handlers = new Map<RuleActionType, IActionHandler<unknown>>([
    [RuleActionType.CREDIT_CHANGE, new CreditChangeHandler()],
    [RuleActionType.BADGE_GRANT, new BadgeGrantHandler()],
    [RuleActionType.BADGE_REVOKE, new BadgeRevokeHandler()],
    [RuleActionType.USER_GROUP_CHANGE, new UserGroupChangeHandler()],
  ])

  /**
   * 获取 Action Handler
   */
  static getHandler(actionType: RuleActionType): IActionHandler<unknown> {
    const handler = this.handlers.get(actionType)
    if (!handler) {
      throw new Error(`不支持的 Action 类型: ${actionType}`)
    }
    return handler
  }

  /**
   * 注册新的 Action Handler
   *
   * 用于扩展新的 Action 类型,例如:
   * ```ts
   * ActionHandlerFactory.registerHandler(
   *   RuleActionType.SEND_EMAIL,
   *   new SendEmailHandler()
   * )
   * ```
   */
  static registerHandler(
    actionType: RuleActionType,
    handler: IActionHandler<unknown>
  ): void {
    this.handlers.set(actionType, handler)
  }
}

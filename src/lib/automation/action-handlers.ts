/**
 * 自动化规则系统 - Action Handlers (策略模式)
 *
 * 使用策略模式设计,每个 Action 类型对应一个独立的 Handler
 * 便于扩展新的动作类型,而无需修改核心代码
 */

import { RuleActionType } from "@/lib/automation/types"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"

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
  success: boolean
  data?: Record<string, unknown>
  error?: string
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

      // 查询用户当前积分
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { credits: true },
      })

      if (!user) {
        return {
          success: false,
          error: `用户不存在: ${userId}`,
        }
      }

      const newBalance = user.credits + amount

      // 防止积分变为负数
      if (newBalance < 0) {
        return {
          success: false,
          error: `积分不足,当前积分: ${user.credits},需要变动: ${amount}`,
        }
      }

      // 使用事务更新用户积分并记录日志
      const result = await prisma.$transaction(async (tx) => {
        // 更新用户积分
        await tx.users.update({
          where: { id: userId },
          data: { credits: newBalance },
        })

        // 记录积分日志
        await tx.user_credit_logs.create({
          data: {
            id: generateId(),
            user_id: userId,
            amount,
            balance: newBalance,
            type: "OTHER",
            description: description || "自动化规则触发",
          },
        })

        return { newBalance }
      })

      return {
        success: true,
        data: {
          credit_changed: amount,
          new_balance: result.newBalance,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `积分变动失败: ${error instanceof Error ? error.message : String(error)}`,
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
      const { badge_id, auto_grant = true } = params
      const { userId, ruleId } = context

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
        return {
          success: false,
          error: `徽章不存在或已禁用: ${badge_id}`,
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
          success: false,
          error: `用户已拥有该徽章: ${badge.name}`,
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
        success: true,
        data: {
          badge_granted: {
            badge_id: badge_id.toString(),
            badge_name: badge.name,
          },
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `徽章授予失败: ${error instanceof Error ? error.message : String(error)}`,
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
      const { badge_id, reason } = params
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
          success: false,
          error: `用户未拥有该徽章: ${badge_id}`,
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
        success: true,
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
        success: false,
        error: `徽章撤销失败: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }
}

/**
 * 用户组变更 Handler (预留实现)
 */
export class UserGroupChangeHandler implements IActionHandler<UserGroupChangeParams> {
  async execute(
    params: UserGroupChangeParams,
    context: ActionContext
  ): Promise<ActionResult> {
    // TODO: 实现用户组变更逻辑
    return {
      success: false,
      error: "用户组变更功能暂未实现",
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

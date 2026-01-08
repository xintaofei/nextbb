/**
 * 统一的用户积分变动服务
 *
 * 提供并发安全的积分变动处理，确保：
 * 1. 使用事务保证积分更新和日志记录的原子性
 * 2. 使用 increment/decrement 避免并发问题
 * 3. 统一使用 Prisma 枚举值记录日志类型
 * 4. 防止积分变为负数
 */

import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { CreditLogType } from "@prisma/client"

/**
 * 积分变动参数
 */
export interface CreditChangeParams {
  userId: bigint // 用户ID
  amount: number // 积分变动数量（正数为增加，负数为减少）
  type: CreditLogType // 积分变动类型（使用Prisma枚举）
  description: string // 积分变动描述
}

/**
 * 积分变动结果
 */
export interface CreditChangeResult {
  success: boolean // 是否成功
  newBalance: number // 新的积分余额
  error?: string // 错误信息（如果失败）
}

/**
 * 积分变动服务
 *
 * 使用事务确保积分更新和日志记录的原子性
 * 使用 increment/decrement 避免并发冲突
 */
export class CreditService {
  /**
   * 执行积分变动
   *
   * @param params 积分变动参数
   * @returns 积分变动结果
   */
  static async changeCredits(
    params: CreditChangeParams
  ): Promise<CreditChangeResult> {
    const { userId, amount, type, description } = params

    // 参数校验
    if (amount === 0) {
      return {
        success: false,
        newBalance: 0,
        error: "积分变动数量不能为0",
      }
    }

    try {
      // 使用事务确保原子性
      const result = await prisma.$transaction(
        async (tx) => {
          // 1. 查询用户当前积分（用于验证和计算新余额）
          const user = await tx.users.findUnique({
            where: { id: userId },
            select: { credits: true },
          })

          if (!user) {
            throw new Error("用户不存在")
          }

          // 2. 计算新余额并验证
          const currentCredits = user.credits
          const newBalance = currentCredits + amount

          // 防止积分变为负数
          if (newBalance < 0) {
            throw new Error(
              `积分不足：当前积分 ${currentCredits}，需要 ${Math.abs(amount)}`
            )
          }

          // 3. 使用 increment/decrement 更新积分（并发安全）
          const updatedUser = await tx.users.update({
            where: { id: userId },
            data: {
              credits: {
                increment: amount,
              },
            },
            select: {
              credits: true,
            },
          })

          // 4. 创建积分变动日志
          await tx.user_credit_logs.create({
            data: {
              id: generateId(),
              user_id: userId,
              amount: amount,
              balance: updatedUser.credits,
              type: type, // 使用 Prisma 枚举值
              description: description,
            },
          })

          return {
            newBalance: updatedUser.credits,
          }
        },
        {
          maxWait: 5000, // 最大等待时间 5秒
          timeout: 10000, // 事务超时时间 10秒
        }
      )

      return {
        success: true,
        newBalance: result.newBalance,
      }
    } catch (error) {
      console.error("[CreditService] 积分变动失败:", error)
      return {
        success: false,
        newBalance: 0,
        error: error instanceof Error ? error.message : "未知错误",
      }
    }
  }

  /**
   * 增加积分（便捷方法）
   *
   * @param userId 用户ID
   * @param amount 增加的积分数量（必须为正数）
   * @param type 积分变动类型
   * @param description 积分变动描述
   * @returns 积分变动结果
   */
  static async addCredits(
    userId: bigint,
    amount: number,
    type: CreditLogType,
    description: string
  ): Promise<CreditChangeResult> {
    if (amount <= 0) {
      return {
        success: false,
        newBalance: 0,
        error: "增加的积分数量必须大于0",
      }
    }

    return this.changeCredits({
      userId,
      amount,
      type,
      description,
    })
  }

  /**
   * 减少积分（便捷方法）
   *
   * @param userId 用户ID
   * @param amount 减少的积分数量（必须为正数）
   * @param type 积分变动类型
   * @param description 积分变动描述
   * @returns 积分变动结果
   */
  static async subtractCredits(
    userId: bigint,
    amount: number,
    type: CreditLogType,
    description: string
  ): Promise<CreditChangeResult> {
    if (amount <= 0) {
      return {
        success: false,
        newBalance: 0,
        error: "减少的积分数量必须大于0",
      }
    }

    return this.changeCredits({
      userId,
      amount: -amount, // 转为负数
      type,
      description,
    })
  }

  /**
   * 批量积分变动（在同一个事务中）
   *
   * @param changes 多个积分变动参数
   * @returns 所有用户的积分变动结果
   */
  static async batchChangeCredits(
    changes: CreditChangeParams[]
  ): Promise<Map<bigint, CreditChangeResult>> {
    const results = new Map<bigint, CreditChangeResult>()

    try {
      await prisma.$transaction(
        async (tx) => {
          for (const change of changes) {
            const { userId, amount, type, description } = change

            // 查询用户当前积分
            const user = await tx.users.findUnique({
              where: { id: userId },
              select: { credits: true },
            })

            if (!user) {
              results.set(userId, {
                success: false,
                newBalance: 0,
                error: "用户不存在",
              })
              continue
            }

            // 计算新余额并验证
            const newBalance = user.credits + amount
            if (newBalance < 0) {
              results.set(userId, {
                success: false,
                newBalance: user.credits,
                error: `积分不足：当前积分 ${user.credits}，需要 ${Math.abs(amount)}`,
              })
              continue
            }

            // 更新积分
            const updatedUser = await tx.users.update({
              where: { id: userId },
              data: {
                credits: {
                  increment: amount,
                },
              },
              select: {
                credits: true,
              },
            })

            // 创建积分变动日志
            await tx.user_credit_logs.create({
              data: {
                id: generateId(),
                user_id: userId,
                amount: amount,
                balance: updatedUser.credits,
                type: type,
                description: description,
              },
            })

            results.set(userId, {
              success: true,
              newBalance: updatedUser.credits,
            })
          }
        },
        {
          maxWait: 5000,
          timeout: 15000, // 批量操作超时时间更长
        }
      )
    } catch (error) {
      console.error("[CreditService] 批量积分变动失败:", error)
      // 如果事务失败，将所有未处理的用户标记为失败
      for (const change of changes) {
        if (!results.has(change.userId)) {
          results.set(change.userId, {
            success: false,
            newBalance: 0,
            error: error instanceof Error ? error.message : "未知错误",
          })
        }
      }
    }

    return results
  }
}

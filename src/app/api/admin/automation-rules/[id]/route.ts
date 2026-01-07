import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/guard"
import { CronManager } from "@/lib/automation/cron-manager"

type RuleDTO = {
  id: string
  name: string
  description: string | null
  triggerType: string
  triggerConditions: unknown
  actionType: string
  actionParams: unknown
  priority: number
  isEnabled: boolean
  isRepeatable: boolean
  maxExecutions: number | null
  cooldownSeconds: number | null
  startTime: string | null
  endTime: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

// 验证触发器类型
function validateTriggerType(type: string): boolean {
  const validTypes = [
    "CRON",
    "POST_CREATE",
    "POST_REPLY",
    "CHECKIN",
    "DONATION",
    "POST_LIKE",
    "USER_REGISTER",
    "USER_LOGIN",
  ]
  return validTypes.includes(type)
}

// 验证动作类型
function validateActionType(type: string): boolean {
  const validTypes = [
    "CREDIT_CHANGE",
    "BADGE_GRANT",
    "BADGE_REVOKE",
    "USER_GROUP_CHANGE",
  ]
  return validTypes.includes(type)
}

// PATCH - 更新规则
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await props.params
    const ruleId = BigInt(params.id)

    // 查询规则是否存在
    const existingRule = await prisma.automation_rules.findUnique({
      where: { id: ruleId },
    })

    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      description,
      triggerType,
      triggerConditions,
      actionType,
      actionParams,
      priority,
      isEnabled,
      isRepeatable,
      maxExecutions,
      cooldownSeconds,
      startTime,
      endTime,
      isDeleted,
    } = body

    // 验证字段（如果提供）
    if (
      name !== undefined &&
      (typeof name !== "string" || name.length < 1 || name.length > 128)
    ) {
      return NextResponse.json(
        { error: "Name must be between 1-128 characters" },
        { status: 400 }
      )
    }

    if (
      description !== undefined &&
      description !== null &&
      (typeof description !== "string" || description.length > 512)
    ) {
      return NextResponse.json(
        { error: "Description must not exceed 512 characters" },
        { status: 400 }
      )
    }

    if (triggerType !== undefined && !validateTriggerType(triggerType)) {
      return NextResponse.json(
        { error: "Invalid trigger type" },
        { status: 400 }
      )
    }

    if (actionType !== undefined && !validateActionType(actionType)) {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      )
    }

    if (
      priority !== undefined &&
      (typeof priority !== "number" || !Number.isInteger(priority))
    ) {
      return NextResponse.json(
        { error: "Priority must be an integer" },
        { status: 400 }
      )
    }

    // 时间范围验证
    if (startTime !== undefined && endTime !== undefined) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      if (end <= start) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        )
      }
    }

    // 构建更新数据
    const updateData: Prisma.automation_rulesUpdateInput = {
      updated_by: admin.userId,
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (triggerType !== undefined) updateData.trigger_type = triggerType
    if (triggerConditions !== undefined)
      updateData.trigger_conditions = triggerConditions as Prisma.InputJsonValue
    if (actionType !== undefined) updateData.action_type = actionType
    if (actionParams !== undefined)
      updateData.action_params = actionParams as Prisma.InputJsonValue
    if (priority !== undefined) updateData.priority = priority
    if (isEnabled !== undefined) updateData.is_enabled = isEnabled
    if (isRepeatable !== undefined) updateData.is_repeatable = isRepeatable
    if (maxExecutions !== undefined)
      updateData.max_executions = maxExecutions || null
    if (cooldownSeconds !== undefined)
      updateData.cooldown_seconds = cooldownSeconds || null
    if (startTime !== undefined)
      updateData.start_time = startTime ? new Date(startTime) : null
    if (endTime !== undefined)
      updateData.end_time = endTime ? new Date(endTime) : null
    if (isDeleted !== undefined) updateData.is_deleted = isDeleted

    // 更新规则
    const rule = await prisma.automation_rules.update({
      where: { id: ruleId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        trigger_type: true,
        trigger_conditions: true,
        action_type: true,
        action_params: true,
        priority: true,
        is_enabled: true,
        is_repeatable: true,
        max_executions: true,
        cooldown_seconds: true,
        start_time: true,
        end_time: true,
        is_deleted: true,
        created_at: true,
        updated_at: true,
      },
    })

    // 如果是 CRON 类型，更新定时任务
    if (rule.trigger_type === "CRON") {
      try {
        if (rule.is_deleted || !rule.is_enabled) {
          // 删除或禁用规则时，移除定时任务
          CronManager.removeTask(rule.id)
        } else {
          // 更新定时任务
          await CronManager.updateTask({
            id: rule.id,
            trigger_conditions: rule.trigger_conditions,
            action_type: rule.action_type,
            action_params: rule.action_params,
          })
        }
      } catch (error) {
        console.error("Failed to update cron task:", error)
      }
    }

    const result: RuleDTO = {
      id: String(rule.id),
      name: rule.name,
      description: rule.description,
      triggerType: rule.trigger_type,
      triggerConditions: rule.trigger_conditions,
      actionType: rule.action_type,
      actionParams: rule.action_params,
      priority: rule.priority,
      isEnabled: rule.is_enabled,
      isRepeatable: rule.is_repeatable,
      maxExecutions: rule.max_executions,
      cooldownSeconds: rule.cooldown_seconds,
      startTime: rule.start_time ? rule.start_time.toISOString() : null,
      endTime: rule.end_time ? rule.end_time.toISOString() : null,
      isDeleted: rule.is_deleted,
      createdAt: rule.created_at.toISOString(),
      updatedAt: rule.updated_at.toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Update automation rule error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


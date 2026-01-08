import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/guard"
import { generateId } from "@/lib/id"
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

type RuleListResult = {
  items: RuleDTO[]
  page: number
  pageSize: number
  total: number
}

// 验证触发器类型
function validateTriggerType(type: string): boolean {
  const validTypes = [
    "CRON",
    "POST_CREATE",
    "POST_REPLY",
    "CHECKIN",
    "DONATION",
    "POST_LIKE_GIVEN",
    "POST_LIKE_RECEIVED",
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

// GET - 获取规则列表
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const q = searchParams.get("q") || ""
    const triggerType = searchParams.get("triggerType")
    const actionType = searchParams.get("actionType")
    const enabled = searchParams.get("enabled")
    const deleted = searchParams.get("deleted")
    const sortBy = searchParams.get("sortBy") || "updated_at"

    // 构建查询条件
    const where: Prisma.automation_rulesWhereInput = {}

    if (q.trim().length > 0) {
      where.OR = [
        { name: { contains: q.trim(), mode: "insensitive" } },
        { description: { contains: q.trim(), mode: "insensitive" } },
      ]
    }

    if (triggerType && triggerType !== "all") {
      where.trigger_type = triggerType as Prisma.EnumRuleTriggerTypeFilter
    }

    if (actionType && actionType !== "all") {
      where.action_type = actionType as Prisma.EnumRuleActionTypeFilter
    }

    if (enabled === "true") {
      where.is_enabled = true
    } else if (enabled === "false") {
      where.is_enabled = false
    }

    if (deleted === "true") {
      where.is_deleted = true
    } else if (deleted === "false") {
      where.is_deleted = false
    }

    // 排序规则
    let orderBy: Prisma.automation_rulesOrderByWithRelationInput = {
      updated_at: "desc",
    }
    if (sortBy === "created_at") {
      orderBy = { created_at: "desc" }
    } else if (sortBy === "priority") {
      orderBy = { priority: "desc" }
    }

    // 查询总数
    const total = await prisma.automation_rules.count({ where })

    // 查询当前页数据
    const rules = await prisma.automation_rules.findMany({
      where,
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
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 转换为 DTO
    const items: RuleDTO[] = rules.map((r) => ({
      id: String(r.id),
      name: r.name,
      description: r.description,
      triggerType: r.trigger_type,
      triggerConditions: r.trigger_conditions,
      actionType: r.action_type,
      actionParams: r.action_params,
      priority: r.priority,
      isEnabled: r.is_enabled,
      isRepeatable: r.is_repeatable,
      maxExecutions: r.max_executions,
      cooldownSeconds: r.cooldown_seconds,
      startTime: r.start_time ? r.start_time.toISOString() : null,
      endTime: r.end_time ? r.end_time.toISOString() : null,
      isDeleted: r.is_deleted,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    }))

    const result: RuleListResult = {
      items,
      page,
      pageSize,
      total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get automation rules error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - 创建规则
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    } = body

    // 验证必填字段
    if (
      !name ||
      typeof name !== "string" ||
      name.length < 1 ||
      name.length > 128
    ) {
      return NextResponse.json(
        { error: "Name must be between 1-128 characters" },
        { status: 400 }
      )
    }

    if (
      description &&
      (typeof description !== "string" || description.length > 512)
    ) {
      return NextResponse.json(
        { error: "Description must not exceed 512 characters" },
        { status: 400 }
      )
    }

    if (!triggerType || !validateTriggerType(triggerType)) {
      return NextResponse.json(
        { error: "Invalid trigger type" },
        { status: 400 }
      )
    }

    if (!actionType || !validateActionType(actionType)) {
      return NextResponse.json(
        { error: "Invalid action type" },
        { status: 400 }
      )
    }

    if (typeof priority !== "number" || !Number.isInteger(priority)) {
      return NextResponse.json(
        { error: "Priority must be an integer" },
        { status: 400 }
      )
    }

    // 时间范围验证
    if (startTime && endTime) {
      const start = new Date(startTime)
      const end = new Date(endTime)
      if (end <= start) {
        return NextResponse.json(
          { error: "End time must be after start time" },
          { status: 400 }
        )
      }
    }

    // 创建规则
    const rule = await prisma.automation_rules.create({
      data: {
        id: generateId(),
        name,
        description: description || null,
        trigger_type: triggerType,
        trigger_conditions: triggerConditions || null,
        action_type: actionType,
        action_params: actionParams,
        priority,
        is_enabled: typeof isEnabled === "boolean" ? isEnabled : true,
        is_repeatable: typeof isRepeatable === "boolean" ? isRepeatable : true,
        max_executions: maxExecutions || null,
        cooldown_seconds: cooldownSeconds || null,
        start_time: startTime ? new Date(startTime) : null,
        end_time: endTime ? new Date(endTime) : null,
        created_by: admin.userId,
        updated_by: admin.userId,
        is_deleted: false,
      },
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

    // 如果是 CRON 类型且已启用，添加定时任务
    if (triggerType === "CRON" && rule.is_enabled) {
      try {
        await CronManager.addTask({
          id: rule.id,
          trigger_conditions: rule.trigger_conditions,
          action_type: rule.action_type,
          action_params: rule.action_params,
        })
      } catch (error) {
        console.error("Failed to add cron task:", error)
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

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Create automation rule error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


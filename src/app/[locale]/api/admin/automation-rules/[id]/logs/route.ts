import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type LogDTO = {
  id: string
  ruleId: string
  triggeredBy: string | null
  triggerContext: unknown
  executionStatus: string
  executionResult: unknown
  errorMessage: string | null
  executedAt: string
}

type LogListResult = {
  items: LogDTO[]
  page: number
  pageSize: number
  total: number
}

// GET - 获取规则执行日志
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const ruleId = BigInt(params.id)

    // 检查规则是否存在
    const ruleExists = await prisma.automation_rules.findUnique({
      where: { id: ruleId },
      select: { id: true },
    })

    if (!ruleExists) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const status = searchParams.get("status")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // 构建查询条件
    const where: Prisma.automation_rule_logsWhereInput = {
      rule_id: ruleId,
    }

    if (status && status !== "all") {
      where.execution_status = status
    }

    if (startDate || endDate) {
      where.executed_at = {}
      if (startDate) {
        where.executed_at.gte = new Date(startDate)
      }
      if (endDate) {
        where.executed_at.lte = new Date(endDate)
      }
    }

    // 查询总数
    const total = await prisma.automation_rule_logs.count({ where })

    // 查询当前页数据
    const logs = await prisma.automation_rule_logs.findMany({
      where,
      select: {
        id: true,
        rule_id: true,
        triggered_by: true,
        trigger_context: true,
        execution_status: true,
        execution_result: true,
        error_message: true,
        executed_at: true,
      },
      orderBy: { executed_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 转换为 DTO
    const items: LogDTO[] = logs.map((log) => ({
      id: String(log.id),
      ruleId: String(log.rule_id),
      triggeredBy: log.triggered_by ? String(log.triggered_by) : null,
      triggerContext: log.trigger_context,
      executionStatus: log.execution_status,
      executionResult: log.execution_result,
      errorMessage: log.error_message,
      executedAt: log.executed_at.toISOString(),
    }))

    const result: LogListResult = {
      items,
      page,
      pageSize,
      total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get automation rule logs error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

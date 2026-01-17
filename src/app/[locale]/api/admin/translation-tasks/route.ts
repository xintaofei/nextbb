import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import {
  TranslationTaskStatus,
  TranslationEntityType,
  TranslationTaskPriority,
  Prisma,
} from "@prisma/client"

interface TranslationTaskItem {
  id: string
  entityType: TranslationEntityType
  entityId: string
  sourceLocale: string
  targetLocale: string
  status: TranslationTaskStatus
  priority: TranslationTaskPriority
  retryCount: number
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  startedAt: string | null
  completedAt: string | null
}

interface TranslationTaskListResult {
  items: TranslationTaskItem[]
  total: number
}

// GET - 获取翻译任务列表
export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const entityType = searchParams.get("entityType")
    const priority = searchParams.get("priority")
    const targetLocale = searchParams.get("targetLocale")

    // 限制分页参数，防止恶意请求
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("pageSize") || "20"))
    )

    // 构建查询条件，使用 Prisma 类型
    const where: Prisma.translation_tasksWhereInput = {}

    if (status && status !== "ALL") {
      where.status = status as TranslationTaskStatus
    }

    if (entityType && entityType !== "ALL") {
      where.entity_type = entityType as TranslationEntityType
    }

    if (priority && priority !== "ALL") {
      where.priority = priority as TranslationTaskPriority
    }

    if (targetLocale && targetLocale !== "ALL") {
      where.target_locale = targetLocale
    }

    // 并行执行查询以提高性能
    const [total, tasks] = await Promise.all([
      prisma.translation_tasks.count({ where }),
      prisma.translation_tasks.findMany({
        where,
        orderBy: {
          created_at: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    // 转换为 DTO
    const items: TranslationTaskItem[] = tasks.map((task) => ({
      id: String(task.id),
      entityType: task.entity_type,
      entityId: String(task.entity_id),
      sourceLocale: task.source_locale,
      targetLocale: task.target_locale,
      status: task.status,
      priority: task.priority,
      retryCount: task.retry_count,
      errorMessage: task.error_message,
      createdAt: task.created_at.toISOString(),
      updatedAt: task.updated_at.toISOString(),
      startedAt: task.started_at?.toISOString() || null,
      completedAt: task.completed_at?.toISOString() || null,
    }))

    const result: TranslationTaskListResult = {
      items,
      total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get translation tasks error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

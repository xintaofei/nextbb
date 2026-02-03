import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { getLocale } from "next-intl/server"
import { createTranslationTasks } from "@/lib/services/translation-task"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"
import { TranslationEntityType } from "@prisma/client"

type ExpressionGroupDTO = {
  id: string
  code: string
  name: string
  iconId: string | null
  expressionSize: "SMALL" | "MEDIUM" | "LARGE"
  sort: number
  isEnabled: boolean
  isDeleted: boolean
  sourceLocale: string
  expressionCount: number
  createdAt: string
  updatedAt: string
}

type ExpressionGroupListResult = {
  items: ExpressionGroupDTO[]
  page: number
  pageSize: number
  total: number
}

// GET - 获取表情分组列表
export async function GET(request: NextRequest) {
  try {
    const locale = await getLocale()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const q = searchParams.get("q") || ""
    const enabled = searchParams.get("enabled")
    const sortBy = searchParams.get("sortBy") || "updated_at"

    // 构建查询条件
    type WhereClause = {
      OR?: Array<{
        translations: {
          some: {
            name: { contains: string; mode: "insensitive" }
          }
        }
      }>
      is_deleted: boolean
      is_enabled?: boolean
    }

    const where: WhereClause = {
      is_deleted: false, // 默认不查询已删除的
    }

    if (q.trim().length > 0) {
      where.OR = [
        {
          translations: {
            some: {
              name: { contains: q.trim(), mode: "insensitive" },
            },
          },
        },
      ]
    }

    if (enabled === "true") {
      where.is_enabled = true
    } else if (enabled === "false") {
      where.is_enabled = false
    }

    // 排序规则
    let orderBy: Record<string, string> = { updated_at: "desc" }
    if (sortBy === "sort") {
      orderBy = { sort: "asc" }
    }

    // 查询总数
    const total = await prisma.expression_groups.count({ where })

    // 查询当前页数据
    const groups = await prisma.expression_groups.findMany({
      where,
      select: {
        id: true,
        code: true,
        icon_id: true,
        expression_size: true,
        sort: true,
        is_enabled: true,
        is_deleted: true,
        source_locale: true,
        created_at: true,
        updated_at: true,
        translations: getTranslationsQuery(locale, {
          name: true,
        }),
        _count: {
          select: {
            expressions: {
              where: {
                is_deleted: false,
              },
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 转换为 DTO
    const items: ExpressionGroupDTO[] = groups.map((g) => {
      // 使用通用工具函数获取翻译字段
      const { name } = getTranslationFields(g.translations, locale, {
        name: "",
      })

      return {
        id: String(g.id),
        code: g.code,
        name,
        iconId: g.icon_id ? String(g.icon_id) : null,
        expressionSize: g.expression_size,
        sort: g.sort,
        isEnabled: g.is_enabled,
        isDeleted: g.is_deleted,
        sourceLocale: g.source_locale,
        expressionCount: g._count.expressions,
        createdAt: g.created_at.toISOString(),
        updatedAt: g.updated_at.toISOString(),
      }
    })

    const result: ExpressionGroupListResult = {
      items,
      page,
      pageSize,
      total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get expression groups error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - 创建表情分组
export async function POST(request: NextRequest) {
  try {
    const validExpressionSizes: ReadonlySet<string> = new Set([
      "SMALL",
      "MEDIUM",
      "LARGE",
    ])
    const body = await request.json()
    const { code, name, iconId, sort, expressionSize } = body

    // 验证必填字段
    if (
      !code ||
      typeof code !== "string" ||
      code.length < 1 ||
      code.length > 32
    ) {
      return NextResponse.json(
        { error: "Code must be between 1-32 characters" },
        { status: 400 }
      )
    }

    // 验证 code 格式（仅允许字母、数字、下划线）
    const codePattern = /^[a-zA-Z0-9_]+$/
    if (!codePattern.test(code)) {
      return NextResponse.json(
        { error: "Code must contain only letters, numbers and underscores" },
        { status: 400 }
      )
    }

    // 检查 code 唯一性
    const existingGroup = await prisma.expression_groups.findFirst({
      where: { code },
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: "Group code already exists" },
        { status: 400 }
      )
    }

    if (
      !name ||
      typeof name !== "string" ||
      name.length < 1 ||
      name.length > 32
    ) {
      return NextResponse.json(
        { error: "Name must be between 1-32 characters" },
        { status: 400 }
      )
    }

    if (typeof sort !== "number" || !Number.isInteger(sort)) {
      return NextResponse.json(
        { error: "Sort must be an integer" },
        { status: 400 }
      )
    }

    if (
      expressionSize !== undefined &&
      !validExpressionSizes.has(expressionSize)
    ) {
      return NextResponse.json(
        { error: "Expression size is invalid" },
        { status: 400 }
      )
    }

    // 获取当前请求的语言作为源语言
    const sourceLocale = await getLocale()

    // 创建分组和初始翻译
    const result = await prisma.$transaction(async (tx) => {
      const groupId = generateId()
      const newGroup = await tx.expression_groups.create({
        data: {
          id: groupId,
          code,
          icon_id: iconId ? BigInt(iconId) : null,
          expression_size: expressionSize ?? "SMALL",
          sort,
          is_enabled: true,
          is_deleted: false,
          source_locale: sourceLocale,
        },
      })

      const translation = await tx.expression_group_translations.create({
        data: {
          group_id: groupId,
          locale: sourceLocale,
          name,
          is_source: true,
          version: 0,
        },
      })

      const count = await tx.expressions.count({
        where: { group_id: groupId, is_deleted: false },
      })

      return { ...newGroup, translation, expressionCount: count }
    })

    // 创建翻译任务
    await createTranslationTasks(
      TranslationEntityType.EXPRESSION_GROUP,
      result.id,
      result.source_locale,
      result.translation.version
    )

    const groupDTO: ExpressionGroupDTO = {
      id: String(result.id),
      code: result.code,
      name: result.translation.name,
      iconId: result.icon_id ? String(result.icon_id) : null,
      expressionSize: result.expression_size,
      sort: result.sort,
      isEnabled: result.is_enabled,
      isDeleted: result.is_deleted,
      sourceLocale: result.source_locale,
      expressionCount: result.expressionCount,
      createdAt: result.created_at.toISOString(),
      updatedAt: result.updated_at.toISOString(),
    }

    return NextResponse.json(groupDTO, { status: 201 })
  } catch (error) {
    console.error("Create expression group error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

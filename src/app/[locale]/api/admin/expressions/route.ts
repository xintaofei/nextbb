import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { getLocale } from "next-intl/server"
import { createTranslationTasks } from "@/lib/services/translation-task"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"
import { TranslationEntityType } from "@prisma/client"
import { getExpressionThumbnailPathFromImagePath } from "@/lib/expression-utils"

type ExpressionDTO = {
  id: string
  groupId: string
  groupName: string
  code: string
  name: string
  imagePath: string
  imageUrl: string
  thumbnailUrl: string
  width: number | null
  height: number | null
  sort: number
  isEnabled: boolean
  isDeleted: boolean
  isAnimated: boolean
  sourceLocale: string
  createdAt: string
  updatedAt: string
}

type ExpressionListResult = {
  items: ExpressionDTO[]
  page: number
  pageSize: number
  total: number
}

// GET - 获取表情列表
export async function GET(request: NextRequest) {
  try {
    const locale = await getLocale()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "100")
    const q = searchParams.get("q") || ""
    const groupId = searchParams.get("groupId")
    const enabled = searchParams.get("enabled")
    const sortBy = searchParams.get("sortBy") || "sort"

    // 构建查询条件
    type WhereClause = {
      OR?: Array<{
        translations: {
          some: {
            name: { contains: string; mode: "insensitive" }
          }
        }
      }>
      group_id?: bigint
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

    if (groupId) {
      where.group_id = BigInt(groupId)
    }

    if (enabled === "true") {
      where.is_enabled = true
    } else if (enabled === "false") {
      where.is_enabled = false
    }

    // 排序规则
    let orderBy: Record<string, string> = { sort: "asc" }
    if (sortBy === "updated_at") {
      orderBy = { updated_at: "desc" }
    }

    // 查询总数
    const total = await prisma.expressions.count({ where })

    // 查询当前页数据
    const expressions = await prisma.expressions.findMany({
      where,
      select: {
        id: true,
        group_id: true,
        code: true,
        image_path: true,
        width: true,
        height: true,
        sort: true,
        is_enabled: true,
        is_deleted: true,
        is_animated: true,
        source_locale: true,
        created_at: true,
        updated_at: true,
        group: {
          select: {
            translations: getTranslationsQuery(locale, { name: true }),
          },
        },
        translations: getTranslationsQuery(locale, { name: true }),
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 转换为 DTO
    const items: ExpressionDTO[] = expressions.map((e) => {
      // 使用通用工具函数获取翻译字段
      const fields = getTranslationFields(e.translations, locale, { name: "" })
      const groupFields = getTranslationFields(e.group.translations, locale, {
        name: "",
      })

      return {
        id: String(e.id),
        groupId: String(e.group_id),
        groupName: groupFields.name,
        code: e.code,
        name: fields.name,
        imagePath: e.image_path,
        imageUrl: e.image_path,
        thumbnailUrl: getExpressionThumbnailPathFromImagePath(e.image_path),
        width: e.width,
        height: e.height,
        sort: e.sort,
        isEnabled: e.is_enabled,
        isDeleted: e.is_deleted,
        isAnimated: e.is_animated ?? false,
        sourceLocale: e.source_locale,
        createdAt: e.created_at.toISOString(),
        updatedAt: e.updated_at.toISOString(),
      }
    })

    const result: ExpressionListResult = {
      items,
      page,
      pageSize,
      total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get expressions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - 创建表情
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupId, code, name, imagePath, width, height, sort, isAnimated } =
      body

    // 验证必填字段
    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      )
    }

    const groupIdBigInt = BigInt(groupId)

    // 检查分组是否存在
    const group = await prisma.expression_groups.findUnique({
      where: { id: groupIdBigInt },
    })

    if (!group) {
      return NextResponse.json(
        { error: "Expression group not found" },
        { status: 404 }
      )
    }

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

    // 检查同一分组内 code 唯一性
    const existingExpression = await prisma.expressions.findFirst({
      where: { group_id: groupIdBigInt, code },
    })

    if (existingExpression) {
      return NextResponse.json(
        { error: "Expression code already exists in this group" },
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

    if (!imagePath) {
      return NextResponse.json(
        { error: "Image path is required" },
        { status: 400 }
      )
    }

    let finalSort: number
    if (sort === undefined || sort === null) {
      const maxSortExpression = await prisma.expressions.findFirst({
        where: { group_id: groupIdBigInt },
        orderBy: { sort: "desc" },
        select: { sort: true },
      })
      finalSort = (maxSortExpression?.sort ?? 0) + 1
    } else {
      if (typeof sort !== "number" || !Number.isInteger(sort)) {
        return NextResponse.json(
          { error: "Sort must be an integer" },
          { status: 400 }
        )
      }
      finalSort = sort
    }

    // 获取当前请求的语言作为源语言
    const sourceLocale = await getLocale()

    // 创建表情和初始翻译
    const result = await prisma.$transaction(async (tx) => {
      const expressionId = generateId()
      const newExpression = await tx.expressions.create({
        data: {
          id: expressionId,
          group_id: groupIdBigInt,
          code,
          image_path: imagePath,
          width,
          height,
          is_animated: isAnimated ?? false,
          sort: finalSort,
          is_enabled: true,
          is_deleted: false,
          source_locale: sourceLocale,
        },
      })

      const translation = await tx.expression_translations.create({
        data: {
          expression_id: expressionId,
          locale: sourceLocale,
          name,
          is_source: true,
          version: 0,
        },
      })

      return { ...newExpression, translation }
    })

    // 创建翻译任务
    await createTranslationTasks(
      TranslationEntityType.EXPRESSION,
      result.id,
      result.source_locale,
      result.translation.version
    )

    const expressionDTO: ExpressionDTO = {
      id: String(result.id),
      groupId: String(result.group_id),
      groupName: "",
      code: result.code,
      name: result.translation.name,
      imagePath: result.image_path,
      imageUrl: result.image_path,
      thumbnailUrl: getExpressionThumbnailPathFromImagePath(result.image_path),
      width: result.width,
      height: result.height,
      sort: result.sort,
      isEnabled: result.is_enabled,
      isDeleted: result.is_deleted,
      isAnimated: result.is_animated ?? false,
      sourceLocale: result.source_locale,
      createdAt: result.created_at.toISOString(),
      updatedAt: result.updated_at.toISOString(),
    }

    return NextResponse.json(expressionDTO, { status: 201 })
  } catch (error) {
    console.error("Create expression error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

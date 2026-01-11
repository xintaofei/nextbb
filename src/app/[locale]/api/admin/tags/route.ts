import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"
import { getLocale } from "next-intl/server"

type TagDTO = {
  id: string
  name: string
  icon: string
  description: string | null
  sort: number
  bgColor: string | null
  textColor: string | null
  sourceLocale: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  usageCount: number
}

type TagListResult = {
  items: TagDTO[]
  page: number
  pageSize: number
  total: number
}

// 颜色格式验证
function validateColor(color: string | null): boolean {
  if (!color) return true
  const hexPattern = /^#([0-9A-Fa-f]{3}){1,2}$/
  const rgbPattern = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/
  const rgbaPattern =
    /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/

  return (
    hexPattern.test(color) || rgbPattern.test(color) || rgbaPattern.test(color)
  )
}

// GET - 获取标签列表
export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const locale = (request.nextUrl.pathname.split("/")[1] || "zh") as string
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const q = searchParams.get("q") || ""
    const deleted = searchParams.get("deleted")
    const sortBy = searchParams.get("sortBy") || "updated_at"

    // 构建查询条件
    const where: {
      OR?: Array<{
        translations: {
          some: {
            name: { contains: string; mode: "insensitive" }
          }
        }
      }>
      is_deleted?: boolean
    } = {}

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

    if (deleted === "true") {
      where.is_deleted = true
    } else if (deleted === "false") {
      where.is_deleted = false
    }

    // 排序规则
    let orderBy: Record<string, string> = { updated_at: "desc" }
    if (sortBy === "sort") {
      orderBy = { sort: "desc" }
    } else if (sortBy === "usage_count") {
      orderBy = { updated_at: "desc" }
    }

    // 查询总数
    const total = await prisma.tags.count({ where })

    // 查询当前页数据
    const tags = await prisma.tags.findMany({
      where,
      select: {
        id: true,
        source_locale: true,
        icon: true,
        sort: true,
        bg_color: true,
        text_color: true,
        is_deleted: true,
        created_at: true,
        updated_at: true,
        translations: {
          where: {
            OR: [{ locale, is_source: false }, { is_source: true }],
          },
          select: {
            locale: true,
            name: true,
            description: true,
            is_source: true,
          },
          take: 2,
        },
        _count: {
          select: {
            topic_links: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 转换为 DTO
    const items: TagDTO[] = tags.map((t) => {
      // 选择翻译：优先匹配当前 locale，否则取 is_source 为 true 的
      const translation =
        t.translations.find((tr) => tr.locale === locale && !tr.is_source) ||
        t.translations.find((tr) => tr.is_source)

      return {
        id: String(t.id),
        name: translation?.name || "",
        icon: t.icon,
        description: translation?.description || null,
        sort: t.sort,
        bgColor: t.bg_color,
        textColor: t.text_color,
        sourceLocale: t.source_locale,
        isDeleted: t.is_deleted,
        createdAt: t.created_at.toISOString(),
        updatedAt: t.updated_at.toISOString(),
        usageCount: t._count.topic_links,
      }
    })

    // 如果按使用次数排序，在内存中排序
    if (sortBy === "usage_count") {
      items.sort((a, b) => b.usageCount - a.usageCount)
    }

    const result: TagListResult = {
      items,
      page,
      pageSize,
      total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get tags error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - 创建标签
export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, icon, description, sort, bgColor, textColor } = body

    // 验证必填字段
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

    // 检查名称唯一性（在当前 locale 的翻译中检查）
    const existingTranslation = await prisma.tag_translations.findFirst({
      where: { name, locale: "zh" }, // 默认检查中文名称
    })

    if (existingTranslation) {
      return NextResponse.json(
        { error: "Tag name already exists" },
        { status: 400 }
      )
    }

    if (
      description &&
      (typeof description !== "string" || description.length > 256)
    ) {
      return NextResponse.json(
        { error: "Description must not exceed 256 characters" },
        { status: 400 }
      )
    }

    if (typeof sort !== "number" || !Number.isInteger(sort)) {
      return NextResponse.json(
        { error: "Sort must be an integer" },
        { status: 400 }
      )
    }

    // 验证颜色格式
    if (!validateColor(bgColor)) {
      return NextResponse.json(
        { error: "Invalid background color format" },
        { status: 400 }
      )
    }

    if (!validateColor(textColor)) {
      return NextResponse.json(
        { error: "Invalid text color format" },
        { status: 400 }
      )
    }

    // 获取当前请求的语言作为源语言
    const sourceLocale = await getLocale()

    // 创建标签和初始翻译
    const result = await prisma.$transaction(async (tx) => {
      const tagId = generateId()
      const newTag = await tx.tags.create({
        data: {
          id: tagId,
          icon: icon || "",
          sort,
          bg_color: bgColor || null,
          text_color: textColor || null,
          is_deleted: false,
          source_locale: sourceLocale,
        },
      })

      const translation = await tx.tag_translations.create({
        data: {
          tag_id: tagId,
          locale: sourceLocale,
          name,
          description: description || null,
          is_source: true,
          version: 0,
        },
      })

      const count = await tx.topic_tags.count({
        where: { tag_id: tagId },
      })

      return { ...newTag, translation, usageCount: count }
    })

    const tagDTO: TagDTO = {
      id: String(result.id),
      name: result.translation.name,
      icon: result.icon,
      description: result.translation.description,
      sort: result.sort,
      bgColor: result.bg_color,
      textColor: result.text_color,
      sourceLocale: result.source_locale,
      isDeleted: result.is_deleted,
      createdAt: result.created_at.toISOString(),
      updatedAt: result.updated_at.toISOString(),
      usageCount: result.usageCount,
    }

    return NextResponse.json(tagDTO, { status: 201 })
  } catch (error) {
    console.error("Create tag error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

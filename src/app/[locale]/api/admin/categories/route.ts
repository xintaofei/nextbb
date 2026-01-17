import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"
import { getLocale } from "next-intl/server"

type CategoryDTO = {
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
  topicCount: number
}

type CategoryListResult = {
  items: CategoryDTO[]
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

// GET - 获取分类列表
export async function GET(request: NextRequest) {
  try {
    const auth = await getSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get("q") || ""
    const deleted = searchParams.get("deleted")
    const sortBy = searchParams.get("sortBy") || "updated_at"

    // 构建查询条件
    const where: {
      translations?: {
        some: {
          name?: { contains: string; mode: "insensitive" }
          is_source: boolean
        }
      }
      is_deleted?: boolean
    } = {}

    if (q.trim().length > 0) {
      where.translations = {
        some: {
          name: { contains: q.trim(), mode: "insensitive" },
          is_source: true,
        },
      }
    }

    if (deleted === "true") {
      where.is_deleted = true
    } else if (deleted === "false") {
      where.is_deleted = false
    }

    // 排序规则
    let orderBy: Record<string, string> = { updated_at: "desc" }
    if (sortBy === "sort") {
      orderBy = { sort: "asc" }
    } else if (sortBy === "topic_count") {
      // 注意：按话题数排序需要特殊处理
      orderBy = { updated_at: "desc" }
    }

    // 查询总数
    const total = await prisma.categories.count({ where })

    // 查询当前页数据
    const categories = await prisma.categories.findMany({
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
          where: { is_source: true },
          select: {
            name: true,
            description: true,
          },
          take: 1,
        },
        _count: {
          select: {
            topics: true,
          },
        },
      },
      orderBy,
    })

    // 转换为 DTO
    const items: CategoryDTO[] = categories.map((c) => {
      const translation = c.translations[0]
      return {
        id: String(c.id),
        name: translation?.name || "",
        icon: c.icon,
        description: translation?.description || null,
        sort: c.sort,
        bgColor: c.bg_color,
        textColor: c.text_color,
        sourceLocale: c.source_locale,
        isDeleted: c.is_deleted,
        createdAt: c.created_at.toISOString(),
        updatedAt: c.updated_at.toISOString(),
        topicCount: c._count.topics,
      }
    })

    // 如果按话题数排序，在内存中排序
    if (sortBy === "topic_count") {
      items.sort((a, b) => b.topicCount - a.topicCount)
    }

    const result: CategoryListResult = {
      items,
      total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - 创建分类
export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, icon, description, bgColor, textColor } = body

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

    if (
      description &&
      (typeof description !== "string" || description.length > 255)
    ) {
      return NextResponse.json(
        { error: "Description must not exceed 255 characters" },
        { status: 400 }
      )
    }

    // 自动分配排序值
    const maxSortResult = await prisma.categories.aggregate({
      _max: { sort: true },
    })
    const sort = (maxSortResult._max.sort ?? -1) + 1

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

    // 创建分类（使用事务）
    const categoryId = generateId()
    const result = await prisma.$transaction(async (tx) => {
      // 1. 创建分类记录
      await tx.categories.create({
        data: {
          id: categoryId,
          source_locale: sourceLocale,
          icon: icon || "",
          sort,
          bg_color: bgColor || null,
          text_color: textColor || null,
          is_deleted: false,
        },
      })

      // 2. 创建源语言翻译记录
      await tx.category_translations.create({
        data: {
          category_id: categoryId,
          locale: sourceLocale,
          name,
          description: description || null,
          is_source: true,
          version: 0,
        },
      })

      // 3. 查询完整数据返回
      const fullCategory = await tx.categories.findUnique({
        where: { id: categoryId },
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
            where: { is_source: true },
            select: {
              name: true,
              description: true,
            },
          },
          _count: {
            select: {
              topics: true,
            },
          },
        },
      })

      if (!fullCategory) {
        throw new Error("Failed to create category")
      }

      return fullCategory
    })

    const categoryDTO: CategoryDTO = {
      id: String(result.id),
      name: result.translations[0]?.name || "",
      icon: result.icon,
      description: result.translations[0]?.description || null,
      sort: result.sort,
      bgColor: result.bg_color,
      textColor: result.text_color,
      sourceLocale: result.source_locale,
      isDeleted: result.is_deleted,
      createdAt: result.created_at.toISOString(),
      updatedAt: result.updated_at.toISOString(),
      topicCount: result._count.topics,
    }

    return NextResponse.json(categoryDTO, { status: 201 })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

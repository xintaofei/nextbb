import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"
import { getLocale } from "next-intl/server"

type BadgeDTO = {
  id: string
  name: string
  icon: string
  description: string | null
  badgeType: string
  level: number
  sort: number
  bgColor: string | null
  textColor: string | null
  sourceLocale: string
  isEnabled: boolean
  isVisible: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

type BadgeListResult = {
  items: BadgeDTO[]
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

// 验证徽章类型
function validateBadgeType(type: string): boolean {
  const validTypes = ["achievement", "honor", "role", "event", "special"]
  return validTypes.includes(type)
}

// 验证徽章等级
function validateLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= 5
}

// GET - 获取徽章列表
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
    const badgeType = searchParams.get("badgeType")
    const level = searchParams.get("level")
    const enabled = searchParams.get("enabled")
    const deleted = searchParams.get("deleted")
    const sortBy = searchParams.get("sortBy") || "updated_at"

    // 构建查询条件
    type WhereClause = {
      OR?: Array<{
        translations: {
          some: {
            name?: { contains: string; mode: "insensitive" }
            description?: { contains: string; mode: "insensitive" }
          }
        }
      }>
      badge_type?: string
      level?: number
      is_enabled?: boolean
      is_deleted?: boolean
    }

    const where: WhereClause = {}

    if (q.trim().length > 0) {
      where.OR = [
        {
          translations: {
            some: {
              name: { contains: q.trim(), mode: "insensitive" },
            },
          },
        },
        {
          translations: {
            some: {
              description: { contains: q.trim(), mode: "insensitive" },
            },
          },
        },
      ]
    }

    if (badgeType && badgeType !== "all") {
      where.badge_type = badgeType
    }

    if (level) {
      const levelNum = parseInt(level)
      if (!isNaN(levelNum)) {
        where.level = levelNum
      }
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
    let orderBy: Record<string, string> = { updated_at: "desc" }
    if (sortBy === "sort") {
      orderBy = { sort: "desc" }
    } else if (sortBy === "level") {
      orderBy = { level: "desc" }
    }

    // 查询总数
    const total = await prisma.badges.count({ where })

    // 查询当前页数据
    const badges = await prisma.badges.findMany({
      where,
      select: {
        id: true,
        source_locale: true,
        icon: true,
        badge_type: true,
        level: true,
        sort: true,
        bg_color: true,
        text_color: true,
        is_enabled: true,
        is_visible: true,
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
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 转换为 DTO
    const items: BadgeDTO[] = badges.map((b) => {
      // 选择翻译：优先匹配当前 locale，否则取 is_source 为 true 的
      const translation =
        b.translations.find((tr) => tr.locale === locale && !tr.is_source) ||
        b.translations.find((tr) => tr.is_source)

      return {
        id: String(b.id),
        name: translation?.name || "",
        icon: b.icon,
        description: translation?.description || null,
        badgeType: b.badge_type,
        level: b.level,
        sort: b.sort,
        bgColor: b.bg_color,
        textColor: b.text_color,
        sourceLocale: b.source_locale,
        isEnabled: b.is_enabled,
        isVisible: b.is_visible,
        isDeleted: b.is_deleted,
        createdAt: b.created_at.toISOString(),
        updatedAt: b.updated_at.toISOString(),
      }
    })

    const result: BadgeListResult = {
      items,
      page,
      pageSize,
      total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get badges error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - 创建徽章
export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      icon,
      description,
      badgeType,
      level,
      sort,
      bgColor,
      textColor,
      isEnabled,
      isVisible,
    } = body

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

    if (!icon || typeof icon !== "string" || icon.length > 32) {
      return NextResponse.json(
        { error: "Icon is required and must not exceed 32 characters" },
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

    if (!badgeType || !validateBadgeType(badgeType)) {
      return NextResponse.json({ error: "Invalid badge type" }, { status: 400 })
    }

    if (!level || !validateLevel(level)) {
      return NextResponse.json(
        { error: "Level must be between 1-5" },
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

    // 创建徽章和初始翻译
    const result = await prisma.$transaction(async (tx) => {
      const badgeId = generateId()
      const newBadge = await tx.badges.create({
        data: {
          id: badgeId,
          icon,
          badge_type: badgeType,
          level,
          sort,
          bg_color: bgColor || null,
          text_color: textColor || null,
          is_enabled: typeof isEnabled === "boolean" ? isEnabled : true,
          is_visible: typeof isVisible === "boolean" ? isVisible : true,
          is_deleted: false,
          source_locale: sourceLocale,
        },
      })

      const translation = await tx.badge_translations.create({
        data: {
          badge_id: badgeId,
          locale: sourceLocale,
          name,
          description: description || null,
          is_source: true,
          version: 0,
        },
      })

      return { ...newBadge, translation }
    })

    const badgeDTO: BadgeDTO = {
      id: String(result.id),
      name: result.translation.name,
      icon: result.icon,
      description: result.translation.description,
      badgeType: result.badge_type,
      level: result.level,
      sort: result.sort,
      bgColor: result.bg_color,
      textColor: result.text_color,
      sourceLocale: result.source_locale,
      isEnabled: result.is_enabled,
      isVisible: result.is_visible,
      isDeleted: result.is_deleted,
      createdAt: result.created_at.toISOString(),
      updatedAt: result.updated_at.toISOString(),
    }

    return NextResponse.json(badgeDTO, { status: 201 })
  } catch (error) {
    console.error("Create badge error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

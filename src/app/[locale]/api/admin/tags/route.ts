import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"

type TagDTO = {
  id: string
  name: string
  icon: string
  description: string
  sort: number
  bgColor: string | null
  textColor: string | null
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
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "20")
    const q = searchParams.get("q") || ""
    const deleted = searchParams.get("deleted")
    const sortBy = searchParams.get("sortBy") || "updated_at"

    // 构建查询条件
    const where: {
      name?: { contains: string; mode: "insensitive" }
      is_deleted?: boolean
    } = {}

    if (q.trim().length > 0) {
      where.name = { contains: q.trim(), mode: "insensitive" }
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
      // 注意：按使用次数排序需要特殊处理
      orderBy = { updated_at: "desc" }
    }

    // 查询总数
    const total = await prisma.tags.count({ where })

    // 查询当前页数据
    const tags = await prisma.tags.findMany({
      where,
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
        sort: true,
        bg_color: true,
        text_color: true,
        is_deleted: true,
        created_at: true,
        updated_at: true,
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
    const items: TagDTO[] = tags.map((t) => ({
      id: String(t.id),
      name: t.name,
      icon: t.icon,
      description: t.description,
      sort: t.sort,
      bgColor: t.bg_color,
      textColor: t.text_color,
      isDeleted: t.is_deleted,
      createdAt: t.created_at.toISOString(),
      updatedAt: t.updated_at.toISOString(),
      usageCount: t._count.topic_links,
    }))

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

    // 检查名称唯一性
    const existingTag = await prisma.tags.findUnique({
      where: { name },
    })

    if (existingTag) {
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

    // 创建标签
    const tag = await prisma.tags.create({
      data: {
        id: generateId(),
        name,
        icon: icon || "",
        description: description || "",
        sort,
        bg_color: bgColor || null,
        text_color: textColor || null,
        is_deleted: false,
      },
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
        sort: true,
        bg_color: true,
        text_color: true,
        is_deleted: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            topic_links: true,
          },
        },
      },
    })

    const result: TagDTO = {
      id: String(tag.id),
      name: tag.name,
      icon: tag.icon,
      description: tag.description,
      sort: tag.sort,
      bgColor: tag.bg_color,
      textColor: tag.text_color,
      isDeleted: tag.is_deleted,
      createdAt: tag.created_at.toISOString(),
      updatedAt: tag.updated_at.toISOString(),
      usageCount: tag._count.topic_links,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Create tag error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

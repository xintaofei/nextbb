import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"

type CategoryDTO = {
  id: string
  name: string
  icon: string
  description: string | null
  sort: number
  bgColor: string | null
  textColor: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  topicCount: number
}

type CategoryListResult = {
  items: CategoryDTO[]
  page: number
  pageSize: number
  total: number
}

// 权限验证
async function verifyAdmin(userId: bigint) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { is_admin: true, is_deleted: true, status: true },
  })

  if (!user || user.is_deleted || user.status !== 1 || !user.is_admin) {
    return false
  }
  return true
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
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await verifyAdmin(auth.userId)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
            topics: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 转换为 DTO
    const items: CategoryDTO[] = categories.map((c) => ({
      id: String(c.id),
      name: c.name,
      icon: c.icon,
      description: c.description,
      sort: c.sort,
      bgColor: c.bg_color,
      textColor: c.text_color,
      isDeleted: c.is_deleted,
      createdAt: c.created_at.toISOString(),
      updatedAt: c.updated_at.toISOString(),
      topicCount: c._count.topics,
    }))

    // 如果按话题数排序，在内存中排序
    if (sortBy === "topic_count") {
      items.sort((a, b) => b.topicCount - a.topicCount)
    }

    const result: CategoryListResult = {
      items,
      page,
      pageSize,
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
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await verifyAdmin(auth.userId)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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

    if (
      description &&
      (typeof description !== "string" || description.length > 255)
    ) {
      return NextResponse.json(
        { error: "Description must not exceed 255 characters" },
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

    // 创建分类
    const category = await prisma.categories.create({
      data: {
        id: generateId(),
        name,
        icon: icon || "",
        description: description || null,
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
            topics: true,
          },
        },
      },
    })

    const result: CategoryDTO = {
      id: String(category.id),
      name: category.name,
      icon: category.icon,
      description: category.description,
      sort: category.sort,
      bgColor: category.bg_color,
      textColor: category.text_color,
      isDeleted: category.is_deleted,
      createdAt: category.created_at.toISOString(),
      updatedAt: category.updated_at.toISOString(),
      topicCount: category._count.topics,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

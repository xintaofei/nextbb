import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

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

// PATCH - 更新分类
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await verifyAdmin(auth.userId)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const params = await context.params
    const categoryId = BigInt(params.id)

    // 检查分类是否存在
    const existingCategory = await prisma.categories.findUnique({
      where: { id: categoryId },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, icon, description, sort, bgColor, textColor, isDeleted } =
      body

    // 验证字段
    if (name !== undefined) {
      if (typeof name !== "string" || name.length < 1 || name.length > 32) {
        return NextResponse.json(
          { error: "Name must be between 1-32 characters" },
          { status: 400 }
        )
      }
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== "string" || description.length > 255) {
        return NextResponse.json(
          { error: "Description must not exceed 255 characters" },
          { status: 400 }
        )
      }
    }

    if (sort !== undefined) {
      if (typeof sort !== "number" || !Number.isInteger(sort)) {
        return NextResponse.json(
          { error: "Sort must be an integer" },
          { status: 400 }
        )
      }
    }

    if (bgColor !== undefined && !validateColor(bgColor)) {
      return NextResponse.json(
        { error: "Invalid background color format" },
        { status: 400 }
      )
    }

    if (textColor !== undefined && !validateColor(textColor)) {
      return NextResponse.json(
        { error: "Invalid text color format" },
        { status: 400 }
      )
    }

    // 构建更新数据
    const updateData: {
      name?: string
      icon?: string
      description?: string | null
      sort?: number
      bg_color?: string | null
      text_color?: string | null
      is_deleted?: boolean
    } = {}

    if (name !== undefined) updateData.name = name
    if (icon !== undefined) updateData.icon = icon
    if (description !== undefined) updateData.description = description || null
    if (sort !== undefined) updateData.sort = sort
    if (bgColor !== undefined) updateData.bg_color = bgColor || null
    if (textColor !== undefined) updateData.text_color = textColor || null
    if (isDeleted !== undefined) updateData.is_deleted = isDeleted

    // 更新分类
    const category = await prisma.categories.update({
      where: { id: categoryId },
      data: updateData,
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

    return NextResponse.json(result)
  } catch (error) {
    console.error("Update category error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - 软删除分类
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await verifyAdmin(auth.userId)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const params = await context.params
    const categoryId = BigInt(params.id)

    // 检查分类是否存在
    const existingCategory = await prisma.categories.findUnique({
      where: { id: categoryId },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // 软删除分类
    await prisma.categories.update({
      where: { id: categoryId },
      data: {
        is_deleted: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete category error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

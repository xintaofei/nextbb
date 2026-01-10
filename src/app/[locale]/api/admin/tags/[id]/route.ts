import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

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

// PATCH - 更新标签
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
    const tagId = BigInt(params.id)

    // 检查标签是否存在
    const existingTag = await prisma.tags.findUnique({
      where: { id: tagId },
    })

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
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

      // 检查名称唯一性（如果名称有变化）
      if (name !== existingTag.name) {
        const duplicateTag = await prisma.tags.findUnique({
          where: { name },
        })

        if (duplicateTag) {
          return NextResponse.json(
            { error: "Tag name already exists" },
            { status: 400 }
          )
        }
      }
    }

    if (description !== undefined && description !== null) {
      if (typeof description !== "string" || description.length > 256) {
        return NextResponse.json(
          { error: "Description must not exceed 256 characters" },
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
      description?: string
      sort?: number
      bg_color?: string | null
      text_color?: string | null
      is_deleted?: boolean
    } = {}

    if (name !== undefined) updateData.name = name
    if (icon !== undefined) updateData.icon = icon
    if (description !== undefined) updateData.description = description || ""
    if (sort !== undefined) updateData.sort = sort
    if (bgColor !== undefined) updateData.bg_color = bgColor || null
    if (textColor !== undefined) updateData.text_color = textColor || null
    if (isDeleted !== undefined) updateData.is_deleted = isDeleted

    // 更新标签
    const tag = await prisma.tags.update({
      where: { id: tagId },
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

    return NextResponse.json(result)
  } catch (error) {
    console.error("Update tag error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - 软删除标签
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
    const tagId = BigInt(params.id)

    // 检查标签是否存在
    const existingTag = await prisma.tags.findUnique({
      where: { id: tagId },
    })

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // 软删除标签
    await prisma.tags.update({
      where: { id: tagId },
      data: {
        is_deleted: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete tag error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

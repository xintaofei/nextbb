import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

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
  isEnabled: boolean
  isVisible: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
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

// 验证徽章类型
function validateBadgeType(type: string): boolean {
  const validTypes = ["achievement", "honor", "role", "event", "special"]
  return validTypes.includes(type)
}

// 验证徽章等级
function validateLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= 5
}

// PATCH - 更新徽章
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
    const badgeId = BigInt(params.id)

    // 检查徽章是否存在
    const existingBadge = await prisma.badges.findUnique({
      where: { id: badgeId },
    })

    if (!existingBadge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 })
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
      isDeleted,
    } = body

    // 验证字段
    if (name !== undefined) {
      if (typeof name !== "string" || name.length < 1 || name.length > 32) {
        return NextResponse.json(
          { error: "Name must be between 1-32 characters" },
          { status: 400 }
        )
      }
    }

    if (icon !== undefined) {
      if (typeof icon !== "string" || icon.length > 32) {
        return NextResponse.json(
          { error: "Icon must not exceed 32 characters" },
          { status: 400 }
        )
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

    if (badgeType !== undefined && !validateBadgeType(badgeType)) {
      return NextResponse.json({ error: "Invalid badge type" }, { status: 400 })
    }

    if (level !== undefined && !validateLevel(level)) {
      return NextResponse.json(
        { error: "Level must be between 1-5" },
        { status: 400 }
      )
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
    type UpdateData = {
      name?: string
      icon?: string
      description?: string | null
      badge_type?: string
      level?: number
      sort?: number
      bg_color?: string | null
      text_color?: string | null
      is_enabled?: boolean
      is_visible?: boolean
      is_deleted?: boolean
    }

    const updateData: UpdateData = {}

    if (name !== undefined) updateData.name = name
    if (icon !== undefined) updateData.icon = icon
    if (description !== undefined) updateData.description = description || null
    if (badgeType !== undefined) updateData.badge_type = badgeType
    if (level !== undefined) updateData.level = level
    if (sort !== undefined) updateData.sort = sort
    if (bgColor !== undefined) updateData.bg_color = bgColor || null
    if (textColor !== undefined) updateData.text_color = textColor || null
    if (isEnabled !== undefined) updateData.is_enabled = isEnabled
    if (isVisible !== undefined) updateData.is_visible = isVisible
    if (isDeleted !== undefined) updateData.is_deleted = isDeleted

    // 更新徽章
    const badge = await prisma.badges.update({
      where: { id: badgeId },
      data: updateData,
      select: {
        id: true,
        name: true,
        icon: true,
        description: true,
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
      },
    })

    const result: BadgeDTO = {
      id: String(badge.id),
      name: badge.name,
      icon: badge.icon,
      description: badge.description,
      badgeType: badge.badge_type,
      level: badge.level,
      sort: badge.sort,
      bgColor: badge.bg_color,
      textColor: badge.text_color,
      isEnabled: badge.is_enabled,
      isVisible: badge.is_visible,
      isDeleted: badge.is_deleted,
      createdAt: badge.created_at.toISOString(),
      updatedAt: badge.updated_at.toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Update badge error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

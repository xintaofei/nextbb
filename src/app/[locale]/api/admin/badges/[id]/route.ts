import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createTranslationTasks } from "@/lib/services/translation-task"
import { TranslationEntityType } from "@prisma/client"

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
  darkBgColor: string | null
  darkTextColor: string | null
  sourceLocale: string
  isEnabled: boolean
  isVisible: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
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
      darkBgColor,
      darkTextColor,
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

    if (darkBgColor !== undefined && !validateColor(darkBgColor)) {
      return NextResponse.json(
        { error: "Invalid dark background color format" },
        { status: 400 }
      )
    }

    if (darkTextColor !== undefined && !validateColor(darkTextColor)) {
      return NextResponse.json(
        { error: "Invalid dark text color format" },
        { status: 400 }
      )
    }

    // 构建更新数据
    const badgeUpdateData: {
      icon?: string
      badge_type?: string
      level?: number
      sort?: number
      bg_color?: string | null
      text_color?: string | null
      dark_bg_color?: string | null
      dark_text_color?: string | null
      is_enabled?: boolean
      is_visible?: boolean
      is_deleted?: boolean
    } = {}

    if (icon !== undefined) badgeUpdateData.icon = icon
    if (badgeType !== undefined) badgeUpdateData.badge_type = badgeType
    if (level !== undefined) badgeUpdateData.level = level
    if (sort !== undefined) badgeUpdateData.sort = sort
    if (bgColor !== undefined) badgeUpdateData.bg_color = bgColor || null
    if (textColor !== undefined) badgeUpdateData.text_color = textColor || null
    if (darkBgColor !== undefined)
      badgeUpdateData.dark_bg_color = darkBgColor || null
    if (darkTextColor !== undefined)
      badgeUpdateData.dark_text_color = darkTextColor || null
    if (isEnabled !== undefined) badgeUpdateData.is_enabled = isEnabled
    if (isVisible !== undefined) badgeUpdateData.is_visible = isVisible
    if (isDeleted !== undefined) badgeUpdateData.is_deleted = isDeleted

    // 使用事务更新
    let newVersion = 0
    let hasActualTranslationChange = false
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新主表字段
      if (Object.keys(badgeUpdateData).length > 0) {
        await tx.badges.update({
          where: { id: badgeId },
          data: badgeUpdateData,
        })
      }

      // 2. 检查是否有 name 或 description 需要更新
      const hasTranslationFieldsInRequest =
        name !== undefined || description !== undefined

      if (hasTranslationFieldsInRequest) {
        // 获取当前源语言翻译
        const sourceTranslation = await tx.badge_translations.findFirst({
          where: {
            badge_id: badgeId,
            is_source: true,
          },
        })

        if (sourceTranslation) {
          // 检查是否真的有变化
          const nameChanged =
            name !== undefined && name !== sourceTranslation.name
          const descriptionChanged =
            description !== undefined &&
            (description || null) !== sourceTranslation.description

          hasActualTranslationChange = nameChanged || descriptionChanged

          // 只有在确实有变化时才更新翻译表
          if (hasActualTranslationChange) {
            // 构建翻译更新数据
            newVersion = sourceTranslation.version + 1
            const translationUpdateData: {
              name?: string
              description?: string | null
              version: number
            } = {
              version: newVersion, // 递增版本号
            }

            if (nameChanged) translationUpdateData.name = name
            if (descriptionChanged) {
              translationUpdateData.description = description || null
            }

            await tx.badge_translations.update({
              where: {
                badge_id_locale: {
                  badge_id: badgeId,
                  locale: sourceTranslation.locale,
                },
              },
              data: translationUpdateData,
            })
          }
        }
      }

      // 3. 查询完整数据返回
      return await tx.badges.findUnique({
        where: { id: badgeId },
        select: {
          id: true,
          source_locale: true,
          icon: true,
          badge_type: true,
          level: true,
          sort: true,
          bg_color: true,
          text_color: true,
          dark_bg_color: true,
          dark_text_color: true,
          is_enabled: true,
          is_visible: true,
          is_deleted: true,
          created_at: true,
          updated_at: true,
          translations: {
            where: { is_source: true },
            select: {
              name: true,
              description: true,
              version: true,
            },
            take: 1,
          },
        },
      })
    })

    if (!result) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 })
    }

    // 只有在确实有翻译字段变化时才创建翻译任务
    if (hasActualTranslationChange && newVersion > 0) {
      await createTranslationTasks(
        TranslationEntityType.BADGE,
        result.id,
        result.source_locale,
        newVersion
      )
    }

    const translation = result.translations[0]
    const badgeDTO: BadgeDTO = {
      id: String(result.id),
      name: translation?.name || "",
      icon: result.icon,
      description: translation?.description || null,
      badgeType: result.badge_type,
      level: result.level,
      sort: result.sort,
      bgColor: result.bg_color,
      textColor: result.text_color,
      darkBgColor: result.dark_bg_color,
      darkTextColor: result.dark_text_color,
      sourceLocale: result.source_locale,
      isEnabled: result.is_enabled,
      isVisible: result.is_visible,
      isDeleted: result.is_deleted,
      createdAt: result.created_at.toISOString(),
      updatedAt: result.updated_at.toISOString(),
    }

    return NextResponse.json(badgeDTO)
  } catch (error) {
    console.error("Update badge error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

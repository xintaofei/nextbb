import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createTranslationTasks } from "@/lib/services/translation-task"
import { TranslationEntityType } from "@prisma/client"

type TagDTO = {
  id: string
  name: string
  icon: string
  description: string | null
  sort: number
  bgColor: string | null
  textColor: string | null
  darkBgColor: string | null
  darkTextColor: string | null
  sourceLocale: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  usageCount: number
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
    const {
      name,
      icon,
      description,
      sort,
      bgColor,
      textColor,
      darkBgColor,
      darkTextColor,
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
    const hasTranslationUpdate = name !== undefined || description !== undefined
    const tagUpdateData: {
      icon?: string
      sort?: number
      bg_color?: string | null
      text_color?: string | null
      dark_bg_color?: string | null
      dark_text_color?: string | null
      is_deleted?: boolean
    } = {}

    if (icon !== undefined) tagUpdateData.icon = icon
    if (sort !== undefined) tagUpdateData.sort = sort
    if (bgColor !== undefined) tagUpdateData.bg_color = bgColor || null
    if (textColor !== undefined) tagUpdateData.text_color = textColor || null
    if (darkBgColor !== undefined)
      tagUpdateData.dark_bg_color = darkBgColor || null
    if (darkTextColor !== undefined)
      tagUpdateData.dark_text_color = darkTextColor || null
    if (isDeleted !== undefined) tagUpdateData.is_deleted = isDeleted

    // 使用事务更新
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新主表字段
      if (Object.keys(tagUpdateData).length > 0) {
        await tx.tags.update({
          where: { id: tagId },
          data: tagUpdateData,
        })
      }

      // 2. 如果有 name 或 description 更新,更新翻译表
      if (hasTranslationUpdate) {
        // 获取当前源语言翻译
        const sourceTranslation = await tx.tag_translations.findFirst({
          where: {
            tag_id: tagId,
            is_source: true,
          },
        })

        if (sourceTranslation) {
          // 构建翻译更新数据
          const translationUpdateData: {
            name?: string
            description?: string | null
            version: number
          } = {
            version: sourceTranslation.version + 1, // 递增版本号
          }

          if (name !== undefined) translationUpdateData.name = name
          if (description !== undefined) {
            translationUpdateData.description = description || null
          }

          await tx.tag_translations.update({
            where: {
              tag_id_locale: {
                tag_id: tagId,
                locale: sourceTranslation.locale,
              },
            },
            data: translationUpdateData,
          })
        }
      }

      // 3. 查询完整数据返回
      return await tx.tags.findUnique({
        where: { id: tagId },
        select: {
          id: true,
          source_locale: true,
          icon: true,
          sort: true,
          bg_color: true,
          text_color: true,
          dark_bg_color: true,
          dark_text_color: true,
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
          _count: {
            select: {
              topic_links: true,
            },
          },
        },
      })
    })

    if (!result) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // 如果更新了源语言翻译，创建翻译任务
    if (hasTranslationUpdate && result.translations[0]) {
      await createTranslationTasks(
        TranslationEntityType.TAG,
        result.id,
        result.source_locale,
        result.translations[0].version
      )
    }

    const translation = result.translations[0]
    const tagDTO: TagDTO = {
      id: String(result.id),
      name: translation?.name || "",
      icon: result.icon,
      description: translation?.description || null,
      sort: result.sort,
      bgColor: result.bg_color,
      textColor: result.text_color,
      darkBgColor: result.dark_bg_color,
      darkTextColor: result.dark_text_color,
      sourceLocale: result.source_locale,
      isDeleted: result.is_deleted,
      createdAt: result.created_at.toISOString(),
      updatedAt: result.updated_at.toISOString(),
      usageCount: result._count.topic_links,
    }

    return NextResponse.json(tagDTO)
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

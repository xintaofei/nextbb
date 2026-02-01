import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createTranslationTasks } from "@/lib/services/translation-task"
import { TranslationEntityType } from "@prisma/client"

type ExpressionGroupDTO = {
  id: string
  code: string
  name: string
  iconId: string | null
  sort: number
  isEnabled: boolean
  isDeleted: boolean
  sourceLocale: string
  expressionCount: number
  createdAt: string
  updatedAt: string
}

// PATCH - 更新表情分组
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const groupId = BigInt(params.id)

    // 检查分组是否存在
    const existingGroup = await prisma.expression_groups.findUnique({
      where: { id: groupId },
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Expression group not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, iconId, sort, isEnabled, isDeleted } = body

    // 验证字段
    if (name !== undefined) {
      if (typeof name !== "string" || name.length < 1 || name.length > 32) {
        return NextResponse.json(
          { error: "Name must be between 1-32 characters" },
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

    // 构建更新数据
    const hasTranslationUpdate = name !== undefined
    const groupUpdateData: {
      icon_id?: bigint | null
      sort?: number
      is_enabled?: boolean
      is_deleted?: boolean
    } = {}

    if (iconId !== undefined)
      groupUpdateData.icon_id = iconId ? BigInt(iconId) : null
    if (sort !== undefined) groupUpdateData.sort = sort
    if (isEnabled !== undefined) groupUpdateData.is_enabled = isEnabled
    if (isDeleted !== undefined) groupUpdateData.is_deleted = isDeleted

    // 使用事务更新
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新主表字段
      if (Object.keys(groupUpdateData).length > 0) {
        await tx.expression_groups.update({
          where: { id: groupId },
          data: groupUpdateData,
        })
      }

      // 2. 如果有 name 更新,更新翻译表
      if (hasTranslationUpdate) {
        // 获取当前源语言翻译
        const sourceTranslation =
          await tx.expression_group_translations.findFirst({
            where: {
              group_id: groupId,
              is_source: true,
            },
          })

        if (sourceTranslation) {
          // 构建翻译更新数据
          const translationUpdateData: {
            name?: string
            version: number
          } = {
            version: sourceTranslation.version + 1, // 递增版本号
          }

          if (name !== undefined) translationUpdateData.name = name

          await tx.expression_group_translations.update({
            where: {
              group_id_locale: {
                group_id: groupId,
                locale: sourceTranslation.locale,
              },
            },
            data: translationUpdateData,
          })
        }
      }

      // 3. 查询完整数据返回
      return await tx.expression_groups.findUnique({
        where: { id: groupId },
        select: {
          id: true,
          code: true,
          icon_id: true,
          sort: true,
          is_enabled: true,
          is_deleted: true,
          source_locale: true,
          created_at: true,
          updated_at: true,
          translations: {
            where: { is_source: true },
            select: {
              name: true,
              version: true,
            },
            take: 1,
          },
          _count: {
            select: {
              expressions: {
                where: {
                  is_deleted: false,
                },
              },
            },
          },
        },
      })
    })

    if (!result) {
      return NextResponse.json(
        { error: "Expression group not found" },
        { status: 404 }
      )
    }

    // 如果更新了源语言翻译，创建翻译任务
    if (hasTranslationUpdate && result.translations[0]) {
      await createTranslationTasks(
        TranslationEntityType.EXPRESSION_GROUP,
        result.id,
        result.source_locale,
        result.translations[0].version
      )
    }

    const translation = result.translations[0]
    const groupDTO: ExpressionGroupDTO = {
      id: String(result.id),
      code: result.code,
      name: translation?.name || "",
      iconId: result.icon_id ? String(result.icon_id) : null,
      sort: result.sort,
      isEnabled: result.is_enabled,
      isDeleted: result.is_deleted,
      sourceLocale: result.source_locale,
      expressionCount: result._count.expressions,
      createdAt: result.created_at.toISOString(),
      updatedAt: result.updated_at.toISOString(),
    }

    return NextResponse.json(groupDTO)
  } catch (error) {
    console.error("Update expression group error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - 软删除表情分组
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const groupId = BigInt(params.id)

    // 检查分组是否存在
    const existingGroup = await prisma.expression_groups.findUnique({
      where: { id: groupId },
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: "Expression group not found" },
        { status: 404 }
      )
    }

    // 软删除分组
    await prisma.expression_groups.update({
      where: { id: groupId },
      data: {
        is_deleted: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete expression group error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createTranslationTasks } from "@/lib/services/translation-task"
import { TranslationEntityType } from "@prisma/client"

type ExpressionDTO = {
  id: string
  groupId: string
  groupName: string
  code: string
  name: string
  type: "IMAGE" | "TEXT"
  imagePath: string | null
  imageUrl: string | null
  textContent: string | null
  width: number | null
  height: number | null
  sort: number
  isEnabled: boolean
  isDeleted: boolean
  isAnimated: boolean
  sourceLocale: string
  createdAt: string
  updatedAt: string
}

// PATCH - 更新表情
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const expressionId = BigInt(params.id)

    // 检查表情是否存在
    const existingExpression = await prisma.expressions.findUnique({
      where: { id: expressionId },
    })

    if (!existingExpression) {
      return NextResponse.json(
        { error: "Expression not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      name,
      imagePath,
      textContent,
      width,
      height,
      sort,
      isEnabled,
      isDeleted,
      isAnimated,
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
    const expressionUpdateData: {
      image_path?: string | null
      text_content?: string | null
      width?: number | null
      height?: number | null
      sort?: number
      is_enabled?: boolean
      is_deleted?: boolean
      is_animated?: boolean
    } = {}

    if (imagePath !== undefined)
      expressionUpdateData.image_path = imagePath || null
    if (textContent !== undefined)
      expressionUpdateData.text_content = textContent || null
    if (width !== undefined) expressionUpdateData.width = width
    if (height !== undefined) expressionUpdateData.height = height
    if (sort !== undefined) expressionUpdateData.sort = sort
    if (isEnabled !== undefined) expressionUpdateData.is_enabled = isEnabled
    if (isDeleted !== undefined) expressionUpdateData.is_deleted = isDeleted
    if (isAnimated !== undefined) expressionUpdateData.is_animated = isAnimated

    // 使用事务更新
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新主表字段
      if (Object.keys(expressionUpdateData).length > 0) {
        await tx.expressions.update({
          where: { id: expressionId },
          data: expressionUpdateData,
        })
      }

      // 2. 如果有 name 更新,更新翻译表
      if (hasTranslationUpdate) {
        // 获取当前源语言翻译
        const sourceTranslation = await tx.expression_translations.findFirst({
          where: {
            expression_id: expressionId,
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

          await tx.expression_translations.update({
            where: {
              expression_id_locale: {
                expression_id: expressionId,
                locale: sourceTranslation.locale,
              },
            },
            data: translationUpdateData,
          })
        }
      }

      // 3. 查询完整数据返回
      return await tx.expressions.findUnique({
        where: { id: expressionId },
        select: {
          id: true,
          group_id: true,
          code: true,
          type: true,
          image_path: true,
          text_content: true,
          width: true,
          height: true,
          sort: true,
          is_enabled: true,
          is_deleted: true,
          is_animated: true,
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
        },
      })
    })

    if (!result) {
      return NextResponse.json(
        { error: "Expression not found" },
        { status: 404 }
      )
    }

    // 如果更新了源语言翻译，创建翻译任务
    if (hasTranslationUpdate && result.translations[0]) {
      await createTranslationTasks(
        TranslationEntityType.EXPRESSION,
        result.id,
        result.source_locale,
        result.translations[0].version
      )
    }

    // 直接使用 image_path 作为 imageUrl（已存储完整 URL）
    const imageUrl = result.image_path || null

    const translation = result.translations[0]
    const expressionDTO: ExpressionDTO = {
      id: String(result.id),
      groupId: String(result.group_id),
      groupName: "",
      code: result.code,
      name: translation?.name || "",
      type: result.type,
      imagePath: result.image_path,
      imageUrl,
      textContent: result.text_content,
      width: result.width,
      height: result.height,
      sort: result.sort,
      isEnabled: result.is_enabled,
      isDeleted: result.is_deleted,
      isAnimated: result.is_animated ?? false,
      sourceLocale: result.source_locale,
      createdAt: result.created_at.toISOString(),
      updatedAt: result.updated_at.toISOString(),
    }

    return NextResponse.json(expressionDTO)
  } catch (error) {
    console.error("Update expression error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - 软删除表情
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const expressionId = BigInt(params.id)

    // 检查表情是否存在
    const existingExpression = await prisma.expressions.findUnique({
      where: { id: expressionId },
    })

    if (!existingExpression) {
      return NextResponse.json(
        { error: "Expression not found" },
        { status: 404 }
      )
    }

    // 软删除表情
    await prisma.expressions.update({
      where: { id: expressionId },
      data: {
        is_deleted: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete expression error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

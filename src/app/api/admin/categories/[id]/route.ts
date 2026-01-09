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
  sourceLocale: string
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
    // 区分：name/description 更新翻译表，其他字段更新主表
    const hasTranslationUpdate = name !== undefined || description !== undefined
    const categoryUpdateData: {
      icon?: string
      sort?: number
      bg_color?: string | null
      text_color?: string | null
      is_deleted?: boolean
    } = {}

    if (icon !== undefined) categoryUpdateData.icon = icon
    if (sort !== undefined) categoryUpdateData.sort = sort
    if (bgColor !== undefined) categoryUpdateData.bg_color = bgColor || null
    if (textColor !== undefined)
      categoryUpdateData.text_color = textColor || null
    if (isDeleted !== undefined) categoryUpdateData.is_deleted = isDeleted

    // 使用事务更新
    const result = await prisma.$transaction(async (tx) => {
      // 1. 更新主表字段
      if (Object.keys(categoryUpdateData).length > 0) {
        await tx.categories.update({
          where: { id: categoryId },
          data: categoryUpdateData,
        })
      }

      // 2. 如果有 name 或 description 更新，更新翻译表
      if (hasTranslationUpdate) {
        // 获取当前源语言翻译
        const sourceTranslation = await tx.categoryTranslations.findFirst({
          where: {
            category_id: categoryId,
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

          await tx.categoryTranslations.update({
            where: {
              category_id_locale: {
                category_id: categoryId,
                locale: sourceTranslation.locale,
              },
            },
            data: translationUpdateData,
          })
        }
      }

      // 3. 查询完整数据返回
      return await tx.categories.findUnique({
        where: { id: categoryId },
        select: {
          id: true,
          source_locale: true,
          icon: true,
          sort: true,
          bg_color: true,
          text_color: true,
          is_deleted: true,
          created_at: true,
          updated_at: true,
          translations: {
            where: { is_source: true },
            select: {
              name: true,
              description: true,
            },
            take: 1,
          },
          _count: {
            select: {
              topics: true,
            },
          },
        },
      })
    })

    if (!result) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const translation = result.translations[0]
    const categoryDTO: CategoryDTO = {
      id: String(result.id),
      name: translation?.name || "",
      icon: result.icon,
      description: translation?.description || null,
      sort: result.sort,
      bgColor: result.bg_color,
      textColor: result.text_color,
      sourceLocale: result.source_locale,
      isDeleted: result.is_deleted,
      createdAt: result.created_at.toISOString(),
      updatedAt: result.updated_at.toISOString(),
      topicCount: result._count.topics,
    }

    return NextResponse.json(categoryDTO)
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

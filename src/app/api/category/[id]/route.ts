import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLocale } from "next-intl/server"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"

type CategoryDTO = {
  id: string
  name: string
  icon?: string
  description: string | null
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  let categoryId: bigint
  try {
    categoryId = BigInt(id)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  // 获取当前请求的语言
  const locale = await getLocale()

  const category = await prisma.categories.findFirst({
    where: { id: categoryId, is_deleted: false },
    select: {
      id: true,
      icon: true,
      translations: getTranslationsQuery(locale, {
        name: true,
        description: true,
      }),
    },
  })

  if (!category) {
    return NextResponse.json(null, { status: 404 })
  }

  // 使用通用工具函数获取翻译字段
  const fields = getTranslationFields(category.translations, locale, {
    name: "",
    description: null,
  })

  const result: CategoryDTO = {
    id: String(category.id),
    name: fields.name,
    icon: category.icon ?? undefined,
    description: fields.description,
  }

  return NextResponse.json(result)
}

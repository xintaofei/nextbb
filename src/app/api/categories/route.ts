import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLocale } from "next-intl/server"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"

type CategoryDTO = {
  id: string
  name: string
  icon?: string
  description: string | null
  sort: number
}

export async function GET() {
  // 获取当前请求的语言
  const locale = await getLocale()

  const categories = await prisma.categories.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      icon: true,
      sort: true,
      source_locale: true,
      translations: getTranslationsQuery(locale, {
        name: true,
        description: true,
      }),
    },
    orderBy: [{ sort: "asc" }, { updated_at: "desc" }],
  })

  const result: CategoryDTO[] = categories.map((c) => {
    // 使用通用工具函数获取翻译字段
    const fields = getTranslationFields(c.translations, locale, {
      name: "",
      description: null,
    })

    return {
      id: String(c.id),
      name: fields.name,
      icon: c.icon ?? undefined,
      description: fields.description,
      sort: c.sort,
    }
  })

  return NextResponse.json(result)
}

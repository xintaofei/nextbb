import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLocaleFromRequest } from "@/lib/locale"

type CategoryDTO = {
  id: string
  name: string
  icon?: string
  description: string | null
  sort: number
}

export async function GET(request: Request) {
  // 获取当前请求的语言
  const locale = getLocaleFromRequest(request)

  const categories = await prisma.categories.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      icon: true,
      sort: true,
      source_locale: true,
      translations: {
        where: {
          OR: [{ locale, is_source: false }, { is_source: true }],
        },
        select: {
          locale: true,
          name: true,
          description: true,
          is_source: true,
        },
        take: 2,
      },
    },
    orderBy: [{ sort: "asc" }, { updated_at: "desc" }],
  })

  const result: CategoryDTO[] = categories.map((c) => {
    // 查找当前语言翻译，如果没有则回退到源语言
    const currentLocaleTranslation = c.translations.find(
      (t) => t.locale === locale && !t.is_source
    )
    const sourceTranslation = c.translations.find((t) => t.is_source)
    const translation = currentLocaleTranslation || sourceTranslation

    return {
      id: String(c.id),
      name: translation?.name || "",
      icon: c.icon ?? undefined,
      description: translation?.description ?? null,
      sort: c.sort,
    }
  })

  return NextResponse.json(result)
}

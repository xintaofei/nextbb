import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLocaleFromRequest } from "@/lib/locale"

type CategoryDTO = {
  id: string
  name: string
  icon?: string
  description: string | null
}

export async function GET(
  req: Request,
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
  const locale = getLocaleFromRequest(req)

  const category = await prisma.categories.findFirst({
    where: { id: categoryId, is_deleted: false },
    select: {
      id: true,
      icon: true,
      translations: {
        where: { OR: [{ locale, is_source: false }, { is_source: true }] },
        select: {
          locale: true,
          name: true,
          description: true,
          is_source: true,
        },
        take: 2,
      },
    },
  })

  if (!category) {
    return NextResponse.json(null, { status: 404 })
  }

  // 查找当前语言翻译，如果没有则回退到源语言
  const translation =
    category.translations.find((t) => t.locale === locale && !t.is_source) ||
    category.translations.find((t) => t.is_source)

  const result: CategoryDTO = {
    id: String(category.id),
    name: translation?.name || "",
    icon: category.icon ?? undefined,
    description: translation?.description ?? null,
  }

  return NextResponse.json(result)
}

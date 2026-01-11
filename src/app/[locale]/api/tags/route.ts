import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getLocale } from "next-intl/server"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"

type TagDTO = {
  id: string
  name: string
  icon: string
  description: string | null
  sort: number
  bgColor?: string | null
  textColor?: string | null
}

export async function GET() {
  const locale = await getLocale()
  const tags = await prisma.tags.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      icon: true,
      sort: true,
      bg_color: true,
      text_color: true,
      translations: getTranslationsQuery(locale, {
        name: true,
        description: true,
      }),
    },
    orderBy: [{ sort: "desc" }, { id: "asc" }],
  })

  type TagRow = {
    id: bigint
    icon: string
    sort: number
    bg_color: string | null
    text_color: string | null
    translations: {
      locale: string
      name: string
      description: string | null
      is_source: boolean
    }[]
  }

  const result: TagDTO[] = (tags as unknown as TagRow[]).map((t: TagRow) => {
    const fields = getTranslationFields(t.translations, locale, {
      name: "",
      description: null as string | null,
    })

    return {
      id: String(t.id),
      name: fields.name,
      icon: t.icon,
      description: fields.description,
      sort: t.sort,
      bgColor: t.bg_color,
      textColor: t.text_color,
    }
  })

  return NextResponse.json(result)
}

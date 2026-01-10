import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type TagDTO = {
  id: string
  name: string
  icon: string
  description: string
  sort: number
  bgColor?: string | null
  textColor?: string | null
}

export async function GET() {
  const tags = await prisma.tags.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      name: true,
      icon: true,
      description: true,
      sort: true,
      bg_color: true,
      text_color: true,
    },
    orderBy: [{ sort: "desc" }, { id: "asc" }],
  })

  type TagRow = {
    id: bigint
    name: string
    icon: string
    description: string
    sort: number
    bg_color: string | null
    text_color: string | null
  }

  const result: TagDTO[] = tags.map((t: TagRow) => ({
    id: String(t.id),
    name: t.name,
    icon: t.icon,
    description: t.description,
    sort: t.sort,
    bgColor: t.bg_color,
    textColor: t.text_color,
  }))

  return NextResponse.json(result)
}

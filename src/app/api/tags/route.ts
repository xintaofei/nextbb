import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type TagDTO = {
  id: string
  name: string
  icon: string
  description: string
  sort: number
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
    },
    orderBy: [{ sort: "desc" }, { id: "asc" }],
  })

  type TagRow = {
    id: bigint
    name: string
    icon: string
    description: string
    sort: number
  }

  const result: TagDTO[] = tags.map((t: TagRow) => ({
    id: String(t.id),
    name: t.name,
    icon: t.icon,
    description: t.description,
    sort: t.sort,
  }))

  return NextResponse.json(result)
}

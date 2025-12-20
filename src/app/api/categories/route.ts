import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type CategoryDTO = {
  id: string
  name: string
  icon?: string
  description: string | null
  sort: number
}

export async function GET() {
  const categories = await prisma.categories.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      name: true,
      icon: true,
      description: true,
      sort: true,
    },
    orderBy: [{ sort: "asc" }, { updated_at: "desc" }],
  })

  type CategoryRow = {
    id: bigint
    name: string
    icon: string
    description: string | null
    sort: number
  }

  const result: CategoryDTO[] = categories.map((c: CategoryRow) => ({
    id: String(c.id),
    name: c.name,
    icon: c.icon ?? undefined,
    description: c.description ?? null,
    sort: c.sort,
  }))

  return NextResponse.json(result)
}

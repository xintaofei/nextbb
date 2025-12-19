import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

  const category = await prisma.categories.findFirst({
    where: { id: categoryId, is_deleted: false },
    select: { id: true, name: true, icon: true, description: true },
  })

  if (!category) {
    return NextResponse.json(null, { status: 404 })
  }

  const result: CategoryDTO = {
    id: String(category.id),
    name: category.name,
    icon: category.icon ?? undefined,
    description: category.description ?? null,
  }

  return NextResponse.json(result)
}

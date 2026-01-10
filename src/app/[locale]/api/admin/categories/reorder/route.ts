import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

type ReorderItem = {
  id: string
  sort: number
}

type ReorderRequest = {
  items: ReorderItem[]
}

async function verifyAdmin(userId: bigint): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { is_admin: true, is_deleted: true, status: true },
  })

  if (!user || user.is_deleted || user.status !== 1 || !user.is_admin) {
    return false
  }
  return true
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const isAdmin = await verifyAdmin(auth.userId)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { items }: ReorderRequest = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items array is required and must not be empty" },
        { status: 400 }
      )
    }

    for (const item of items) {
      if (!item.id || typeof item.id !== "string") {
        return NextResponse.json({ error: "Invalid item id" }, { status: 400 })
      }
      if (typeof item.sort !== "number" || !Number.isInteger(item.sort)) {
        return NextResponse.json(
          { error: "Invalid item sort value" },
          { status: 400 }
        )
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.categories.update({
          where: { id: BigInt(item.id) },
          data: { sort: item.sort },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder categories error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

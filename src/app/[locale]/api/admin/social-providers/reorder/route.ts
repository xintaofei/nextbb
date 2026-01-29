import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { invalidateSocialProviderCache } from "@/lib/services/social-provider-service"
import { invalidateAuthOptionsCache } from "@/lib/auth-options-cache"

type ReorderItem = {
  id: string
  sort: number
}

type ReorderRequest = {
  items: ReorderItem[]
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
        await tx.social_providers.update({
          where: { id: BigInt(item.id) },
          data: { sort: item.sort },
        })
      }
    })

    await invalidateSocialProviderCache()
    invalidateAuthOptionsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder social providers error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

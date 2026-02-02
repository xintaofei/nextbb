import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/admin/storage-providers/reorder
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      items: Array<{ id: string; sort: number }>
    }

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    await prisma.$transaction(
      body.items.map((item) =>
        prisma.storage_providers.update({
          where: { id: BigInt(item.id) },
          data: { sort: item.sort },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to reorder storage providers:", error)
    return NextResponse.json(
      { error: "Failed to reorder storage providers" },
      { status: 500 }
    )
  }
}

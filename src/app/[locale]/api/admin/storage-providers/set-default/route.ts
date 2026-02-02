import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/admin/storage-providers/set-default
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { id: string }

    if (!body.id) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      )
    }

    const providerId = BigInt(body.id)

    const provider = await prisma.storage_providers.findUnique({
      where: { id: providerId },
    })

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    if (!provider.is_active) {
      return NextResponse.json(
        { error: "Cannot set inactive provider as default" },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.storage_providers.updateMany({
        where: { is_default: true },
        data: { is_default: false },
      }),
      prisma.storage_providers.update({
        where: { id: providerId },
        data: { is_default: true },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to set default storage provider:", error)
    return NextResponse.json(
      { error: "Failed to set default storage provider" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { getTaxonomyStats } from "@/services/admin"

export async function GET() {
  try {
    const stats = await getTaxonomyStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch taxonomy stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

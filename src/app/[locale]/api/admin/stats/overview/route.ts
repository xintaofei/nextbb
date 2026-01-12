import { NextResponse } from "next/server"
import { getOverviewStats } from "@/services/admin"

export async function GET() {
  try {
    const stats = await getOverviewStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch overview stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

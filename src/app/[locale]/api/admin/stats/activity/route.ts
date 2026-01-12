import { NextResponse } from "next/server"
import { getActivityStats } from "@/services/admin"

export async function GET() {
  try {
    const stats = await getActivityStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch activity stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

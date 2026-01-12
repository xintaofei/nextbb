import { NextResponse } from "next/server"
import { getTrendStats } from "@/services/admin"

export async function GET() {
  try {
    const stats = await getTrendStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch trend stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getEnabledExpressions } from "@/lib/services/expression-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  try {
    const { locale } = await params
    const expressions = await getEnabledExpressions(locale)
    return NextResponse.json(expressions)
  } catch (error) {
    console.error("[Expressions API] Failed to fetch expressions:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

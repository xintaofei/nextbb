import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * 检查表情代码在指定分组内是否已存在
 * GET /api/admin/expressions/check-code?groupId={groupId}&code={code}&excludeId={excludeId}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const groupId = searchParams.get("groupId")
    const code = searchParams.get("code")
    const excludeId = searchParams.get("excludeId") // 编辑时排除自己

    if (!groupId || !code) {
      return NextResponse.json(
        { error: "groupId and code are required" },
        { status: 400 }
      )
    }

    const groupIdBigInt = BigInt(groupId)

    // 检查是否存在相同 code 的表情
    const existingExpression = await prisma.expressions.findFirst({
      where: {
        group_id: groupIdBigInt,
        code,
        id: excludeId ? { not: BigInt(excludeId) } : undefined,
        is_deleted: false,
      },
      select: {
        id: true,
        code: true,
      },
    })

    return NextResponse.json({
      exists: !!existingExpression,
      expression: existingExpression
        ? {
            id: String(existingExpression.id),
            code: existingExpression.code,
          }
        : null,
    })
  } catch (error) {
    console.error("Check expression code error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

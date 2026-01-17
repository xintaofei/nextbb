import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { TranslationTaskStatus, Prisma } from "@prisma/client"

interface RouteParams {
  params: Promise<{ id: string }>
}

interface PatchBody {
  action: string
}

// DELETE - 删除任务
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // 验证 ID 格式
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    try {
      await prisma.translation_tasks.delete({
        where: { id: BigInt(id) },
      })
    } catch (error) {
      // P2025: Record to delete does not exist
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete translation task error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - 更新任务 (主要是重试)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // 验证 ID 格式
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    let body: PatchBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { action } = body

    if (action === "retry") {
      try {
        await prisma.translation_tasks.update({
          where: { id: BigInt(id) },
          data: {
            status: TranslationTaskStatus.PENDING,
            retry_count: 0,
            error_message: null,
            started_at: null,
            completed_at: null,
          },
        })
      } catch (error) {
        // P2025: Record to update does not exist
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        ) {
          return NextResponse.json({ error: "Task not found" }, { status: 404 })
        }
        throw error
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Update translation task error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

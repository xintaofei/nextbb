import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TranslationTaskStatus } from "@prisma/client"
import { getTranslations } from "next-intl/server"

interface BatchBody {
  ids: string[]
  action?: "retry" | "cancel"
}

export async function DELETE(request: NextRequest) {
  try {
    const t = await getTranslations("AdminTranslationTasks.error")

    const body: BatchBody = await request.json()
    const { ids } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: t("invalidIds") }, { status: 400 })
    }

    await prisma.translation_tasks.deleteMany({
      where: {
        id: { in: ids.map((id) => BigInt(id)) },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Batch delete translation tasks error:", error)
    const t = await getTranslations("AdminTranslationTasks.error")
    return NextResponse.json(
      { error: t("internalServerError") },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const t = await getTranslations("AdminTranslationTasks.error")

    const body: BatchBody = await request.json()
    const { ids, action } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: t("invalidIds") }, { status: 400 })
    }

    if (action === "retry") {
      await prisma.translation_tasks.updateMany({
        where: {
          id: { in: ids.map((id) => BigInt(id)) },
          status: {
            notIn: [
              TranslationTaskStatus.PENDING,
              TranslationTaskStatus.PROCESSING,
            ],
          },
        },
        data: {
          status: TranslationTaskStatus.PENDING,
          retry_count: 0,
          error_message: null,
          started_at: null,
          completed_at: null,
        },
      })
      return NextResponse.json({ success: true })
    }

    if (action === "cancel") {
      await prisma.translation_tasks.updateMany({
        where: {
          id: { in: ids.map((id) => BigInt(id)) },
          status: TranslationTaskStatus.PENDING,
        },
        data: {
          status: TranslationTaskStatus.CANCELLED,
        },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: t("invalidAction") }, { status: 400 })
  } catch (error) {
    console.error("Batch update translation tasks error:", error)
    const t = await getTranslations("AdminTranslationTasks.error")
    return NextResponse.json(
      { error: t("internalServerError") },
      { status: 500 }
    )
  }
}

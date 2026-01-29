import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TranslationTaskStatus, Prisma } from "@prisma/client"
import { TranslationEvents } from "@/lib/translation/event-bus"

import { getTranslations } from "next-intl/server"

interface RouteParams {
  params: Promise<{ id: string }>
}

interface PatchBody {
  action: string
}

// DELETE - 删除任务
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const t = await getTranslations("AdminTranslationTasks.error")

    const { id } = await params

    // 验证 ID 格式
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: t("invalidId") }, { status: 400 })
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
        return NextResponse.json({ error: t("taskNotFound") }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete translation task error:", error)
    const t = await getTranslations("AdminTranslationTasks.error")
    return NextResponse.json(
      { error: t("internalServerError") },
      { status: 500 }
    )
  }
}

// PATCH - 更新任务 (主要是重试)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const t = await getTranslations("AdminTranslationTasks.error")

    const { id } = await params

    // 验证 ID 格式
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: t("invalidId") }, { status: 400 })
    }

    let body: PatchBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: t("invalidJson") }, { status: 400 })
    }

    const { action } = body

    // 获取当前任务状态
    const task = await prisma.translation_tasks.findUnique({
      where: { id: BigInt(id) },
      select: {
        status: true,
        entity_type: true,
        entity_id: true,
        target_locale: true,
        priority: true,
      },
    })

    if (!task) {
      return NextResponse.json({ error: t("taskNotFound") }, { status: 404 })
    }

    if (action === "execute") {
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

        // 触发事件
        await TranslationEvents.createTask(task.entity_type, {
          taskId: BigInt(id),
          entityId: task.entity_id,
          targetLocale: task.target_locale,
          priority: task.priority,
        })
      } catch (error) {
        throw error
      }

      return NextResponse.json({ success: true })
    }

    if (action === "retry") {
      // 只有非等待中和非进行中的任务才能重试
      if (
        task.status === TranslationTaskStatus.PENDING ||
        task.status === TranslationTaskStatus.PROCESSING
      ) {
        return NextResponse.json(
          { error: t("taskPendingOrProcessing") },
          { status: 400 }
        )
      }

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
        throw error
      }

      return NextResponse.json({ success: true })
    }

    if (action === "cancel") {
      // 只有等待中的任务才能取消
      if (task.status !== TranslationTaskStatus.PENDING) {
        return NextResponse.json(
          { error: t("taskNotPending") },
          { status: 400 }
        )
      }

      try {
        await prisma.translation_tasks.update({
          where: { id: BigInt(id) },
          data: {
            status: TranslationTaskStatus.CANCELLED,
          },
        })
      } catch (error) {
        throw error
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: t("invalidAction") }, { status: 400 })
  } catch (error) {
    console.error("Update translation task error:", error)
    const t = await getTranslations("AdminTranslationTasks.error")
    return NextResponse.json(
      { error: t("internalServerError") },
      { status: 500 }
    )
  }
}

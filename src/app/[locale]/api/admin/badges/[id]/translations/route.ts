import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { Locale, routing } from "@/i18n/routing"
import { createTranslationTasks } from "@/lib/services/translation-task"
import { TranslationEntityType } from "@prisma/client"

// GET - 获取徽章的所有翻译信息
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await context.params
    const badgeId = BigInt(params.id)

    // 1. 获取徽章基础信息（主要是源语言）
    const badge = await prisma.badges.findUnique({
      where: { id: badgeId },
      select: { source_locale: true },
    })

    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 })
    }

    // 2. 获取所有现有翻译
    const translations = await prisma.badge_translations.findMany({
      where: { badge_id: badgeId },
    })

    // 3. 获取系统配置中的启用语言（用于排序）
    const config = await prisma.system_configs.findUnique({
      where: { config_key: "system.translation.enabled_locales" },
    })

    let enabledLocales: string[] = []
    try {
      if (config?.config_value) {
        enabledLocales = JSON.parse(config.config_value)
      }
    } catch (e) {
      console.error("Failed to parse enabled_locales config", e)
    }

    // 4. 组装数据
    const allLocales = routing.locales
    const resultItems = allLocales.map((locale) => {
      const trans = translations.find((t) => t.locale === locale)
      return {
        locale,
        name: trans?.name || "",
        description: trans?.description || "",
        isSource: locale === badge.source_locale,
        isTranslated: !!trans,
      }
    })

    // 5. 排序：源语言 > 启用语言 > 其他
    resultItems.sort((a, b) => {
      if (a.isSource) return -1
      if (b.isSource) return 1

      const aEnabled = enabledLocales.includes(a.locale)
      const bEnabled = enabledLocales.includes(b.locale)

      if (aEnabled && !bEnabled) return -1
      if (!aEnabled && bEnabled) return 1

      return 0
    })

    return NextResponse.json({
      sourceLocale: badge.source_locale,
      translations: resultItems,
    })
  } catch (error) {
    console.error("Get badge translations error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - 更新或创建特定语言的翻译
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const params = await context.params
    const badgeId = BigInt(params.id)

    const body = await request.json()
    const { locale, name, description } = body

    if (!locale || !routing.locales.includes(locale as Locale)) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 })
    }

    if (
      !name ||
      typeof name !== "string" ||
      name.length < 1 ||
      name.length > 32
    ) {
      return NextResponse.json(
        { error: "Name must be between 1-32 characters" },
        { status: 400 }
      )
    }

    if (
      description &&
      (typeof description !== "string" || description.length > 255)
    ) {
      return NextResponse.json(
        { error: "Description must not exceed 255 characters" },
        { status: 400 }
      )
    }

    // 检查徽章是否存在
    const badge = await prisma.badges.findUnique({
      where: { id: badgeId },
    })

    if (!badge) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 })
    }

    const isSource = badge.source_locale === locale
    let newVersion = 0

    const existing = await prisma.badge_translations.findUnique({
      where: {
        badge_id_locale: {
          badge_id: badgeId,
          locale,
        },
      },
    })

    if (existing) {
      newVersion = existing.version + 1
      await prisma.badge_translations.update({
        where: {
          badge_id_locale: {
            badge_id: badgeId,
            locale,
          },
        },
        data: {
          name,
          description: description || null,
          version: newVersion,
          is_source: isSource,
        },
      })
    } else {
      await prisma.badge_translations.create({
        data: {
          badge_id: badgeId,
          locale,
          name,
          description: description || null,
          is_source: isSource,
          version: 0,
        },
      })
    }

    if (isSource) {
      await createTranslationTasks(
        TranslationEntityType.BADGE,
        badgeId,
        locale,
        newVersion
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update badge translation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

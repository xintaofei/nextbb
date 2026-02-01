import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Locale, routing } from "@/i18n/routing"
import { createTranslationTasks } from "@/lib/services/translation-task"
import { TranslationEntityType } from "@prisma/client"

// GET - 获取表情分组的所有翻译信息
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const groupId = BigInt(params.id)

    // 1. 获取分组基础信息（主要是源语言）
    const group = await prisma.expression_groups.findUnique({
      where: { id: groupId },
      select: { source_locale: true },
    })

    if (!group) {
      return NextResponse.json(
        { error: "Expression group not found" },
        { status: 404 }
      )
    }

    // 2. 获取所有现有翻译
    const translations = await prisma.expression_group_translations.findMany({
      where: { group_id: groupId },
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
        isSource: locale === group.source_locale,
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
      sourceLocale: group.source_locale,
      translations: resultItems,
    })
  } catch (error) {
    console.error("Get expression group translations error:", error)
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
    const params = await context.params
    const groupId = BigInt(params.id)

    const body = await request.json()
    const { locale, name } = body

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

    // 检查分组是否存在
    const group = await prisma.expression_groups.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return NextResponse.json(
        { error: "Expression group not found" },
        { status: 404 }
      )
    }

    const isSource = group.source_locale === locale
    let newVersion = 0

    const existing = await prisma.expression_group_translations.findUnique({
      where: {
        group_id_locale: {
          group_id: groupId,
          locale,
        },
      },
    })

    if (existing) {
      newVersion = existing.version + 1
      await prisma.expression_group_translations.update({
        where: {
          group_id_locale: {
            group_id: groupId,
            locale,
          },
        },
        data: {
          name,
          version: newVersion,
          is_source: isSource,
        },
      })
    } else {
      await prisma.expression_group_translations.create({
        data: {
          group_id: groupId,
          locale,
          name,
          is_source: isSource,
          version: newVersion,
        },
      })
    }

    if (isSource) {
      await createTranslationTasks(
        TranslationEntityType.EXPRESSION_GROUP,
        groupId,
        locale,
        newVersion
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update expression group translation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

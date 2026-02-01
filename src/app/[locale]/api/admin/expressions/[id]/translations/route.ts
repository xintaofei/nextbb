import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Locale, routing } from "@/i18n/routing"
import { createTranslationTasks } from "@/lib/services/translation-task"
import { TranslationEntityType } from "@prisma/client"

// GET - 获取表情的所有翻译信息
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const expressionId = BigInt(params.id)

    // 1. 获取表情基础信息（主要是源语言）
    const expression = await prisma.expressions.findUnique({
      where: { id: expressionId },
      select: { source_locale: true },
    })

    if (!expression) {
      return NextResponse.json(
        { error: "Expression not found" },
        { status: 404 }
      )
    }

    // 2. 获取所有现有翻译
    const translations = await prisma.expression_translations.findMany({
      where: { expression_id: expressionId },
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
        isSource: locale === expression.source_locale,
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
      sourceLocale: expression.source_locale,
      translations: resultItems,
    })
  } catch (error) {
    console.error("Get expression translations error:", error)
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
    const expressionId = BigInt(params.id)

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

    // 检查表情是否存在
    const expression = await prisma.expressions.findUnique({
      where: { id: expressionId },
    })

    if (!expression) {
      return NextResponse.json(
        { error: "Expression not found" },
        { status: 404 }
      )
    }

    const isSource = expression.source_locale === locale
    let newVersion = 0

    const existing = await prisma.expression_translations.findUnique({
      where: {
        expression_id_locale: {
          expression_id: expressionId,
          locale,
        },
      },
    })

    if (existing) {
      newVersion = existing.version + 1
      await prisma.expression_translations.update({
        where: {
          expression_id_locale: {
            expression_id: expressionId,
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
      await prisma.expression_translations.create({
        data: {
          expression_id: expressionId,
          locale,
          name,
          is_source: isSource,
          version: newVersion,
        },
      })
    }

    if (isSource) {
      await createTranslationTasks(
        TranslationEntityType.EXPRESSION,
        expressionId,
        locale,
        newVersion
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update expression translation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

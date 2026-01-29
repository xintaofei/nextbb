import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidateConfigs } from "@/lib/config"

type ConfigDTO = {
  id: string
  configKey: string
  configValue: string
  configType: string
  category: string
  description: string | null
  isPublic: boolean
  isSensitive: boolean
  defaultValue: string
  updatedAt: string
}

type ConfigListResult = {
  items: ConfigDTO[]
  page: number
  pageSize: number
  total: number
}

// 格式化配置值为字符串
function stringifyConfigValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false"
  } else if (typeof value === "number") {
    return String(value)
  } else if (typeof value === "object") {
    return JSON.stringify(value)
  }
  return String(value)
}

// 掩码敏感信息
function maskSensitiveValue(value: string, isSensitive: boolean): string {
  if (!isSensitive || !value) return value
  return ""
}

// GET - 获取配置列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const page = Number(searchParams.get("page")) || 1
    const pageSize = Number(searchParams.get("pageSize")) || 20

    const where = category ? { category } : {}

    const [items, total] = await Promise.all([
      prisma.system_configs.findMany({
        where,
        orderBy: [{ category: "asc" }, { config_key: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.system_configs.count({ where }),
    ])

    const result: ConfigListResult = {
      items: items.map((item) => ({
        id: item.id.toString(),
        configKey: item.config_key,
        configValue: maskSensitiveValue(item.config_value, item.is_sensitive),
        configType: item.config_type,
        category: item.category,
        description: item.description,
        isPublic: item.is_public,
        isSensitive: item.is_sensitive,
        defaultValue: item.default_value,
        updatedAt: item.updated_at.toISOString(),
      })),
      page,
      pageSize,
      total,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Failed to fetch configs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - 批量更新配置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const configs = body.configs as Array<{
      configKey: string
      configValue: unknown
    }>

    if (!Array.isArray(configs)) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const failed: Array<{ key: string; error: string }> = []
    let updated = 0

    for (const config of configs) {
      try {
        const existing = await prisma.system_configs.findUnique({
          where: { config_key: config.configKey },
        })

        if (!existing) {
          failed.push({ key: config.configKey, error: "Config not found" })
          continue
        }

        const valueStr = stringifyConfigValue(config.configValue)

        await prisma.system_configs.update({
          where: { config_key: config.configKey },
          data: { config_value: valueStr },
        })

        updated++
      } catch (error) {
        failed.push({
          key: config.configKey,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // 清除配置缓存
    if (updated > 0) {
      await revalidateConfigs()
    }

    return NextResponse.json({
      success: true,
      updated,
      failed,
    })
  } catch (error) {
    console.error("Failed to batch update configs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

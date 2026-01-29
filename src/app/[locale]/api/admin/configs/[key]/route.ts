import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { revalidateConfigs } from "@/lib/config"

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

// GET - 获取单个配置
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  try {
    const params = await context.params
    const configKey = decodeURIComponent(params.key)

    const config = await prisma.system_configs.findUnique({
      where: { config_key: configKey },
    })

    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: config.id.toString(),
      configKey: config.config_key,
      configValue: config.config_value,
      configType: config.config_type,
      category: config.category,
      description: config.description,
      isPublic: config.is_public,
      isSensitive: config.is_sensitive,
      defaultValue: config.default_value,
      updatedAt: config.updated_at.toISOString(),
    })
  } catch (error) {
    console.error("Failed to fetch config:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - 更新配置
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ key: string }> }
) {
  try {
    const params = await context.params
    const configKey = decodeURIComponent(params.key)

    const body = await request.json()
    const { configValue } = body

    if (configValue === undefined) {
      return NextResponse.json(
        { error: "configValue is required" },
        { status: 400 }
      )
    }

    const existing = await prisma.system_configs.findUnique({
      where: { config_key: configKey },
    })

    if (!existing) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 })
    }

    const valueStr = stringifyConfigValue(configValue)

    const updated = await prisma.system_configs.update({
      where: { config_key: configKey },
      data: { config_value: valueStr },
    })

    // 清除配置缓存
    await revalidateConfigs()

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id.toString(),
        configKey: updated.config_key,
        configValue: updated.config_value,
        configType: updated.config_type,
        category: updated.category,
        description: updated.description,
        isPublic: updated.is_public,
        isSensitive: updated.is_sensitive,
        defaultValue: updated.default_value,
        updatedAt: updated.updated_at.toISOString(),
      },
    })
  } catch (error) {
    console.error("Failed to update config:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

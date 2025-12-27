import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 解析配置值
function parseConfigValue(value: string, type: string): unknown {
  if (type === "boolean") {
    return value === "true"
  } else if (type === "number") {
    return Number(value)
  } else if (type === "json") {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

// GET - 获取公开配置
export async function GET() {
  try {
    const configs = await prisma.system_configs.findMany({
      where: { is_public: true },
      select: {
        config_key: true,
        config_value: true,
        config_type: true,
      },
    })

    const result: Record<string, unknown> = {}

    for (const config of configs) {
      result[config.config_key] = parseConfigValue(
        config.config_value,
        config.config_type
      )
    }

    return NextResponse.json({ configs: result })
  } catch (error) {
    console.error("Failed to fetch public configs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { generateId } from "@/lib/id"
import { z } from "zod"
import { LLMInterfaceMode, LLMUsage } from "@prisma/client"

const createLLMConfigSchema = z.object({
  interface_mode: z.enum(
    Object.values(LLMInterfaceMode) as [string, ...string[]]
  ),
  name: z.string().min(1, "Name is required").max(64),
  base_url: z
    .string()
    .refine(
      (val) => {
        try {
          new URL(val)
          return true
        } catch {
          return false
        }
      },
      { message: "Invalid URL" }
    )
    .max(255),
  api_key: z.string().min(1, "API Key is required").max(255),
  usage: z.enum(Object.values(LLMUsage) as [string, ...string[]]),
  is_enabled: z.boolean().default(true),
})

export async function GET() {
  try {
    const auth = await getServerSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const configs = await prisma.llm_configs.findMany({
      orderBy: { created_at: "desc" },
    })

    const items = configs.map((config) => ({
      id: String(config.id),
      interface_mode: config.interface_mode,
      name: config.name,
      base_url: config.base_url,
      // Mask API Key for security
      api_key: config.api_key
        ? `${config.api_key.substring(0, 3)}***${config.api_key.substring(config.api_key.length - 3)}`
        : "",
      usage: config.usage,
      is_enabled: config.is_enabled,
      created_at: config.created_at.toISOString(),
      updated_at: config.updated_at.toISOString(),
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Get LLM configs error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = createLLMConfigSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.format() },
        { status: 400 }
      )
    }

    const { interface_mode, name, base_url, api_key, usage, is_enabled } =
      validation.data

    const newConfig = await prisma.llm_configs.create({
      data: {
        id: generateId(),
        interface_mode: interface_mode as LLMInterfaceMode,
        name,
        base_url,
        api_key,
        usage: usage as LLMUsage,
        is_enabled,
      },
    })

    return NextResponse.json(
      {
        id: String(newConfig.id),
        interface_mode: newConfig.interface_mode,
        name: newConfig.name,
        base_url: newConfig.base_url,
        api_key: "******", // Don't return full key on create
        usage: newConfig.usage,
        is_enabled: newConfig.is_enabled,
        created_at: newConfig.created_at.toISOString(),
        updated_at: newConfig.updated_at.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create LLM config error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

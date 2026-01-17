import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { z } from "zod"
import { LLMInterfaceMode, LLMUsage, Prisma } from "@prisma/client"

const updateLLMConfigSchema = z.object({
  interface_mode: z
    .enum(Object.values(LLMInterfaceMode) as [string, ...string[]])
    .optional(),
  name: z.string().min(1).max(64).optional(),
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
    .optional(),
  api_key: z.string().max(255).optional(),
  usage: z.enum(Object.values(LLMUsage) as [string, ...string[]]).optional(),
  is_enabled: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = updateLLMConfigSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.format() },
        { status: 400 }
      )
    }

    const { interface_mode, name, base_url, api_key, usage, is_enabled } =
      validation.data

    // 检查是否存在
    const existingConfig = await prisma.llm_configs.findUnique({
      where: { id: BigInt(id) },
    })

    if (!existingConfig) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 })
    }

    const updateData: Prisma.llm_configsUpdateInput = {}

    if (interface_mode !== undefined)
      updateData.interface_mode = interface_mode as LLMInterfaceMode
    if (name !== undefined) updateData.name = name
    if (base_url !== undefined) updateData.base_url = base_url
    if (usage !== undefined) updateData.usage = usage as LLMUsage
    if (is_enabled !== undefined) updateData.is_enabled = is_enabled

    // 只有当 api_key 存在且不包含 *** 时才更新（简单的掩码检查）
    // 或者前端约定：不修改就不传 api_key
    if (api_key && !api_key.includes("***")) {
      updateData.api_key = api_key
    }

    const updatedConfig = await prisma.llm_configs.update({
      where: { id: BigInt(id) },
      data: updateData,
    })

    return NextResponse.json({
      id: String(updatedConfig.id),
      interface_mode: updatedConfig.interface_mode,
      name: updatedConfig.name,
      base_url: updatedConfig.base_url,
      api_key: updatedConfig.api_key
        ? `${updatedConfig.api_key.substring(0, 3)}***${updatedConfig.api_key.substring(updatedConfig.api_key.length - 3)}`
        : "",
      usage: updatedConfig.usage,
      is_enabled: updatedConfig.is_enabled,
      created_at: updatedConfig.created_at.toISOString(),
      updated_at: updatedConfig.updated_at.toISOString(),
    })
  } catch (error) {
    console.error("Update LLM config error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.llm_configs.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete LLM config error:", error)
    // Prisma record not found error code is P2025
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  StorageProviderDTO,
  maskSensitiveConfig,
  validateConfig,
  StorageProviderConfig,
} from "@/types/storage-provider"
import { getSensitiveFields } from "@/types/storage-provider-config"

// PATCH /api/admin/storage-providers/[id]
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const providerId = BigInt(id)

    const body = (await request.json()) as {
      name?: string
      config?: Record<string, unknown>
      baseUrl?: string
      isActive?: boolean
      maxFileSize?: number
      allowedTypes?: string
      isDeleted?: boolean
    }

    const existingProvider = await prisma.storage_providers.findUnique({
      where: { id: providerId },
    })

    if (!existingProvider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    if (existingProvider.is_default) {
      if (body.isActive === false) {
        return NextResponse.json(
          { error: "Cannot disable the default provider" },
          { status: 400 }
        )
      }
      if (body.isDeleted === true) {
        return NextResponse.json(
          { error: "Cannot delete the default provider" },
          { status: 400 }
        )
      }
    }

    let config = existingProvider.config as Record<string, unknown>

    if (body.config) {
      const providerType = existingProvider.provider_type
      const sensitiveFields = getSensitiveFields(providerType)

      // 合并配置,空的敏感字段保留原值
      const configToValidate = { ...config, ...body.config }

      for (const field of sensitiveFields) {
        if (body.config[field] === "" || body.config[field] === undefined) {
          // 空值时使用原有值进行验证
          configToValidate[field] = config[field]
        }
      }

      const validation = validateConfig(providerType, configToValidate)
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid configuration", errors: validation.errors },
          { status: 400 }
        )
      }

      // 更新配置,空的敏感字段保留原值
      config = { ...config, ...body.config }
      for (const field of sensitiveFields) {
        if (body.config[field] === "" || body.config[field] === undefined) {
          config[field] = (existingProvider.config as Record<string, unknown>)[
            field
          ]
        }
      }
    }

    const maxFileSizeInBytes =
      body.maxFileSize !== undefined
        ? body.maxFileSize
          ? BigInt(body.maxFileSize) * BigInt(1024) * BigInt(1024)
          : null
        : existingProvider.max_file_size

    const provider = await prisma.storage_providers.update({
      where: { id: providerId },
      data: {
        name: body.name ?? existingProvider.name,
        config: config as object,
        base_url: body.baseUrl ?? existingProvider.base_url,
        is_active: body.isActive ?? existingProvider.is_active,
        max_file_size: maxFileSizeInBytes,
        allowed_types:
          body.allowedTypes !== undefined
            ? body.allowedTypes || null
            : existingProvider.allowed_types,
        is_deleted: body.isDeleted ?? existingProvider.is_deleted,
      },
    })

    const dto: StorageProviderDTO = {
      id: provider.id.toString(),
      name: provider.name,
      providerType: provider.provider_type,
      config: maskSensitiveConfig(
        provider.provider_type,
        provider.config as unknown as StorageProviderConfig
      ),
      baseUrl: provider.base_url,
      isDefault: provider.is_default,
      isActive: provider.is_active,
      sort: provider.sort,
      maxFileSize: provider.max_file_size?.toString() ?? null,
      allowedTypes: provider.allowed_types,
      isDeleted: provider.is_deleted,
      createdAt: provider.created_at.toISOString(),
      updatedAt: provider.updated_at.toISOString(),
    }

    return NextResponse.json(dto)
  } catch (error) {
    console.error("Failed to update storage provider:", error)
    return NextResponse.json(
      { error: "Failed to update storage provider" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/storage-providers/[id]
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const providerId = BigInt(id)

    const existingProvider = await prisma.storage_providers.findUnique({
      where: { id: providerId },
    })

    if (!existingProvider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    if (existingProvider.is_default) {
      return NextResponse.json(
        { error: "Cannot delete the default provider" },
        { status: 400 }
      )
    }

    await prisma.storage_providers.update({
      where: { id: providerId },
      data: { is_deleted: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete storage provider:", error)
    return NextResponse.json(
      { error: "Failed to delete storage provider" },
      { status: 500 }
    )
  }
}

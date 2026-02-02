import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import {
  StorageProviderDTO,
  maskSensitiveConfig,
  validateConfig,
  StorageProviderConfig,
} from "@/types/storage-provider"
import { StorageProviderType } from "@prisma/client"

// GET /api/admin/storage-providers
export async function GET() {
  try {
    const providers = await prisma.storage_providers.findMany({
      where: {
        is_deleted: false,
      },
      include: {
        _count: {
          select: {
            storage_files: true,
          },
        },
      },
      orderBy: {
        sort: "asc",
      },
    })

    const dtos: StorageProviderDTO[] = providers.map((provider) => ({
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
      fileCount: provider._count.storage_files,
    }))

    return NextResponse.json(dtos)
  } catch (error) {
    console.error("Failed to fetch storage providers:", error)
    return NextResponse.json(
      { error: "Failed to fetch storage providers" },
      { status: 500 }
    )
  }
}

// POST /api/admin/storage-providers
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name: string
      providerType: StorageProviderType
      config: Record<string, unknown>
      baseUrl: string
      isActive?: boolean
      maxFileSize?: number
      allowedTypes?: string
    }

    if (!body.name || !body.providerType || !body.config || !body.baseUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const validation = validateConfig(body.providerType, body.config)
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Invalid configuration", errors: validation.errors },
        { status: 400 }
      )
    }

    const maxSort = await prisma.storage_providers.findFirst({
      where: { is_deleted: false },
      orderBy: { sort: "desc" },
      select: { sort: true },
    })

    // 检查是否存在其他供应商，如果没有则设为默认
    const existingCount = await prisma.storage_providers.count({
      where: { is_deleted: false },
    })
    const isFirstProvider = existingCount === 0

    const maxFileSizeInBytes = body.maxFileSize
      ? BigInt(body.maxFileSize) * BigInt(1024) * BigInt(1024)
      : null

    const provider = await prisma.storage_providers.create({
      data: {
        id: generateId(),
        name: body.name,
        provider_type: body.providerType,
        config: body.config as object,
        base_url: body.baseUrl,
        is_active: body.isActive ?? true,
        is_default: isFirstProvider,
        sort: (maxSort?.sort ?? 0) + 1,
        max_file_size: maxFileSizeInBytes,
        allowed_types: body.allowedTypes ?? null,
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
    console.error("Failed to create storage provider:", error)
    return NextResponse.json(
      { error: "Failed to create storage provider" },
      { status: 500 }
    )
  }
}

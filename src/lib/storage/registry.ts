import type { StorageProviderType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { IStorageProvider } from "./providers/interface"
import type { StorageProviderRecord, ProviderConfig } from "./types"

/**
 * Cache for provider client instances
 * Key: provider ID, Value: provider client instance
 */
const providerClientCache = new Map<string, IStorageProvider>()

/**
 * Clear a specific provider from the cache
 * Call this when a provider's configuration is updated or deleted
 */
export function clearProviderCache(providerId: bigint): void {
  providerClientCache.delete(providerId.toString())
}

/**
 * Clear all provider cache entries
 * Call this during system initialization or configuration refresh
 */
export function clearAllProviderCache(): void {
  providerClientCache.clear()
}

/**
 * Get the default storage provider configuration from the database
 * @returns Default provider record or null if none exists
 */
export async function getDefaultProvider(): Promise<StorageProviderRecord | null> {
  const provider = await prisma.storage_providers.findFirst({
    where: {
      is_default: true,
      is_active: true,
      is_deleted: false,
    },
  })

  if (!provider) {
    return null
  }

  return {
    id: provider.id,
    name: provider.name,
    provider_type: provider.provider_type,
    config: provider.config as unknown as ProviderConfig,
    base_url: provider.base_url,
    is_default: provider.is_default,
    is_active: provider.is_active,
    max_file_size: provider.max_file_size,
    allowed_types: provider.allowed_types,
  }
}

/**
 * Get a storage provider configuration by ID
 * @param id - Provider ID
 * @returns Provider record or null if not found
 */
export async function getProviderById(
  id: bigint
): Promise<StorageProviderRecord | null> {
  const provider = await prisma.storage_providers.findFirst({
    where: {
      id,
      is_active: true,
      is_deleted: false,
    },
  })

  if (!provider) {
    return null
  }

  return {
    id: provider.id,
    name: provider.name,
    provider_type: provider.provider_type,
    config: provider.config as unknown as ProviderConfig,
    base_url: provider.base_url,
    is_default: provider.is_default,
    is_active: provider.is_active,
    max_file_size: provider.max_file_size,
    allowed_types: provider.allowed_types,
  }
}

/**
 * Dynamically create a provider client based on type
 * This uses dynamic imports to avoid bundling unused SDKs
 */
async function createProviderClient(
  providerType: StorageProviderType,
  config: Record<string, unknown>,
  baseUrl: string
): Promise<IStorageProvider> {
  switch (providerType) {
    case "LOCAL": {
      const { createLocalProvider } = await import("./providers/local")
      return createLocalProvider(config, baseUrl)
    }
    case "VERCEL_BLOB": {
      const { createVercelBlobProvider } =
        await import("./providers/vercel-blob")
      return createVercelBlobProvider(config, baseUrl)
    }
    case "ALIYUN_OSS": {
      const { createAliyunOSSProvider } = await import("./providers/aliyun-oss")
      return createAliyunOSSProvider(config, baseUrl)
    }
    case "AWS_S3": {
      const { createAWSS3Provider } = await import("./providers/aws-s3")
      return createAWSS3Provider(config, baseUrl)
    }
    case "TENCENT_COS": {
      const { createTencentCOSProvider } =
        await import("./providers/tencent-cos")
      return createTencentCOSProvider(config, baseUrl)
    }
    case "QINIU": {
      const { createQiniuProvider } = await import("./providers/qiniu")
      return createQiniuProvider(config, baseUrl)
    }
    case "UPYUN": {
      const { createUpyunProvider } = await import("./providers/upyun")
      return createUpyunProvider(config, baseUrl)
    }
    case "MINIO": {
      const { createMinIOProvider } = await import("./providers/minio")
      return createMinIOProvider(config, baseUrl)
    }
    default:
      throw new Error(`Unsupported storage provider type: ${providerType}`)
  }
}

/**
 * Get or create a storage provider client instance
 * Clients are cached by provider ID for performance
 * @param providerRecord - Provider configuration record
 * @returns Storage provider client instance
 */
export async function getProviderClient(
  providerRecord: StorageProviderRecord
): Promise<IStorageProvider> {
  const cacheKey = providerRecord.id.toString()

  // Check cache first
  const cached = providerClientCache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Create new client instance
  const client = await createProviderClient(
    providerRecord.provider_type,
    providerRecord.config as unknown as Record<string, unknown>,
    providerRecord.base_url
  )

  // Cache the client
  providerClientCache.set(cacheKey, client)

  return client
}

/**
 * Get all active storage providers
 * @returns List of active provider records
 */
export async function getAllActiveProviders(): Promise<
  StorageProviderRecord[]
> {
  const providers = await prisma.storage_providers.findMany({
    where: {
      is_active: true,
      is_deleted: false,
    },
    orderBy: [{ is_default: "desc" }, { sort: "asc" }, { created_at: "asc" }],
  })

  return providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    provider_type: provider.provider_type,
    config: provider.config as unknown as ProviderConfig,
    base_url: provider.base_url,
    is_default: provider.is_default,
    is_active: provider.is_active,
    max_file_size: provider.max_file_size,
    allowed_types: provider.allowed_types,
  }))
}

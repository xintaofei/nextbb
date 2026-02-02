import type { StorageReferenceType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import {
  getDefaultProvider,
  getProviderById,
  getProviderClient,
  clearProviderCache,
  clearAllProviderCache,
} from "./registry"
import { calculateFileHash, calculateStreamHash } from "./hash-utils"
import { validateImageFile, validateFileContent } from "./validators"
import { generateStorageKey, getExtensionFromMimeType } from "./path-generator"
import type {
  UploadOptions,
  UploadResult,
  StorageProviderRecord,
} from "./types"

export {
  clearProviderCache,
  clearAllProviderCache,
  getDefaultProvider,
  getProviderById,
}

export type { UploadOptions, UploadResult }

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow http/https
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:")
      return false

    const hostname = parsed.hostname

    // Block localhost and loopback
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]"
    ) {
      return false
    }

    // Block private IP ranges
    // 10.0.0.0/8
    if (hostname.startsWith("10.")) return false
    // 192.168.0.0/16
    if (hostname.startsWith("192.168.")) return false
    // 172.16.0.0/12
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return false
    // 169.254.0.0/16 (Link-local / Cloud metadata)
    if (hostname.startsWith("169.254.")) return false

    return true
  } catch {
    return false
  }
}

/**
 * Storage Service - Main entry point for file upload operations
 */
export class StorageService {
  /**
   * Upload a file to storage
   * @param file - File object or data buffer with metadata
   * @param options - Upload options
   * @returns Upload result with file info
   */
  static async upload(
    file: File | { data: ArrayBuffer | Buffer; type: string; name?: string },
    options: UploadOptions
  ): Promise<UploadResult> {
    // Get provider configuration
    const provider = options.providerId
      ? await getProviderById(options.providerId)
      : await getDefaultProvider()

    if (!provider) {
      throw new Error("No active storage provider configured")
    }

    const mimeType = file instanceof File ? file.type : file.type
    const originalFilename =
      options.originalFilename ||
      (file instanceof File ? file.name : file.name) ||
      `file.${getExtensionFromMimeType(mimeType)}`

    // 1. Calculate Hash (Stream optimized)
    let fileHash: string
    let data: ArrayBuffer | Buffer | null = null

    if (file instanceof File) {
      fileHash = await calculateStreamHash(file.stream())
    } else {
      data = file.data
      fileHash = calculateFileHash(data)
    }

    // 2. Deduplication Check
    const existingFile = await prisma.storage_files.findFirst({
      where: {
        file_hash: fileHash,
        provider_id: provider.id,
        // We check all files, including deleted ones, to handle restoration
      },
    })

    if (existingFile) {
      // If it was deleted, restore it
      if (existingFile.is_deleted) {
        await prisma.storage_files.update({
          where: { id: existingFile.id },
          data: { is_deleted: false },
        })
        existingFile.is_deleted = false
      }

      return {
        id: existingFile.id,
        url: `${provider.base_url}/${existingFile.storage_key}`,
        storageKey: existingFile.storage_key,
        fileHash: existingFile.file_hash,
        fileSize: Number(existingFile.file_size),
        mimeType: existingFile.mime_type,
        deduplicated: true,
      }
    }

    // 3. Prepare Data & Validate
    if (!data) {
      if (file instanceof File) {
        data = await file.arrayBuffer()
      } else {
        throw new Error("File data missing")
      }
    }

    const fileSize = data.byteLength

    // Validate Metadata
    const validation = validateImageFile(
      mimeType,
      fileSize,
      options.referenceType,
      provider
    )
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Validate Content (Magic Bytes)
    // Use provider allowed types if configured, otherwise default to validators' ALLOWED_IMAGE_TYPES
    // Note: validators.ts defines ALLOWED_IMAGE_TYPES as readonly, we need to handle that
    const allowedTypes = provider.allowed_types
      ? provider.allowed_types.split(",").map((t) => t.trim())
      : undefined // undefined will make validateFileContent use its default (ALLOWED_IMAGE_TYPES)

    const contentValidation = await validateFileContent(data, allowedTypes)
    if (!contentValidation.valid) {
      throw new Error(contentValidation.error)
    }

    // Generate storage key
    const storageKey = generateStorageKey(options.referenceType, mimeType, {
      userId: options.userId,
      subPath: options.subPath,
    })

    // Get provider client and upload
    const client = await getProviderClient(provider)
    const url = await client.upload(storageKey, data, mimeType)

    // Create database record with Compensation
    try {
      const fileRecord = await prisma.storage_files.create({
        data: {
          id: generateId(),
          provider_id: provider.id,
          user_id: options.userId,
          original_filename: originalFilename,
          mime_type: mimeType,
          file_size: BigInt(fileSize),
          storage_key: storageKey,
          file_hash: fileHash,
          is_public: options.isPublic ?? true,
          reference_type: options.referenceType,
          metadata: (options.metadata as object) ?? undefined,
        },
      })

      return {
        id: fileRecord.id,
        url,
        storageKey: fileRecord.storage_key,
        fileHash: fileRecord.file_hash,
        fileSize: Number(fileRecord.file_size),
        mimeType: fileRecord.mime_type,
        deduplicated: false,
      }
    } catch (error) {
      // Rollback: Delete uploaded file
      console.error("DB Create failed, rolling back storage upload:", error)
      try {
        await client.delete(storageKey)
      } catch (deleteError) {
        console.error("Rollback failed:", deleteError)
      }
      throw error
    }
  }

  /**
   * Upload a file from a remote URL
   * @param srcUrl - Source URL to fetch the file from
   * @param options - Upload options
   * @param timeout - Fetch timeout in milliseconds (default: 10000)
   * @returns Upload result with file info
   */
  static async uploadFromUrl(
    srcUrl: string,
    options: UploadOptions,
    timeout: number = 10000
  ): Promise<UploadResult> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      if (!isAllowedUrl(srcUrl)) {
        throw new Error("Invalid URL: Access denied")
      }

      const res = await fetch(srcUrl, { signal: controller.signal })
      if (!res.ok) {
        throw new Error(`Failed to fetch file from URL: ${res.status}`)
      }

      const contentType = res.headers.get("content-type") || "image/jpeg"
      const contentLength = res.headers.get("content-length")

      // Pre-check file size if available
      if (contentLength) {
        const size = parseInt(contentLength, 10)
        if (Number.isFinite(size) && size > 10 * 1024 * 1024) {
          throw new Error("File too large")
        }
      }

      // Stream the response to ArrayBuffer with size limit
      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error("Failed to read response body")
      }

      const chunks: Uint8Array[] = []
      let receivedLength = 0
      const limit = 10 * 1024 * 1024 // 10MB limit

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          if (value) {
            receivedLength += value.length
            if (receivedLength > limit) {
              throw new Error("File too large")
            }
            chunks.push(value)
          }
        }
      } finally {
        reader.releaseLock()
      }

      // Combine chunks into ArrayBuffer
      const result = new Uint8Array(receivedLength)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }
      const arrayBuffer = result.buffer

      // Extract filename from URL if possible
      let filename: string | undefined
      try {
        const urlPath = new URL(srcUrl).pathname
        const lastSegment = urlPath.split("/").pop()
        if (lastSegment && lastSegment.includes(".")) {
          filename = lastSegment
        }
      } catch {
        // Ignore URL parsing errors
      }

      return await StorageService.upload(
        {
          data: arrayBuffer,
          type: contentType,
          name: filename,
        },
        {
          ...options,
          originalFilename: options.originalFilename || filename,
        }
      )
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Delete a file from storage
   * @param fileId - ID of the storage_files record
   */
  static async delete(fileId: bigint): Promise<void> {
    const fileRecord = await prisma.storage_files.findUnique({
      where: { id: fileId },
      include: { provider: true },
    })

    if (!fileRecord || fileRecord.is_deleted) {
      return
    }

    // Check if other records reference the same file (by hash)
    const otherReferences = await prisma.storage_files.count({
      where: {
        file_hash: fileRecord.file_hash,
        provider_id: fileRecord.provider_id,
        id: { not: fileId },
        is_deleted: false,
      },
    })

    // Only delete from storage if no other references exist
    if (otherReferences === 0) {
      const providerRecord: StorageProviderRecord = {
        id: fileRecord.provider.id,
        name: fileRecord.provider.name,
        provider_type: fileRecord.provider.provider_type,
        config: fileRecord.provider
          .config as unknown as StorageProviderRecord["config"],
        base_url: fileRecord.provider.base_url,
        is_default: fileRecord.provider.is_default,
        is_active: fileRecord.provider.is_active,
        max_file_size: fileRecord.provider.max_file_size,
        allowed_types: fileRecord.provider.allowed_types,
      }

      try {
        const client = await getProviderClient(providerRecord)
        await client.delete(fileRecord.storage_key)
      } catch (err) {
        console.error("Failed to delete file from storage:", err)
        // Continue to mark as deleted in database even if storage delete fails
      }
    }

    // Mark as deleted in database
    await prisma.storage_files.update({
      where: { id: fileId },
      data: { is_deleted: true },
    })
  }

  /**
   * Get the URL for a file
   * @param fileId - ID of the storage_files record
   * @returns File URL or null if not found
   */
  static async getUrl(fileId: bigint): Promise<string | null> {
    const fileRecord = await prisma.storage_files.findUnique({
      where: { id: fileId, is_deleted: false },
      include: { provider: true },
    })

    if (!fileRecord) {
      return null
    }

    return `${fileRecord.provider.base_url}/${fileRecord.storage_key}`
  }

  /**
   * Get file record by ID
   * @param fileId - ID of the storage_files record
   * @returns File record or null if not found
   */
  static async getFile(fileId: bigint): Promise<{
    id: bigint
    url: string
    storageKey: string
    mimeType: string
    fileSize: number
    originalFilename: string
    referenceType: StorageReferenceType
    createdAt: Date
  } | null> {
    const fileRecord = await prisma.storage_files.findUnique({
      where: { id: fileId, is_deleted: false },
      include: { provider: true },
    })

    if (!fileRecord) {
      return null
    }

    return {
      id: fileRecord.id,
      url: `${fileRecord.provider.base_url}/${fileRecord.storage_key}`,
      storageKey: fileRecord.storage_key,
      mimeType: fileRecord.mime_type,
      fileSize: Number(fileRecord.file_size),
      originalFilename: fileRecord.original_filename,
      referenceType: fileRecord.reference_type,
      createdAt: fileRecord.created_at,
    }
  }
}

// Convenience function exports for easier usage
export const uploadFile = StorageService.upload.bind(StorageService)
export const uploadFromUrl = StorageService.uploadFromUrl.bind(StorageService)
export const deleteFile = StorageService.delete.bind(StorageService)
export const getFileUrl = StorageService.getUrl.bind(StorageService)
export const getFile = StorageService.getFile.bind(StorageService)

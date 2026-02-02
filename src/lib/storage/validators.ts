import { fileTypeFromBuffer } from "file-type"
import type { StorageReferenceType } from "@prisma/client"
import {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_MAX_FILE_SIZES,
  type StorageProviderRecord,
} from "./types"

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate file type against allowed types
 * @param mimeType - MIME type of the file
 * @param allowedTypes - Comma-separated list of allowed MIME types (supports wildcards like "image/*")
 * @returns Validation result
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: string | null
): ValidationResult {
  if (!allowedTypes) {
    return { valid: true }
  }

  const types = allowedTypes.split(",").map((t) => t.trim())

  for (const type of types) {
    if (type === mimeType) {
      return { valid: true }
    }
    // Handle wildcards like "image/*"
    if (type.endsWith("/*")) {
      const prefix = type.slice(0, -1)
      if (mimeType.startsWith(prefix)) {
        return { valid: true }
      }
    }
  }

  return {
    valid: false,
    error: `Invalid file type: ${mimeType}. Allowed types: ${allowedTypes}`,
  }
}

/**
 * Validate file size against maximum allowed size
 * @param fileSize - Size of the file in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns Validation result
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number | bigint | null
): ValidationResult {
  if (maxSize === null) {
    return { valid: true }
  }

  const max = typeof maxSize === "bigint" ? Number(maxSize) : maxSize

  if (fileSize > max) {
    const maxMB = (max / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File size exceeds ${maxMB}MB limit`,
    }
  }

  return { valid: true }
}

/**
 * Validate file for image uploads
 * @param mimeType - MIME type of the file
 * @param fileSize - Size of the file in bytes
 * @param referenceType - Type of file reference
 * @param provider - Optional provider config for custom limits
 * @returns Validation result
 */
export function validateImageFile(
  mimeType: string,
  fileSize: number,
  referenceType: StorageReferenceType,
  provider?: StorageProviderRecord | null
): ValidationResult {
  // Check MIME type - default to image types if provider doesn't specify
  const allowedTypes = provider?.allowed_types ?? ALLOWED_IMAGE_TYPES.join(",")
  const typeResult = validateFileType(mimeType, allowedTypes)
  if (!typeResult.valid) {
    return typeResult
  }

  // Check file size
  const maxSize =
    provider?.max_file_size ?? DEFAULT_MAX_FILE_SIZES[referenceType]
  const sizeResult = validateFileSize(fileSize, maxSize)
  if (!sizeResult.valid) {
    return sizeResult
  }

  return { valid: true }
}

/**
 * Check if a MIME type is an allowed image type
 * @param mimeType - MIME type to check
 * @returns True if it's an allowed image type
 */
export function isAllowedImageType(mimeType: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)
}

/**
 * Validate file content using magic bytes
 * @param buffer - File content buffer
 * @param allowedTypes - List of allowed MIME types
 * @returns Validation result
 */
export async function validateFileContent(
  buffer: Buffer | ArrayBuffer,
  allowedTypes: string[] | readonly string[] = ALLOWED_IMAGE_TYPES
): Promise<ValidationResult> {
  const type = await fileTypeFromBuffer(buffer)

  if (!type) {
    return { valid: false, error: "Could not determine file type from content" }
  }

  // Use validateFileType logic to support wildcards
  const allowedTypesStr = allowedTypes.join(",")
  const result = validateFileType(type.mime, allowedTypesStr)

  if (!result.valid) {
    return {
      valid: false,
      error: `Invalid file content type: ${type.mime}. Expected: ${allowedTypesStr}`,
    }
  }

  return { valid: true }
}

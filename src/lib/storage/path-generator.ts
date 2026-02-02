import type { StorageReferenceType } from "@prisma/client"
import { REFERENCE_TYPE_PATHS } from "./types"

/**
 * Get file extension from MIME type
 * @param contentType - MIME type of the file
 * @returns File extension (without dot)
 */
export function getExtensionFromMimeType(contentType: string): string {
  if (contentType.includes("png")) return "png"
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg"
  if (contentType.includes("webp")) return "webp"
  if (contentType.includes("gif")) return "gif"
  if (contentType.includes("svg")) return "svg"
  if (contentType.includes("ico")) return "ico"
  if (contentType.includes("pdf")) return "pdf"
  return "jpg"
}

/**
 * Generate a unique storage key based on reference type and options
 * @param referenceType - Type of file reference
 * @param contentType - MIME type of the file
 * @param options - Additional options for path generation
 * @returns Generated storage key
 */
export function generateStorageKey(
  referenceType: StorageReferenceType,
  contentType: string,
  options: {
    userId?: bigint
    subPath?: string
  } = {}
): string {
  const ext = getExtensionFromMimeType(contentType)
  const basePath = REFERENCE_TYPE_PATHS[referenceType]
  const uuid = crypto.randomUUID()

  switch (referenceType) {
    case "POST": {
      // POST: posts/YYYY/MM/{uuid}.{ext}
      const date = new Date()
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      return `${basePath}/${year}/${month}/${uuid}.${ext}`
    }

    case "AVATAR": {
      // AVATAR: avatars/{userId}.{ext}
      if (!options.userId) {
        throw new Error("userId is required for AVATAR reference type")
      }
      return `${basePath}/${options.userId.toString()}.${ext}`
    }

    case "EXPRESSION": {
      // EXPRESSION: expressions/{groupCode}/{uuid}.{ext}
      if (!options.subPath) {
        throw new Error(
          "subPath (groupCode) is required for EXPRESSION reference type"
        )
      }
      return `${basePath}/${options.subPath}/${uuid}.${ext}`
    }

    case "SITE": {
      // SITE: site/{uuid}.{ext}
      return `${basePath}/${uuid}.${ext}`
    }

    case "OTHER":
    default: {
      // OTHER: other/{uuid}.{ext}
      return `${basePath}/${uuid}.${ext}`
    }
  }
}

/**
 * Parse a storage key to extract components
 * @param key - Storage key to parse
 * @returns Parsed components (may be partial)
 */
export function parseStorageKey(key: string): {
  basePath: string
  filename: string
  extension: string
} {
  const parts = key.split("/")
  const filename = parts[parts.length - 1]
  const dotIndex = filename.lastIndexOf(".")
  const extension = dotIndex >= 0 ? filename.slice(dotIndex + 1) : ""
  const basePath = parts.slice(0, -1).join("/")

  return {
    basePath,
    filename,
    extension,
  }
}

import type { StorageProviderType, StorageReferenceType } from "@prisma/client"

/**
 * Storage path prefixes mapped to reference types
 */
export const REFERENCE_TYPE_PATHS: Record<StorageReferenceType, string> = {
  POST: "posts",
  AVATAR: "avatars",
  EXPRESSION: "expressions",
  SITE: "site",
  OTHER: "other",
}

/**
 * Options for uploading a file
 */
export interface UploadOptions {
  /** Reference type determines the storage path structure */
  referenceType: StorageReferenceType
  /** User ID performing the upload */
  userId: bigint
  /** Optional sub-path (e.g., groupCode for expressions) */
  subPath?: string
  /** Original filename (used for record keeping) */
  originalFilename?: string
  /** Specific provider ID to use (uses default if not specified) */
  providerId?: bigint
  /** Whether the file should be publicly accessible */
  isPublic?: boolean
  /** Optional metadata to store with the file */
  metadata?: Record<string, unknown>
}

/**
 * Result of a successful upload
 */
export interface UploadResult {
  /** Database ID of the storage_files record */
  id: bigint
  /** Public URL to access the file */
  url: string
  /** Storage key/path within the provider */
  storageKey: string
  /** SHA-256 hash of the file content */
  fileHash: string
  /** File size in bytes */
  fileSize: number
  /** MIME type of the file */
  mimeType: string
  /** Whether this was a deduplicated file (already existed) */
  deduplicated: boolean
}

/**
 * Configuration for a storage provider (from database JSON field)
 */
export interface LocalProviderConfig {
  base_path: string
}

export interface VercelBlobProviderConfig {
  token: string
}

export interface AliyunOSSProviderConfig {
  access_key_id: string
  access_key_secret: string
  region: string
  bucket: string
  endpoint?: string
}

export interface AWSS3ProviderConfig {
  access_key_id: string
  secret_access_key: string
  region: string
  bucket: string
  endpoint?: string
}

export interface TencentCOSProviderConfig {
  secret_id: string
  secret_key: string
  region: string
  bucket: string
}

export interface QiniuProviderConfig {
  access_key: string
  secret_key: string
  bucket: string
  zone?: string
}

export interface UpyunProviderConfig {
  operator: string
  password: string
  bucket: string
}

export interface MinIOProviderConfig {
  endpoint: string
  port?: number
  access_key: string
  secret_key: string
  bucket: string
  use_ssl?: boolean
}

export type ProviderConfig =
  | LocalProviderConfig
  | VercelBlobProviderConfig
  | AliyunOSSProviderConfig
  | AWSS3ProviderConfig
  | TencentCOSProviderConfig
  | QiniuProviderConfig
  | UpyunProviderConfig
  | MinIOProviderConfig

/**
 * Database provider record with typed config
 */
export interface StorageProviderRecord {
  id: bigint
  name: string
  provider_type: StorageProviderType
  config: ProviderConfig
  base_url: string
  is_default: boolean
  is_active: boolean
  max_file_size: bigint | null
  allowed_types: string | null
}

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

/**
 * Default max file sizes by reference type (in bytes)
 */
export const DEFAULT_MAX_FILE_SIZES: Record<StorageReferenceType, number> = {
  POST: 5 * 1024 * 1024, // 5MB
  AVATAR: 5 * 1024 * 1024, // 5MB
  EXPRESSION: 2 * 1024 * 1024, // 2MB
  SITE: 10 * 1024 * 1024, // 10MB
  OTHER: 5 * 1024 * 1024, // 5MB
}

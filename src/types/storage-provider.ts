import { StorageProviderType } from "@prisma/client"
import { getSensitiveFields } from "./storage-provider-config"

// 供应商配置类型定义
export interface LocalConfig {
  basePath: string
}

export interface VercelBlobConfig {
  token: string
}

export interface AliyunOSSConfig {
  accessKeyId: string
  accessKeySecret: string
  region: string
  bucket: string
  endpoint?: string
}

export interface AWSS3Config {
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucket: string
}

export interface TencentCOSConfig {
  secretId: string
  secretKey: string
  region: string
  bucket: string
}

export interface QiniuConfig {
  accessKey: string
  secretKey: string
  bucket: string
}

export interface UpyunConfig {
  operator: string
  password: string
  bucket: string
}

export interface MinioConfig {
  endpoint: string
  port: number
  accessKey: string
  secretKey: string
  bucket: string
  useSsl: boolean
}

export type StorageProviderConfig =
  | LocalConfig
  | VercelBlobConfig
  | AliyunOSSConfig
  | AWSS3Config
  | TencentCOSConfig
  | QiniuConfig
  | UpyunConfig
  | MinioConfig

// DTO 类型定义
export interface StorageProviderDTO {
  id: string
  name: string
  providerType: StorageProviderType
  config: StorageProviderConfig
  baseUrl: string
  isDefault: boolean
  isActive: boolean
  sort: number
  maxFileSize: string | null
  allowedTypes: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  fileCount?: number
}

// 敏感字段掩码函数
export function maskSensitiveConfig(
  providerType: StorageProviderType,
  config: StorageProviderConfig
): StorageProviderConfig {
  const masked = { ...config }
  const sensitiveFields = getSensitiveFields(providerType)

  for (const field of sensitiveFields) {
    if (field in masked) {
      ;(masked as Record<string, unknown>)[field] = ""
    }
  }

  return masked
}

// 配置验证函数
export function validateConfig(
  providerType: StorageProviderType,
  config: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  switch (providerType) {
    case "LOCAL":
      if (!config.basePath || typeof config.basePath !== "string") {
        errors.push("basePath is required")
      }
      break
    case "VERCEL_BLOB":
      if (!config.token || typeof config.token !== "string") {
        errors.push("token is required")
      }
      break
    case "ALIYUN_OSS":
      if (!config.accessKeyId || typeof config.accessKeyId !== "string") {
        errors.push("accessKeyId is required")
      }
      if (
        !config.accessKeySecret ||
        typeof config.accessKeySecret !== "string"
      ) {
        errors.push("accessKeySecret is required")
      }
      if (!config.region || typeof config.region !== "string") {
        errors.push("region is required")
      }
      if (!config.bucket || typeof config.bucket !== "string") {
        errors.push("bucket is required")
      }
      break
    case "AWS_S3":
      if (!config.accessKeyId || typeof config.accessKeyId !== "string") {
        errors.push("accessKeyId is required")
      }
      if (
        !config.secretAccessKey ||
        typeof config.secretAccessKey !== "string"
      ) {
        errors.push("secretAccessKey is required")
      }
      if (!config.region || typeof config.region !== "string") {
        errors.push("region is required")
      }
      if (!config.bucket || typeof config.bucket !== "string") {
        errors.push("bucket is required")
      }
      break
    case "TENCENT_COS":
      if (!config.secretId || typeof config.secretId !== "string") {
        errors.push("secretId is required")
      }
      if (!config.secretKey || typeof config.secretKey !== "string") {
        errors.push("secretKey is required")
      }
      if (!config.region || typeof config.region !== "string") {
        errors.push("region is required")
      }
      if (!config.bucket || typeof config.bucket !== "string") {
        errors.push("bucket is required")
      }
      break
    case "QINIU":
      if (!config.accessKey || typeof config.accessKey !== "string") {
        errors.push("accessKey is required")
      }
      if (!config.secretKey || typeof config.secretKey !== "string") {
        errors.push("secretKey is required")
      }
      if (!config.bucket || typeof config.bucket !== "string") {
        errors.push("bucket is required")
      }
      break
    case "UPYUN":
      if (!config.operator || typeof config.operator !== "string") {
        errors.push("operator is required")
      }
      if (!config.password || typeof config.password !== "string") {
        errors.push("password is required")
      }
      if (!config.bucket || typeof config.bucket !== "string") {
        errors.push("bucket is required")
      }
      break
    case "MINIO":
      if (!config.endpoint || typeof config.endpoint !== "string") {
        errors.push("endpoint is required")
      }
      if (!config.port || typeof config.port !== "number") {
        errors.push("port is required and must be a number")
      }
      if (!config.accessKey || typeof config.accessKey !== "string") {
        errors.push("accessKey is required")
      }
      if (!config.secretKey || typeof config.secretKey !== "string") {
        errors.push("secretKey is required")
      }
      if (!config.bucket || typeof config.bucket !== "string") {
        errors.push("bucket is required")
      }
      if (typeof config.useSsl !== "boolean") {
        errors.push("useSsl is required and must be a boolean")
      }
      break
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

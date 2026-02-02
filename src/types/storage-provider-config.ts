import { StorageProviderType } from "@prisma/client"

// 所有存储供应商类型
export const STORAGE_PROVIDER_TYPES: StorageProviderType[] = [
  "LOCAL",
  "VERCEL_BLOB",
  "ALIYUN_OSS",
  "AWS_S3",
  "TENCENT_COS",
  "QINIU",
  "UPYUN",
  "MINIO",
]

// 敏感字段映射
export const SENSITIVE_FIELDS_MAP: Record<StorageProviderType, string[]> = {
  LOCAL: [],
  VERCEL_BLOB: ["token"],
  ALIYUN_OSS: ["accessKeySecret"],
  AWS_S3: ["secretAccessKey"],
  TENCENT_COS: ["secretKey"],
  QINIU: ["secretKey"],
  UPYUN: ["password"],
  MINIO: ["secretKey"],
}

// 获取敏感字段
export function getSensitiveFields(
  providerType: StorageProviderType
): string[] {
  return SENSITIVE_FIELDS_MAP[providerType] || []
}

// 配置字段定义
export interface ConfigField {
  key: string
  label: string
  type: "text" | "password" | "number" | "checkbox"
  required: boolean
  placeholder?: string
  min?: number
  max?: number
}

// 配置字段映射
export type ConfigFieldsMap = Record<StorageProviderType, ConfigField[]>

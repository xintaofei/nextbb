import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 编码用户名用于 URL 路径
 * 处理空格和特殊字符，确保 URL 安全
 */
export function encodeUsername(username: string): string {
  return encodeURIComponent(username)
}

/**
 * 从 URL 路径中解码用户名
 * 处理空格和特殊字符
 */
export function decodeUsername(encodedUsername: string): string {
  try {
    return decodeURIComponent(encodedUsername)
  } catch {
    // 如果解码失败，返回原始值
    return encodedUsername
  }
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 编码用户名用于 URL 路径
 * 使用 encodeURIComponent 处理所有特殊字符（包括斜杠、空格、引号等）
 * 即使用户名包含危险字符（如 OAuth2 注册的用户），编码后也能安全地用于 URL 路由
 *
 * @example
 * encodeUsername("user/name") // "user%2Fname"
 * encodeUsername("用户 名") // "%E7%94%A8%E6%88%B7%20%E5%90%8D"
 */
export function encodeUsername(username: string): string {
  return encodeURIComponent(username)
}

/**
 * 从 URL 路径中解码用户名
 * 处理所有已编码的特殊字符，还原为原始用户名
 *
 * @example
 * decodeUsername("user%2Fname") // "user/name"
 * decodeUsername("%E7%94%A8%E6%88%B7%20%E5%90%8D") // "用户 名"
 */
export function decodeUsername(encodedUsername: string): string {
  try {
    return decodeURIComponent(encodedUsername)
  } catch {
    // 如果解码失败，返回原始值
    return encodedUsername
  }
}

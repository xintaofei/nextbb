/**
 * 参数解析工具函数
 */

/**
 * 安全解析 BigInt
 * 支持 string, number, bigint 输入
 * 解析失败返回 null
 */
export function safeParseBigInt(value: unknown): bigint | null {
  if (typeof value === "bigint") {
    return value
  }
  if (typeof value === "string") {
    // 检查是否为空字符串
    if (!value.trim()) return null
    try {
      return BigInt(value)
    } catch {
      return null
    }
  }
  if (typeof value === "number") {
    try {
      return BigInt(value)
    } catch {
      return null
    }
  }
  return null
}

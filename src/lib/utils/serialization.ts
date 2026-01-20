/**
 * 序列化工具函数
 * 用于处理 JSON 不支持的数据类型 (BigInt, Date)
 */

const BIGINT_PREFIX = "__BIGINT__:"
const DATE_PREFIX = "__DATE__:"

/**
 * 深度序列化对象，处理 BigInt 和 Date
 */
export function serializeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === "bigint") {
    return `${BIGINT_PREFIX}${data.toString()}`
  }

  if (data instanceof Date) {
    return `${DATE_PREFIX}${data.toISOString()}`
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeData(item))
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeData(value)
    }
    return result
  }

  return data
}

/**
 * 深度反序列化对象，恢复 BigInt 和 Date
 */
export function deserializeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === "string") {
    if (data.startsWith(BIGINT_PREFIX)) {
      return BigInt(data.slice(BIGINT_PREFIX.length))
    }
    if (data.startsWith(DATE_PREFIX)) {
      return new Date(data.slice(DATE_PREFIX.length))
    }
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => deserializeData(item))
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      result[key] = deserializeData(value)
    }
    return result
  }

  return data
}

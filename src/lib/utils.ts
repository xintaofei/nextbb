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

interface ProseMirrorNode {
  type: string
  text?: string
  content?: ProseMirrorNode[]
  [key: string]: unknown
}

/**
 * 从 ProseMirror/Milkdown JSON 内容中提取纯文本
 */
export function getPlainTextFromContent(content: string): string {
  if (!content) return ""
  try {
    // 尝试解析 JSON
    const json = JSON.parse(content)

    // 简单的 ProseMirror 结构验证
    if (typeof json !== "object" || !json.type) {
      return content
    }

    let text = ""
    const traverse = (node: ProseMirrorNode) => {
      if (node.type === "text" && typeof node.text === "string") {
        text += node.text
      } else if (node.type === "image") {
        text += "[图片]"
      } else if (node.type === "expression") {
        text += "[表情]"
      } else if (node.type === "hard_break") {
        text += " "
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse)
      }
    }

    if (json.content && Array.isArray(json.content)) {
      json.content.forEach(traverse)
    } else if (json.type === "doc" && json.content) {
      // Root doc
      json.content.forEach(traverse)
    }

    // 如果提取出的文本为空，可能是图片或其他非文本内容，或者解析失败
    // 如果提取成功，返回提取的文本
    // 如果原内容本来就是普通文本（虽然被误判为JSON但结构不对），这里可能会返回空，
    // 但前面的 JSON.parse 会失败从而返回原内容，所以这里主要是针对有效 JSON 结构。
    return text
  } catch {
    // 解析失败，说明不是 JSON，直接返回原内容（假设是纯文本或HTML）
    // 如果是 HTML，可能需要 stripHtml，但这里主要处理 JSON
    return content
  }
}

/**
 * 移除 HTML 标签并截取文本 (生成摘要)
 * 兼容 ProseMirror JSON 和 HTML 字符串
 */
export function stripHtmlAndTruncate(
  content: string,
  maxLength: number = 150
): string {
  // 1. 尝试从 JSON 中提取纯文本 (针对 Milkdown/ProseMirror 数据)
  let text = getPlainTextFromContent(content)

  // 2. 处理 HTML 内容
  if (text === content) {
    // 如果 getPlainTextFromContent 返回了原内容，说明不是 JSON (或者解析失败/结构不符)
    // 尝试作为 HTML 处理
    text = text
      // 替换图片
      .replace(/<img[^>]*>/g, "[图片]")
      // 替换视频/iframe
      .replace(/<(video|iframe)[^>]*>.*?<\/\1>/g, "[视频]")
      .replace(/<(video|iframe)[^>]*>/g, "[视频]")
      // 替换换行符为空格
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<\/div>/gi, " ")
      // 移除其他标签
      .replace(/<[^>]*>/g, "")
      // 解码 HTML 实体 (简单的几个)
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      // 移除多余空白
      .replace(/\s+/g, " ")
      .trim()
  } else {
    // 如果是 JSON 提取出的文本，也进行简单的空白清理
    text = text.replace(/\s+/g, " ").trim()
  }

  if (text.length === 0) {
    return ""
  }

  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + "..."
}

/**
 * 将文本转换为 URL 友好的 slug
 * 支持中文（保留中文不被移除），将空格转换为连字符
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\t\n]+/g, "-") // 空白转连字符
    .replace(/[^\w\u4e00-\u9fa5\-]+/g, "") // 移除非单词、非中文、非连字符的字符
    .replace(/\-\-+/g, "-") // 合并连续连字符
    .replace(/^-+/, "") // 移除开头连字符
    .replace(/-+$/, "") // 移除结尾连字符
}

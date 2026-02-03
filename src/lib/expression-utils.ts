/**
 * 表情系统工具函数
 */

/**
 * 生成表情图片存储路径
 * @param groupCode 表情组代码
 * @param expressionCode 表情代码
 * @param isAnimated 是否为动画表情
 * @returns 存储路径，如 expressions/default/smile.webp
 */
export function getExpressionImagePath(
  groupCode: string,
  expressionCode: string,
  isAnimated: boolean
): string {
  const ext = isAnimated ? "gif" : "webp"
  return `expressions/${groupCode}/${expressionCode}.${ext}`
}

/**
 * 生成表情图片 URL
 * @param groupCode 表情组代码
 * @param expressionCode 表情代码
 * @param isAnimated 是否为动画表情
 * @returns 图片路径（Vercel Blob 会自动添加域名）
 */
export function getExpressionImageUrl(
  groupCode: string,
  expressionCode: string,
  isAnimated: boolean
): string {
  return getExpressionImagePath(groupCode, expressionCode, isAnimated)
}

const EXPRESSION_THUMB_SUFFIX = "_thumb"

/**
 * 生成表情缩略图存储路径（固定为 WebP）
 * @param groupCode 表情组代码
 * @param expressionCode 表情代码
 * @returns 存储路径，如 expressions/default/smile_thumb.webp
 */
export function getExpressionThumbnailPath(
  groupCode: string,
  expressionCode: string
): string {
  return `expressions/${groupCode}/${expressionCode}${EXPRESSION_THUMB_SUFFIX}.webp`
}

/**
 * 根据原始图片路径生成缩略图路径（固定为 WebP）
 * @param imagePath 原始图片路径/URL
 * @returns 缩略图路径
 */
export function getExpressionThumbnailPathFromImagePath(
  imagePath: string
): string {
  const [base, query] = imagePath.split("?")
  const dotIndex = base.lastIndexOf(".")
  const basePath = dotIndex === -1 ? base : base.slice(0, dotIndex)
  const thumbnail = `${basePath}${EXPRESSION_THUMB_SUFFIX}.webp`
  return query ? `${thumbnail}?${query}` : thumbnail
}

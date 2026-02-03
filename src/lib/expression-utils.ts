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

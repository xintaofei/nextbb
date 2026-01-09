/**
 * 基础翻译接口
 * 所有翻译表都应该包含这些字段
 */
export interface BaseTranslation {
  locale: string
  is_source: boolean
}

/**
 * 分类翻译类型
 */
export interface CategoryTranslation extends BaseTranslation {
  name: string
  description?: string | null
}

/**
 * 生成多语言查询配置
 * @param locale 当前语言标识
 * @param fields 需要查询的翻译字段，例如 { name: true, description: true }
 * @returns Prisma 查询配置对象
 *
 * @example
 * // 查询分类翻译
 * translations: getTranslationsQuery(locale, { name: true, description: true })
 *
 * @example
 * // 查询标签翻译（假设只有 name 字段）
 * translations: getTranslationsQuery(locale, { name: true })
 */
export function getTranslationsQuery<T extends Record<string, boolean>>(
  locale: string,
  fields: T
) {
  return {
    where: {
      OR: [{ locale, is_source: false }, { is_source: true }],
    },
    select: {
      locale: true,
      is_source: true,
      ...fields,
    },
    take: 2,
  }
}

/**
 * 生成分类多语言查询配置（向后兼容的便捷函数）
 * @deprecated 建议使用 getTranslationsQuery 以支持更多实体类型
 */
export function getCategoryTranslationsQuery(
  locale: string,
  fields: { name?: boolean; description?: boolean } = {
    name: true,
    description: true,
  }
) {
  return getTranslationsQuery(locale, fields)
}

/**
 * 从翻译列表中选择合适的翻译
 * 优先返回当前语言的翻译，如果不存在则返回源语言翻译
 *
 * @param translations 翻译列表
 * @param locale 当前语言标识
 * @returns 选中的翻译对象，如果没有找到则返回 null
 *
 * @example
 * const translation = selectTranslation(category.translations, locale)
 * const categoryName = translation?.name || "未命名"
 */
export function selectTranslation<T extends BaseTranslation>(
  translations: T[],
  locale: string
): T | null {
  // 优先返回当前语言的非源语言翻译
  const localeTranslation = translations.find(
    (t) => t.locale === locale && !t.is_source
  )
  if (localeTranslation) return localeTranslation

  // 回退到源语言翻译
  const sourceTranslation = translations.find((t) => t.is_source)
  if (sourceTranslation) return sourceTranslation

  // 如果都没有，返回第一个可用的翻译
  return translations[0] || null
}

/**
 * 从翻译列表中提取字段值
 * 优先返回当前语言的值，如果不存在则返回源语言的值
 *
 * @param translations 翻译列表
 * @param locale 当前语言标识
 * @param field 要提取的字段名
 * @param defaultValue 默认值
 * @returns 字段值
 *
 * @example
 * // 获取分类名称
 * const name = getTranslationField(category.translations, locale, "name", "")
 *
 * @example
 * // 获取分类描述
 * const desc = getTranslationField(category.translations, locale, "description", null)
 */
export function getTranslationField<
  T extends BaseTranslation,
  K extends keyof T,
>(translations: T[], locale: string, field: K, defaultValue: T[K]): T[K] {
  const translation = selectTranslation(translations, locale)
  return translation ? translation[field] : defaultValue
}

/**
 * 批量提取多个字段的值
 * 一次性获取翻译对象的多个字段
 *
 * @param translations 翻译列表
 * @param locale 当前语言标识
 * @param fields 要提取的字段列表
 * @returns 包含所有字段的对象
 *
 * @example
 * const { name, description } = getTranslationFields(
 *   category.translations,
 *   locale,
 *   { name: "", description: null }
 * )
 */
export function getTranslationFields<
  T extends BaseTranslation,
  K extends Partial<T>,
>(translations: T[], locale: string, fields: K): K {
  const translation = selectTranslation(translations, locale)
  if (!translation) return fields

  const result = { ...fields }
  for (const key in fields) {
    if (key in translation) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result[key] = (translation as any)[key]
    }
  }
  return result
}

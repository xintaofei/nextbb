import {
  BaseTranslation,
  getTranslationField,
  selectTranslation,
} from "@/lib/locale"

export interface TopicTranslation extends BaseTranslation {
  title: string
}

export interface PostTranslation extends BaseTranslation {
  content_html: string
}

/**
 * 根据当前语言获取话题标题
 * 优先返回当前语言的翻译，如果不存在则返回源语言翻译
 */
export function getTopicTitle(
  translations: TopicTranslation[] | undefined | null,
  locale: string
): string {
  if (!translations) return ""
  return getTranslationField(translations, locale, "title", "")
}

/**
 * 根据当前语言获取帖子 HTML 内容
 * 优先返回当前语言的翻译，如果不存在则返回源语言翻译
 */
export function getPostHtmlWithLocale(
  translations: PostTranslation[] | undefined | null,
  locale: string
): { contentHtml: string; contentLocale: string } {
  if (!translations || translations.length === 0)
    return { contentHtml: "", contentLocale: "" }
  const translation = selectTranslation(translations, locale)
  return {
    contentHtml: translation?.content_html || "",
    contentLocale: translation?.locale || "",
  }
}

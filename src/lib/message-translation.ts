import { BaseTranslation, selectTranslation } from "@/lib/locale"

export interface MessageTranslation extends BaseTranslation {
  content_html: string
}

export function getMessageHtml(
  translations: MessageTranslation[] | undefined | null,
  locale: string
): string {
  const { contentHtml } = getMessageHtmlWithLocale(translations, locale)
  return contentHtml
}

export function getMessageHtmlWithLocale(
  translations: MessageTranslation[] | undefined | null,
  locale: string
): { contentHtml: string; contentLocale: string } {
  if (!translations || translations.length === 0) {
    return { contentHtml: "", contentLocale: "" }
  }
  const translation = selectTranslation(translations, locale)
  return {
    contentHtml: translation?.content_html || "",
    contentLocale: translation?.locale || "",
  }
}

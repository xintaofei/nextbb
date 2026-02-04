import { TranslationTaskPriority } from "@prisma/client"

/**
 * 基础翻译创建事件
 */
export interface BaseTranslationCreatedEvent {
  taskId: bigint
  entityId: bigint
  targetLocale: string
  priority?: TranslationTaskPriority
}

/**
 * 特定实体类型的翻译事件
 */
export type TranslationCategoryCreatedEvent = BaseTranslationCreatedEvent
export type TranslationTagCreatedEvent = BaseTranslationCreatedEvent
export type TranslationBadgeCreatedEvent = BaseTranslationCreatedEvent
export type TranslationTopicCreatedEvent = BaseTranslationCreatedEvent
export type TranslationPostCreatedEvent = BaseTranslationCreatedEvent
export type TranslationExpressionGroupCreatedEvent = BaseTranslationCreatedEvent
export type TranslationExpressionCreatedEvent = BaseTranslationCreatedEvent

/**
 * 翻译系统事件映射
 */
export interface TranslationEventMap extends Record<string, unknown> {
  // 按实体类型区分
  category: TranslationCategoryCreatedEvent
  tag: TranslationTagCreatedEvent
  badge: TranslationBadgeCreatedEvent
  topic: TranslationTopicCreatedEvent
  post: TranslationPostCreatedEvent
  expression_group: TranslationExpressionGroupCreatedEvent
  expression: TranslationExpressionCreatedEvent
}

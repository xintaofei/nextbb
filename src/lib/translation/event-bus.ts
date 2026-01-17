import { RedisStreamBus } from "@/lib/redis/stream-bus"
import { TranslationEntityType, TranslationTaskPriority } from "@prisma/client"

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
}

/**
 * 全局状态类型
 */
interface TranslationBusState {
  bus: RedisStreamBus<TranslationEventMap>
}

const globalForTranslation = globalThis as unknown as {
  translationBusState: TranslationBusState
}

// 初始化单例
if (!globalForTranslation.translationBusState) {
  globalForTranslation.translationBusState = {
    bus: new RedisStreamBus<TranslationEventMap>({
      streamPrefix: "translation:stream:",
      consumerGroup: "translation-workers",
      maxStreamLength: 5000, // 翻译任务可能需要保存更久
    }),
  }
}

/**
 * 翻译系统事件总线
 */
export const translationBus = globalForTranslation.translationBusState.bus

/**
 * 辅助函数示例
 */
export const TranslationEvents = {
  createTask: async (
    entityType: TranslationEntityType,
    data: BaseTranslationCreatedEvent
  ) => {
    switch (entityType) {
      case TranslationEntityType.CATEGORY:
        await translationBus.emit("category", data)
        break
      case TranslationEntityType.TAG:
        await translationBus.emit("tag", data)
        break
      case TranslationEntityType.BADGE:
        await translationBus.emit("badge", data)
        break
      case TranslationEntityType.TOPIC:
        await translationBus.emit("topic", data)
        break
      case TranslationEntityType.POST:
        await translationBus.emit("post", data)
        break
    }
  },
}

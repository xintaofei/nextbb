import { EventBusFactory } from "@/lib/event-bus/factory"
import { EventBusType } from "@/lib/event-bus/types"
import { TranslationEntityType } from "@prisma/client"
import { BaseTranslationCreatedEvent, TranslationEventMap } from "./types"

/**
 * 翻译系统事件总线
 * 使用工厂模式管理单例
 */
const bus = EventBusFactory.getBus<TranslationEventMap>("translation", {
  type:
    process.env.IS_SERVERLESS === "true" || process.env.IS_SERVERLESS === "1"
      ? EventBusType.Local
      : EventBusType.Redis,
  streamPrefix: "translation:stream:",
  consumerGroup: "translation-workers",
  maxStreamLength: 5000, // 翻译任务可能需要保存更久
})

/**
 * 翻译事件管理器
 *
 * 封装底层的 EventBus，提供类型安全的方法
 */
export class TranslationEvents {
  /**
   * 初始化总线
   */
  static async initialize(): Promise<void> {
    await bus.initialize()
  }

  /**
   * 订阅事件
   */
  static on<K extends keyof TranslationEventMap>(
    eventType: K,
    handler: (data: TranslationEventMap[K]) => Promise<void>
  ): void {
    bus.on(eventType, handler)
  }

  /**
   * 创建翻译任务
   */
  static async createTask(
    entityType: TranslationEntityType,
    data: BaseTranslationCreatedEvent
  ): Promise<void> {
    switch (entityType) {
      case TranslationEntityType.CATEGORY:
        await bus.emit("category", data)
        break
      case TranslationEntityType.TAG:
        await bus.emit("tag", data)
        break
      case TranslationEntityType.BADGE:
        await bus.emit("badge", data)
        break
      case TranslationEntityType.TOPIC:
        await bus.emit("topic", data)
        break
      case TranslationEntityType.POST:
        await bus.emit("post", data)
        break
      case TranslationEntityType.EXPRESSION_GROUP:
        await bus.emit("expression_group", data)
        break
      case TranslationEntityType.EXPRESSION:
        await bus.emit("expression", data)
        break
    }
  }
}

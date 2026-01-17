import { RedisStreamBus } from "@/lib/redis/stream-bus"

/**
 * 翻译任务事件定义
 */
export interface TranslationTaskEventData {
  taskId: string
  content: string
  targetLanguage: string
  priority?: number
}

export interface TranslationResultEventData {
  taskId: string
  result: string
  originalContent: string
}

/**
 * 翻译系统事件映射
 */
export interface TranslationEventMap extends Record<string, unknown> {
  "translation:task:created": TranslationTaskEventData
  "translation:task:completed": TranslationResultEventData
  "translation:task:failed": { taskId: string; error: string }
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
  createTask: async (data: TranslationTaskEventData) => {
    await translationBus.emit("translation:task:created", data)
  },

  onTaskCreated: (
    handler: (data: TranslationTaskEventData) => Promise<void>
  ) => {
    translationBus.on("translation:task:created", handler)
  },
}

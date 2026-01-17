import { RedisStreamBus } from "@/lib/redis/stream-bus"
import type { AutomationEventMap } from "./events"

/**
 * 全局状态类型，用于在 Next.js 开发模式下保持单例状态
 */
interface RedisEventBusState {
  bus: RedisStreamBus<AutomationEventMap>
}

/**
 * 使用 globalThis 确保在开发模式下状态持久化
 */
const globalForEventBus = globalThis as unknown as {
  automationRedisEventBus: RedisEventBusState
}

// 初始化或获取全局状态
if (!globalForEventBus.automationRedisEventBus) {
  globalForEventBus.automationRedisEventBus = {
    bus: new RedisStreamBus<AutomationEventMap>({
      streamPrefix: "automation:stream:",
      consumerGroup: "automation-workers",
    }),
  }
}

const bus = globalForEventBus.automationRedisEventBus.bus

/**
 * Redis Stream 消息队列管理器 (Automation Wrapper)
 *
 * 这是一个包装器类，使用通用的 RedisStreamBus 实现
 * 保持原有的静态 API 以兼容现有代码
 */
export class RedisEventBus {
  /**
   * 初始化 Stream 系统
   */
  static async initialize(): Promise<void> {
    await bus.initialize()
  }

  /**
   * 订阅事件
   */
  static on<K extends keyof AutomationEventMap>(
    eventType: K,
    handler: (data: AutomationEventMap[K]) => Promise<void>
  ): void {
    bus.on(eventType, handler)
  }

  /**
   * 发布事件到 Stream
   */
  static async emit<K extends keyof AutomationEventMap>(
    eventType: K,
    data: AutomationEventMap[K]
  ): Promise<void> {
    await bus.emit(eventType, data)
  }

  /**
   * 取消订阅
   */
  static off<K extends keyof AutomationEventMap>(eventType: K): void {
    bus.off(eventType)
  }

  /**
   * 停止处理
   */
  static stop(): void {
    bus.stop()
  }
}

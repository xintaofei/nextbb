import { getRedisClient, getRedisSubscriber } from "@/lib/redis"
import type { AutomationEventMap } from "./events"

/**
 * Redis 消息队列管理器
 *
 * 使用 Redis Pub/Sub 实现跨进程的事件通信
 */
export class RedisEventBus {
  private static subscriber = getRedisSubscriber()
  private static publisher = getRedisClient()
  private static isInitialized = false

  /**
   * 事件处理器映射
   */
  private static handlers: Map<
    string,
    Array<(data: unknown) => Promise<void>>
  > = new Map()

  /**
   * Redis 频道前缀
   */
  private static readonly CHANNEL_PREFIX = "automation:event:"

  /**
   * 初始化订阅系统
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    // 监听 Redis 消息
    this.subscriber.on("message", async (channel: string, message: string) => {
      try {
        const eventType = channel.replace(this.CHANNEL_PREFIX, "")
        const handlers = this.handlers.get(eventType)

        if (!handlers || handlers.length === 0) {
          return
        }

        // 解析消息数据并恢复 BigInt
        const rawData = JSON.parse(message)
        const data = this.deserializeData(rawData as Record<string, unknown>)

        // 执行所有处理器
        await Promise.all(handlers.map((handler) => handler(data)))
      } catch (error) {
        console.error("[RedisEventBus] 处理消息失败:", error)
      }
    })

    this.isInitialized = true
  }

  /**
   * 订阅事件
   */
  static on<K extends keyof AutomationEventMap>(
    eventType: K,
    handler: (data: AutomationEventMap[K]) => Promise<void>
  ): void {
    const eventKey = String(eventType)

    // 注册处理器
    if (!this.handlers.has(eventKey)) {
      this.handlers.set(eventKey, [])
    }
    this.handlers.get(eventKey)!.push(handler)

    // 订阅 Redis 频道
    const channel = this.CHANNEL_PREFIX + eventKey
    this.subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error(`[RedisEventBus] 订阅频道 ${channel} 失败:`, err)
      }
    })
  }

  /**
   * 发布事件
   */
  static async emit<K extends keyof AutomationEventMap>(
    eventType: K,
    data: AutomationEventMap[K]
  ): Promise<void> {
    try {
      const channel = this.CHANNEL_PREFIX + String(eventType)
      const optimizedData = this.serializeData(data)
      const message = JSON.stringify(optimizedData)

      await this.publisher.publish(channel, message)
    } catch (error) {
      console.error(
        `[RedisEventBus] 发布事件 ${String(eventType)} 失败:`,
        error
      )
      throw error
    }
  }

  /**
   * 序列化数据（转换 BigInt）
   */
  private static serializeData(data: unknown): unknown {
    return JSON.parse(
      JSON.stringify(data, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    )
  }

  /**
   * 反序列化数据（恢复 BigInt）
   *
   * 智能识别 ID 字段并转换为 BigInt
   */
  private static deserializeData(data: Record<string, unknown>): unknown {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
      // 识别 ID 字段：以 Id 或 _id 结尾的长数字字符串
      if (
        typeof value === "string" &&
        /^\d{13,}$/.test(value) &&
        (key.endsWith("Id") || key.endsWith("_id"))
      ) {
        result[key] = BigInt(value)
      } else if (typeof value === "object" && value !== null) {
        // 递归处理嵌套对象
        result[key] = this.deserializeData(value as Record<string, unknown>)
      } else {
        result[key] = value
      }
    }

    return result
  }

  /**
   * 取消订阅
   */
  static off<K extends keyof AutomationEventMap>(eventType: K): void {
    const eventKey = String(eventType)
    const channel = this.CHANNEL_PREFIX + eventKey

    this.handlers.delete(eventKey)
    this.subscriber.unsubscribe(channel)
  }
}

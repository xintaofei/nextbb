import type Redis from "ioredis"
import { getRedisClient } from "@/lib/redis"
import type { AutomationEventMap } from "./events"

/**
 * 全局状态类型，用于在 Next.js 开发模式下保持单例状态
 */
interface RedisEventBusState {
  client: Redis | null
  isInitialized: boolean
  isProcessing: boolean
  handlers: Map<string, Array<(data: unknown) => Promise<void>>>
  pendingConsumerGroups: Set<string>
  consumerName: string | null
}

/**
 * 使用 globalThis 确保在开发模式下状态持久化
 */
const globalForEventBus = globalThis as unknown as {
  redisEventBusState: RedisEventBusState
}

// 初始化或获取全局状态
if (!globalForEventBus.redisEventBusState) {
  globalForEventBus.redisEventBusState = {
    client: null,
    isInitialized: false,
    isProcessing: false,
    handlers: new Map(),
    pendingConsumerGroups: new Set(),
    consumerName: null,
  }
}

const state = globalForEventBus.redisEventBusState

/**
 * Redis Stream 消息队列管理器
 *
 * 使用 Redis Stream 实现跨进程的事件通信，避免 Pub/Sub 的重复消费问题
 * 使用 MAXLEN ~ 修剪保持内存占用在可控范围内（约 30MB）
 */
export class RedisEventBus {
  /**
   * 消费者组名
   */
  private static readonly CONSUMER_GROUP = "automation-workers"

  /**
   * Stream 最大长度（使用 ~ 符号进行近似修剪，节省性能）
   */
  private static readonly MAX_STREAM_LENGTH = 1000

  /**
   * Stream 键名前缀
   */
  private static readonly STREAM_PREFIX = "automation:stream:"

  /**
   * 轮询间隔（毫秒）
   */
  private static readonly POLL_INTERVAL = 1000

  /**
   * 批量读取数量
   */
  private static readonly BATCH_SIZE = 10

  /**
   * 获取 Redis 客户端
   */
  private static getClient(): Redis {
    if (!state.client) {
      state.client = getRedisClient()
    }
    return state.client
  }

  /**
   * 获取消费者名称
   */
  private static getConsumerName(): string {
    if (!state.consumerName) {
      state.consumerName = `worker-${process.pid}-${Date.now()}`
    }
    return state.consumerName
  }

  /**
   * 初始化 Stream 系统
   */
  static async initialize(): Promise<void> {
    if (state.isInitialized) {
      return
    }

    // 先创建所有消费者组（必须在启动处理循环之前完成）
    for (const eventType of state.pendingConsumerGroups) {
      try {
        await this.ensureConsumerGroup(eventType)
      } catch (err) {
        console.error(`[RedisEventBus] 创建消费者组失败: ${eventType}`, err)
      }
    }
    state.pendingConsumerGroups.clear()

    // 启动消息处理循环
    this.startProcessing()

    state.isInitialized = true
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
    if (!state.handlers.has(eventKey)) {
      state.handlers.set(eventKey, [])
    }
    state.handlers.get(eventKey)!.push(handler)

    // 记录需要创建消费者组的事件类型
    state.pendingConsumerGroups.add(eventKey)
  }

  /**
   * 发布事件到 Stream
   */
  static async emit<K extends keyof AutomationEventMap>(
    eventType: K,
    data: AutomationEventMap[K]
  ): Promise<void> {
    try {
      const streamKey = this.STREAM_PREFIX + String(eventType)
      const optimizedData = this.serializeData(data)
      const message = JSON.stringify(optimizedData)

      // 使用 XADD 添加消息，同时使用 MAXLEN ~ 进行近似修剪
      await this.getClient().xadd(
        streamKey,
        "MAXLEN",
        "~",
        this.MAX_STREAM_LENGTH.toString(),
        "*", // 自动生成 ID
        "data",
        message,
        "timestamp",
        Date.now().toString()
      )
    } catch (error) {
      console.error(
        `[RedisEventBus] 发布事件 ${String(eventType)} 失败:`,
        error
      )
      throw error
    }
  }

  /**
   * 启动消息处理循环
   */
  private static startProcessing(): void {
    if (state.isProcessing) {
      return
    }

    state.isProcessing = true

    // 异步启动处理循环
    this.processMessages().catch((err) => {
      console.error("[RedisEventBus] 消息处理循环异常:", err)
      state.isProcessing = false
    })
  }

  /**
   * 消息处理循环
   */
  private static async processMessages(): Promise<void> {
    while (state.isProcessing) {
      try {
        // 每次循环都动态获取当前的事件类型列表
        const eventTypes = Array.from(state.handlers.keys())

        // 处理所有已订阅的事件类型
        for (const eventType of eventTypes) {
          await this.processEventType(eventType)
        }

        // 等待一段时间再进行下次轮询
        await this.sleep(this.POLL_INTERVAL)
      } catch (error) {
        console.error("[RedisEventBus] 处理消息失败:", error)
        await this.sleep(this.POLL_INTERVAL)
      }
    }
  }

  /**
   * 处理特定事件类型的消息
   */
  private static async processEventType(eventType: string): Promise<void> {
    const streamKey = this.STREAM_PREFIX + eventType
    const handlers = state.handlers.get(eventType)

    if (!handlers || handlers.length === 0) {
      return
    }

    try {
      // 使用 xreadgroup 读取新消息（从未分配给任何消费者的消息）
      const messages = (await this.getClient().xreadgroup(
        "GROUP",
        this.CONSUMER_GROUP,
        this.getConsumerName(),
        "COUNT",
        this.BATCH_SIZE.toString(),
        "BLOCK",
        "1000", // 阻塞 1 秒等待新消息
        "STREAMS",
        streamKey,
        ">" // 只读取新消息
      )) as Array<[string, Array<[string, string[]]>]> | null

      if (!messages || messages.length === 0) {
        return
      }

      // 处理读取到的消息
      for (const [, entries] of messages) {
        for (const [messageId, fields] of entries) {
          try {
            // 解析字段数组为对象
            const messageData: Record<string, string> = {}
            for (let i = 0; i < fields.length; i += 2) {
              messageData[fields[i]] = fields[i + 1]
            }

            const rawData = messageData.data
            if (typeof rawData !== "string") {
              continue
            }

            // 解析消息数据
            const parsedData = JSON.parse(rawData)
            const data = this.deserializeData(
              parsedData as Record<string, unknown>
            )

            // 执行所有处理器
            await Promise.all(
              handlers.map((handler: (data: unknown) => Promise<void>) =>
                handler(data)
              )
            )

            // 确认消息已处理
            await this.getClient().xack(
              streamKey,
              this.CONSUMER_GROUP,
              messageId
            )
          } catch (error) {
            console.error(`[RedisEventBus] 处理消息失败:`, error)
            // 继续处理下一条消息
          }
        }
      }
    } catch (error: unknown) {
      // 如果消费者组不存在，创建它
      if (error && typeof error === "object" && "message" in error) {
        const errMsg = (error as { message: string }).message
        if (errMsg.includes("NOGROUP")) {
          await this.ensureConsumerGroup(eventType)
        } else {
          console.error(
            `[RedisEventBus] xreadgroup 错误 (${eventType}):`,
            errMsg
          )
        }
      } else {
        console.error(`[RedisEventBus] 未知错误 (${eventType}):`, error)
      }
    }
  }

  /**
   * 确保消费者组存在
   */
  private static async ensureConsumerGroup(eventType: string): Promise<void> {
    const streamKey = this.STREAM_PREFIX + eventType

    try {
      // 尝试创建消费者组（从 0 开始读取历史消息）
      await this.getClient().xgroup(
        "CREATE",
        streamKey,
        this.CONSUMER_GROUP,
        "0",
        "MKSTREAM" // 如果 stream 不存在则创建
      )
    } catch (error: unknown) {
      // 如果消费者组已存在，忽略错误并继续
      if (error && typeof error === "object" && "message" in error) {
        const errMsg = (error as { message: string }).message
        if (errMsg.includes("BUSYGROUP")) {
          // 消费者组已存在，忽略
        } else {
          console.error(
            `[RedisEventBus] 创建消费者组失败: ${streamKey}`,
            errMsg
          )
          throw error
        }
      }
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
    state.handlers.delete(eventKey)
  }

  /**
   * 停止处理
   */
  static stop(): void {
    state.isProcessing = false
  }

  /**
   * 工具方法：延迟
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

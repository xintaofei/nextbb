import type Redis from "ioredis"
import { getRedisClient } from "./index"
import crypto from "crypto"
import { serializeData, deserializeData } from "@/lib/utils/serialization"

export interface RedisEventEmitterOptions {
  streamPrefix: string
  consumerGroup: string
  consumerName?: string
  maxStreamLength?: number
  pollInterval?: number
  batchSize?: number
  maxRestartAttempts?: number
  restartInterval?: number
}

/**
 * 通用 Redis Stream 消息队列管理器
 *
 * 使用 Redis Stream 实现跨进程的事件通信
 * 支持泛型事件映射，可用于不同的业务场景
 */
export class RedisEventEmitter<TEventMap extends Record<string, unknown>> {
  private options: Required<Omit<RedisEventEmitterOptions, "consumerName">> & {
    consumerName: string | null
  }
  private isInitialized = false
  private isProcessing = false
  private handlers = new Map<string, Array<(data: unknown) => Promise<void>>>()
  private pendingConsumerGroups = new Set<string>()
  private restartAttempts = 0
  private lastRestartTime = 0

  constructor(options: RedisEventEmitterOptions) {
    this.options = {
      streamPrefix: options.streamPrefix,
      consumerGroup: options.consumerGroup,
      consumerName: options.consumerName || null,
      maxStreamLength: options.maxStreamLength || 1000,
      pollInterval: options.pollInterval || 1000,
      batchSize: options.batchSize || 10,
      maxRestartAttempts: options.maxRestartAttempts || 5,
      restartInterval: options.restartInterval || 5000,
    }
  }

  /**
   * 获取 Redis 客户端
   */
  private getClient(): Redis {
    return getRedisClient()
  }

  /**
   * 获取消费者名称
   */
  private getConsumerName(): string {
    if (!this.options.consumerName) {
      const randomId = crypto.randomBytes(4).toString("hex")
      this.options.consumerName = `worker-${process.pid}-${Date.now()}-${randomId}`
    }
    return this.options.consumerName
  }

  /**
   * 初始化 Stream 系统
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    // 先创建所有消费者组
    for (const eventType of this.pendingConsumerGroups) {
      try {
        await this.ensureConsumerGroup(eventType)
      } catch (err) {
        console.error(
          `[RedisStreamBus:${this.options.consumerGroup}] 创建消费者组失败: ${eventType}`,
          err
        )
      }
    }
    this.pendingConsumerGroups.clear()

    // 启动消息处理循环
    this.startProcessing()

    this.isInitialized = true
  }

  /**
   * 恢复未处理的消息 (PEL)
   *
   * 使用 XAUTOCLAIM 扫描并接管消费者组中长时间未处理的消息
   * 即使消息属于已崩溃的旧消费者（因为消费者名称是随机的），也能被接管处理
   */
  private async recoverPendingMessages(): Promise<void> {
    const eventTypes = Array.from(this.handlers.keys())
    if (eventTypes.length === 0) return

    console.log(
      `[RedisStreamBus:${this.options.consumerGroup}] 开始检查并恢复失效消费者遗留的消息 (XAUTOCLAIM)...`
    )

    for (const eventType of eventTypes) {
      const streamKey = this.options.streamPrefix + eventType
      let cursor = "0-0"

      try {
        // 循环读取直到游标回到 0-0，表示扫描完一遍 PEL
        while (true) {
          // XAUTOCLAIM key group consumer min-idle-time start [COUNT count]
          // 这里的 min-idle-time 设为 60000ms (1分钟)，认为超过1分钟未 ACK 的消息是处理失败或消费者崩溃
          const result = (await this.getClient().xautoclaim(
            streamKey,
            this.options.consumerGroup,
            this.getConsumerName(),
            60000,
            cursor,
            "COUNT",
            50
          )) as [string, Array<[string, string[]]>]

          const nextCursor = result[0]
          const entries = result[1]

          if (entries && entries.length > 0) {
            console.log(
              `[RedisStreamBus:${this.options.consumerGroup}] 从流 ${eventType} 恢复了 ${entries.length} 条超时消息`
            )

            // 处理这批抢救回来的消息
            await this.processStreamEntries(eventType, streamKey, entries)
          }

          cursor = nextCursor
          if (cursor === "0-0") break
        }
      } catch (error) {
        console.error(
          `[RedisStreamBus:${this.options.consumerGroup}] 恢复消息失败 ${eventType}:`,
          error
        )
      }
    }
  }

  /**
   * 订阅事件
   */
  on<K extends keyof TEventMap>(
    eventType: K,
    handler: (data: TEventMap[K]) => Promise<void>
  ): void {
    const eventKey = String(eventType)

    // 注册处理器
    if (!this.handlers.has(eventKey)) {
      this.handlers.set(eventKey, [])
    }
    this.handlers
      .get(eventKey)!
      .push(handler as unknown as (data: unknown) => Promise<void>)

    // 记录需要创建消费者组的事件类型
    this.pendingConsumerGroups.add(eventKey)
  }

  /**
   * 取消订阅
   */
  off<K extends keyof TEventMap>(eventType: K): void {
    const eventKey = String(eventType)
    this.handlers.delete(eventKey)
  }

  /**
   * 发布事件到 Stream
   */
  async emit<K extends keyof TEventMap>(
    eventType: K,
    data: TEventMap[K]
  ): Promise<void> {
    try {
      const streamKey = this.options.streamPrefix + String(eventType)
      const optimizedData = serializeData(data)
      const message = JSON.stringify(optimizedData)

      await this.getClient().xadd(
        streamKey,
        "MAXLEN",
        "~",
        this.options.maxStreamLength.toString(),
        "*", // 自动生成 ID
        "data",
        message,
        "timestamp",
        Date.now().toString()
      )
    } catch (error) {
      console.error(
        `[RedisStreamBus:${this.options.consumerGroup}] 发布事件 ${String(eventType)} 失败:`,
        error
      )
      throw error
    }
  }

  /**
   * 启动消息处理循环
   */
  private startProcessing(): void {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true

    // 异步启动处理循环
    this.recoverPendingMessages()
      .then(() => this.processMessages())
      .catch((err) => {
        console.error(
          `[RedisStreamBus:${this.options.consumerGroup}] 消息处理循环异常:`,
          err
        )
        this.isProcessing = false

        // 尝试重启
        this.attemptRestart()
      })
  }

  /**
   * 停止处理
   */
  stop(): void {
    this.isProcessing = false
  }

  /**
   * 尝试重启消息处理循环
   */
  private attemptRestart(): void {
    const now = Date.now()

    // 如果距离上次重启超过 1 分钟，重置计数器
    if (now - this.lastRestartTime > 60000) {
      this.restartAttempts = 0
    }

    if (this.restartAttempts >= this.options.maxRestartAttempts) {
      console.error(
        `[RedisStreamBus:${this.options.consumerGroup}] 已达到最大重启次数 (${this.options.maxRestartAttempts})，停止自动重启`
      )
      return
    }

    this.restartAttempts++
    this.lastRestartTime = now

    console.log(
      `[RedisStreamBus:${this.options.consumerGroup}] 尝试重启消息处理循环 (${this.restartAttempts}/${this.options.maxRestartAttempts})`
    )

    // 直接重启，Redis 客户端有自动重连机制
    this.startProcessing()
  }

  /**
   * 消息处理循环
   */
  private async processMessages(): Promise<void> {
    while (this.isProcessing) {
      try {
        const eventTypes = Array.from(this.handlers.keys())

        if (eventTypes.length === 0) {
          await this.sleep(this.options.pollInterval)
          continue
        }

        const streams = eventTypes.map(
          (type) => this.options.streamPrefix + type
        )
        const ids = streams.map(() => ">")

        // 使用多流监听，一次性监听所有流
        const results = (await this.getClient().xreadgroup(
          "GROUP",
          this.options.consumerGroup,
          this.getConsumerName(),
          "COUNT",
          this.options.batchSize.toString(),
          "BLOCK",
          "2000", // 增加阻塞时间减少轮询频率
          "STREAMS",
          ...streams,
          ...ids
        )) as Array<[string, Array<[string, string[]]>]> | null

        if (!results || results.length === 0) {
          continue
        }

        for (const [streamKey, entries] of results) {
          const eventType = streamKey.slice(this.options.streamPrefix.length)
          await this.processStreamEntries(eventType, streamKey, entries)
        }
      } catch (error) {
        if (this.isRedisConnectionError(error)) {
          console.error(
            `[RedisStreamBus:${this.options.consumerGroup}] 检测到 Redis 连接错误，退出处理循环`
          )
          this.isProcessing = false
          this.attemptRestart()
          return
        }

        // 处理 NOGROUP 错误
        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          (error as { message: string }).message.includes("NOGROUP")
        ) {
          // 尝试为所有订阅的事件类型重新创建消费者组
          const eventTypes = Array.from(this.handlers.keys())
          for (const type of eventTypes) {
            await this.ensureConsumerGroup(type)
          }
        } else {
          console.error(
            `[RedisStreamBus:${this.options.consumerGroup}] 处理消息失败:`,
            error
          )
          await this.sleep(this.options.pollInterval)
        }
      }
    }
  }

  /**
   * 处理单个流的消息条目
   */
  private async processStreamEntries(
    eventType: string,
    streamKey: string,
    entries: Array<[string, string[]]>
  ): Promise<void> {
    const handlers = this.handlers.get(eventType)
    if (!handlers || handlers.length === 0) return

    for (const [messageId, fields] of entries) {
      try {
        const messageData: Record<string, string> = {}
        for (let i = 0; i < fields.length; i += 2) {
          messageData[fields[i]] = fields[i + 1]
        }

        const rawData = messageData.data
        if (typeof rawData !== "string") continue

        const parsedData = JSON.parse(rawData)
        const data = deserializeData(parsedData as Record<string, unknown>)

        await Promise.all(handlers.map((handler) => handler(data)))

        await this.getClient().xack(
          streamKey,
          this.options.consumerGroup,
          messageId
        )
      } catch (error) {
        console.error(
          `[RedisStreamBus:${this.options.consumerGroup}] 处理单条消息失败 (${eventType}:${messageId}):`,
          error
        )
      }
    }
  }

  /**
   * 检查是否为 Redis 连接错误
   */
  private isRedisConnectionError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
      return false
    }

    const err = error as { message?: string; code?: string }
    const message = err.message?.toLowerCase() || ""
    const code = err.code?.toLowerCase() || ""

    return (
      message.includes("connection") ||
      message.includes("econnrefused") ||
      message.includes("etimedout") ||
      code === "econnrefused" ||
      code === "etimedout"
    )
  }

  /**
   * 确保消费者组存在
   */
  private async ensureConsumerGroup(eventType: string): Promise<void> {
    const streamKey = this.options.streamPrefix + eventType

    try {
      await this.getClient().xgroup(
        "CREATE",
        streamKey,
        this.options.consumerGroup,
        "0",
        "MKSTREAM"
      )
    } catch (error: unknown) {
      if (error && typeof error === "object" && "message" in error) {
        const errMsg = (error as { message: string }).message
        if (errMsg.includes("BUSYGROUP")) {
          // 消费者组已存在，忽略
        } else {
          console.error(
            `[RedisStreamBus:${this.options.consumerGroup}] 创建消费者组失败: ${streamKey}`,
            errMsg
          )
          throw error
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

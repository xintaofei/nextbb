import { EventEmitter } from "events"
import { IEventBus, EventMap } from "./types"

/**
 * 本地事件总线实现
 * 基于 Node.js EventEmitter，用于开发环境或非分布式场景
 */
export class LocalEventBus<
  TEventMap extends EventMap,
> implements IEventBus<TEventMap> {
  private bus: EventEmitter

  constructor() {
    this.bus = new EventEmitter()
    // 设置最大监听器数量以避免警告
    this.bus.setMaxListeners(50)
  }

  async initialize(): Promise<void> {
    // 本地事件总线不需要异步初始化
    return Promise.resolve()
  }

  on<K extends keyof TEventMap>(
    eventType: K,
    handler: (data: TEventMap[K]) => Promise<void>
  ): void {
    const eventKey = String(eventType)

    // 包装 handler 以支持异步错误捕获
    const wrappedHandler = async (data: TEventMap[K]) => {
      try {
        await handler(data)
      } catch (error) {
        console.error(
          `[LocalEventBus] Error handling event ${eventKey}:`,
          error
        )
      }
    }

    // 存储包装后的 handler 以便后续可能需要清理 (虽然 EventEmitter 不需要显式存储)
    // 这里简单直接绑定
    this.bus.on(eventKey, wrappedHandler)
  }

  off<K extends keyof TEventMap>(eventType: K): void {
    const eventKey = String(eventType)
    this.bus.removeAllListeners(eventKey)
  }

  async emit<K extends keyof TEventMap>(
    eventType: K,
    data: TEventMap[K]
  ): Promise<void> {
    const eventKey = String(eventType)
    this.bus.emit(eventKey, data)
    return Promise.resolve()
  }

  stop(): void {
    this.bus.removeAllListeners()
  }
}

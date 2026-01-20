import {
  RedisEventEmitter,
  RedisEventEmitterOptions,
} from "@/lib/redis/event-emitter"
import { IEventBus, EventMap, EventBusConfig } from "./types"

/**
 * Redis Stream 事件总线适配器
 */
export class RedisEventBus<
  TEventMap extends EventMap,
> implements IEventBus<TEventMap> {
  private bus: RedisEventEmitter<TEventMap>

  constructor(config: EventBusConfig) {
    const options: RedisEventEmitterOptions = {
      streamPrefix: config.streamPrefix || "event:stream:",
      consumerGroup: config.consumerGroup || "event-workers",
      consumerName: config.consumerName,
      maxStreamLength: config.maxStreamLength,
    }
    this.bus = new RedisEventEmitter<TEventMap>(options)
  }

  async initialize(): Promise<void> {
    await this.bus.initialize()
  }

  on<K extends keyof TEventMap>(
    eventType: K,
    handler: (data: TEventMap[K]) => Promise<void>
  ): void {
    this.bus.on(eventType, handler)
  }

  off<K extends keyof TEventMap>(eventType: K): void {
    this.bus.off(eventType)
  }

  async emit<K extends keyof TEventMap>(
    eventType: K,
    data: TEventMap[K]
  ): Promise<void> {
    await this.bus.emit(eventType, data)
  }

  stop(): void {
    this.bus.stop()
  }
}

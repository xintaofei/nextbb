import {
  IEventBus,
  EventMap,
  EventBusConfig,
  IBaseEventBus,
  EventBusType,
} from "./types"
import { LocalEventBus } from "./local-bus"
import { RedisEventBus } from "./redis-bus"

// 全局状态类型
interface EventBusFactoryState {
  instances: Map<string, IBaseEventBus>
}

// 确保开发模式下的单例
const globalForEventBusFactory = globalThis as unknown as {
  eventBusFactoryState: EventBusFactoryState
}

if (!globalForEventBusFactory.eventBusFactoryState) {
  globalForEventBusFactory.eventBusFactoryState = {
    instances: new Map(),
  }
}

const state = globalForEventBusFactory.eventBusFactoryState

/**
 * 事件总线工厂
 * 负责创建和管理事件总线实例，支持单例模式
 */
export class EventBusFactory {
  /**
   * 获取或创建事件总线实例
   * @param namespace 命名空间 (用于区分不同的单例，如 "automation", "translation")
   * @param config 配置对象
   */
  static getBus<TEventMap extends EventMap>(
    namespace: string,
    config: EventBusConfig
  ): IEventBus<TEventMap> {
    if (state.instances.has(namespace)) {
      return state.instances.get(namespace) as IEventBus<TEventMap>
    }

    let bus: IEventBus<TEventMap>

    if (config.type === EventBusType.Local) {
      bus = new LocalEventBus<TEventMap>()
    } else {
      bus = new RedisEventBus<TEventMap>(config)
    }

    state.instances.set(namespace, bus)
    return bus
  }

  /**
   * 清除指定实例
   */
  static clear(namespace: string): void {
    const bus = state.instances.get(namespace)
    if (bus) {
      bus.stop()
      state.instances.delete(namespace)
    }
  }

  /**
   * 清除所有实例
   */
  static clearAll(): void {
    state.instances.forEach((bus) => bus.stop())
    state.instances.clear()
  }
}

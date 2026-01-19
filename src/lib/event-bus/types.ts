/**
 * 通用事件总线接口定义
 */

/**
 * 事件映射类型基类
 */
export type EventMap = Record<string, unknown>

/**
 * 事件总线类型枚举
 */
export enum EventBusType {
  Redis = "redis",
  Local = "local",
}

/**
 * 事件总线配置
 */
export interface EventBusConfig {
  type: EventBusType
  // Redis 配置
  streamPrefix?: string
  consumerGroup?: string
  consumerName?: string
  maxStreamLength?: number
  // 通用配置
  namespace?: string // 用于隔离不同模块的本地事件
}

/**
 * 基础事件总线接口 (非泛型)
 * 用于存储和管理不同类型的总线实例
 */
export interface IBaseEventBus {
  /**
   * 初始化总线
   */
  initialize(): Promise<void>

  /**
   * 停止总线 (清理资源/停止监听)
   */
  stop(): void
}

/**
 * 事件总线接口
 * TEventMap: 事件类型映射，key 为事件名，value 为事件数据类型
 */
export interface IEventBus<
  TEventMap extends EventMap = EventMap,
> extends IBaseEventBus {
  /**
   * 订阅事件
   */
  on<K extends keyof TEventMap>(
    eventType: K,
    handler: (data: TEventMap[K]) => Promise<void>
  ): void

  /**
   * 取消订阅
   */
  off<K extends keyof TEventMap>(eventType: K): void

  /**
   * 发布事件
   */
  emit<K extends keyof TEventMap>(
    eventType: K,
    data: TEventMap[K]
  ): Promise<void>
}

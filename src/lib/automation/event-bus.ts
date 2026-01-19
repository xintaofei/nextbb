import { EventBusFactory } from "@/lib/event-bus/factory"
import { EventBusType } from "@/lib/event-bus/types"
import type {
  AutomationEventMap,
  PostCreateEventData,
  PostReplyEventData,
  CheckinEventData,
  DonationEventData,
  PostLikeGivenEventData,
  PostLikeReceivedEventData,
  UserRegisterEventData,
  UserLoginEventData,
} from "./types"

// 获取总线实例
// 使用工厂模式管理单例，支持未来切换到本地事件总线
const bus = EventBusFactory.getBus<AutomationEventMap>("automation", {
  type:
    process.env.IS_SERVERLESS === "true" || process.env.IS_SERVERLESS === "1"
      ? EventBusType.Local
      : EventBusType.Redis,
  streamPrefix: "automation:stream:",
  consumerGroup: "automation-workers",
})

/**
 * Redis Stream 消息队列管理器 (Automation Wrapper)
 *
 * 这是一个包装器类，代理到底层的 EventBus 实例
 * 保持原有的静态 API 以兼容现有代码，同时利用新的通用抽象
 */
export class AutomationEvents {
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

  // ==================== 便捷触发方法 ====================

  /**
   * 触发发帖事件
   */
  static async postCreate(data: PostCreateEventData): Promise<void> {
    await bus.emit("post:create", data)
  }

  /**
   * 触发回帖事件
   */
  static async postReply(data: PostReplyEventData): Promise<void> {
    await bus.emit("post:reply", data)
  }

  /**
   * 触发签到事件
   */
  static async userCheckin(data: CheckinEventData): Promise<void> {
    await bus.emit("user:checkin", data)
  }

  /**
   * 触发捐赠事件
   */
  static async donationConfirmed(data: DonationEventData): Promise<void> {
    await bus.emit("donation:confirmed", data)
  }

  /**
   * 触发送出点赞事件
   */
  static async postLikeGiven(data: PostLikeGivenEventData): Promise<void> {
    await bus.emit("post:like:given", data)
  }

  /**
   * 触发收到点赞事件
   */
  static async postLikeReceived(
    data: PostLikeReceivedEventData
  ): Promise<void> {
    await bus.emit("post:like:received", data)
  }

  /**
   * 触发注册事件
   */
  static async userRegister(data: UserRegisterEventData): Promise<void> {
    await bus.emit("user:register", data)
  }

  /**
   * 触发登录事件
   */
  static async userLogin(data: UserLoginEventData): Promise<void> {
    await bus.emit("user:login", data)
  }
}

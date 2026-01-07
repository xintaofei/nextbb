/**
 * 自动化规则系统 - 事件系统
 *
 * 使用 EventEmitter 模式实现业务逻辑与规则引擎的解耦
 * 支持类型安全的事件监听和触发
 */

import { EventEmitter } from "events"

// ==================== 事件类型定义 ====================

/**
 * 发帖事件数据
 */
export interface PostCreateEventData {
  postId: bigint
  topicId: bigint
  userId: bigint
  categoryId: bigint
  content: string
  isFirstPost: boolean // 是否为主题首帖
}

/**
 * 回帖事件数据
 */
export interface PostReplyEventData {
  postId: bigint
  topicId: bigint
  userId: bigint
  categoryId: bigint
  content: string
  parentId?: bigint
  topicType?: string
  isFirstReply: boolean // 是否为该用户在此主题的首次回复
}

/**
 * 签到事件数据
 */
export interface CheckinEventData {
  checkinId: bigint
  userId: bigint
  checkinDate: Date
  consecutiveDays: number
  creditsEarned: number
}

/**
 * 捐赠事件数据
 */
export interface DonationEventData {
  donationId: bigint
  userId?: bigint
  amount: number
  currency: string
  source: string
  isAnonymous: boolean
  confirmedBy?: bigint
}

/**
 * 点赞事件数据
 */
export interface PostLikeEventData {
  postId: bigint
  userId: bigint // 点赞者
  postAuthorId: bigint // 帖子作者
  isLiked: boolean // true: 点赞, false: 取消点赞
  totalLikes: number // 帖子作者收到的总点赞数
}

/**
 * 注册事件数据
 */
export interface UserRegisterEventData {
  userId: bigint
  email: string
  oauthProvider?: string // github, google, linuxdo
}

/**
 * 登录事件数据
 */
export interface UserLoginEventData {
  userId: bigint
  loginTime: Date
  consecutiveDays: number
}

/**
 * 所有事件类型的映射
 */
export interface AutomationEventMap extends Record<string, unknown> {
  "post:create": PostCreateEventData
  "post:reply": PostReplyEventData
  "user:checkin": CheckinEventData
  "donation:confirmed": DonationEventData
  "post:like": PostLikeEventData
  "user:register": UserRegisterEventData
  "user:login": UserLoginEventData
}

// ==================== 类型安全的 EventEmitter ====================

/**
 * 类型安全的事件发射器
 *
 * 使用方式:
 * ```ts
 * automationEvents.emit("post:create", { postId, userId, ... })
 * automationEvents.on("post:create", async (data) => { ... })
 * ```
 */
export class TypedEventEmitter<T extends Record<string, unknown>> {
  private emitter = new EventEmitter()

  constructor() {
    // 设置最大监听器数量,避免内存泄漏警告
    this.emitter.setMaxListeners(100)
  }

  on<K extends keyof T>(
    event: K,
    listener: (data: T[K]) => void | Promise<void>
  ): void {
    this.emitter.on(event as string, listener)
  }

  once<K extends keyof T>(
    event: K,
    listener: (data: T[K]) => void | Promise<void>
  ): void {
    this.emitter.once(event as string, listener)
  }

  off<K extends keyof T>(
    event: K,
    listener: (data: T[K]) => void | Promise<void>
  ): void {
    this.emitter.off(event as string, listener)
  }

  emit<K extends keyof T>(event: K, data: T[K]): boolean {
    return this.emitter.emit(event as string, data)
  }

  removeAllListeners<K extends keyof T>(event?: K): void {
    if (event) {
      this.emitter.removeAllListeners(event as string)
    } else {
      this.emitter.removeAllListeners()
    }
  }

  listenerCount<K extends keyof T>(event: K): number {
    return this.emitter.listenerCount(event as string)
  }
}

// ==================== 单例 EventEmitter ====================

/**
 * 全局自动化事件发射器单例
 *
 * 在业务代码中触发事件:
 * ```ts
 * import { automationEvents } from "@/lib/automation/events"
 *
 * // 捐赠确认后触发事件
 * automationEvents.emit("donation:confirmed", {
 *   donationId,
 *   userId,
 *   amount: 150,
 *   currency: "CNY",
 *   source: "ALIPAY",
 *   ...
 * })
 * ```
 */
export const automationEvents = new TypedEventEmitter<AutomationEventMap>()

// ==================== 事件触发辅助函数 ====================

/**
 * 触发发帖事件
 */
export async function emitPostCreateEvent(
  data: PostCreateEventData
): Promise<void> {
  automationEvents.emit("post:create", data)
}

/**
 * 触发回帖事件
 */
export async function emitPostReplyEvent(
  data: PostReplyEventData
): Promise<void> {
  automationEvents.emit("post:reply", data)
}

/**
 * 触发签到事件
 */
export async function emitCheckinEvent(data: CheckinEventData): Promise<void> {
  automationEvents.emit("user:checkin", data)
}

/**
 * 触发捐赠事件
 */
export async function emitDonationEvent(
  data: DonationEventData
): Promise<void> {
  automationEvents.emit("donation:confirmed", data)
}

/**
 * 触发点赞事件
 */
export async function emitPostLikeEvent(
  data: PostLikeEventData
): Promise<void> {
  automationEvents.emit("post:like", data)
}

/**
 * 触发注册事件
 */
export async function emitUserRegisterEvent(
  data: UserRegisterEventData
): Promise<void> {
  automationEvents.emit("user:register", data)
}

/**
 * 触发登录事件
 */
export async function emitUserLoginEvent(
  data: UserLoginEventData
): Promise<void> {
  automationEvents.emit("user:login", data)
}

/**
 * 自动化规则系统 - 事件系统
 *
 * 使用 Redis Pub/Sub 实现跨进程的事件通信
 * 支持类型安全的事件监听和触发
 */

import { RedisEventBus } from "./redis-event-bus"

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

// ==================== 事件触发辅助函数 ====================

/**
 * 触发发帖事件
 */
export async function emitPostCreateEvent(
  data: PostCreateEventData
): Promise<void> {
  await RedisEventBus.emit("post:create", data)
}

/**
 * 触发回帖事件
 */
export async function emitPostReplyEvent(
  data: PostReplyEventData
): Promise<void> {
  await RedisEventBus.emit("post:reply", data)
}

/**
 * 触发签到事件
 */
export async function emitCheckinEvent(data: CheckinEventData): Promise<void> {
  await RedisEventBus.emit("user:checkin", data)
}

/**
 * 触发捐赠事件
 */
export async function emitDonationEvent(
  data: DonationEventData
): Promise<void> {
  await RedisEventBus.emit("donation:confirmed", data)
}

/**
 * 触发点赞事件
 */
export async function emitPostLikeEvent(
  data: PostLikeEventData
): Promise<void> {
  await RedisEventBus.emit("post:like", data)
}

/**
 * 触发注册事件
 */
export async function emitUserRegisterEvent(
  data: UserRegisterEventData
): Promise<void> {
  await RedisEventBus.emit("user:register", data)
}

/**
 * 触发登录事件
 */
export async function emitUserLoginEvent(
  data: UserLoginEventData
): Promise<void> {
  await RedisEventBus.emit("user:login", data)
}

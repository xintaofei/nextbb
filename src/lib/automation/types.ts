/**
 * 自动化规则系统 - 类型定义
 */

// ==================== 规则系统枚举 ====================

// 规则触发器类型枚举
export enum RuleTriggerType {
  CRON = "CRON",
  POST_CREATE = "POST_CREATE",
  POST_REPLY = "POST_REPLY",
  CHECKIN = "CHECKIN",
  DONATION = "DONATION",
  POST_LIKE_GIVEN = "POST_LIKE_GIVEN",
  POST_LIKE_RECEIVED = "POST_LIKE_RECEIVED",
  USER_REGISTER = "USER_REGISTER",
  USER_LOGIN = "USER_LOGIN",
}

// 规则动作类型枚举
export enum RuleActionType {
  CREDIT_CHANGE = "CREDIT_CHANGE",
  BADGE_GRANT = "BADGE_GRANT",
  BADGE_REVOKE = "BADGE_REVOKE",
  USER_GROUP_CHANGE = "USER_GROUP_CHANGE",
}

// 规则执行状态枚举
export enum RuleExecutionStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  SKIPPED = "SKIPPED",
}

// 规则动作类型定义
export type RuleAction = {
  type: RuleActionType
  params: Record<string, unknown>
}

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
 * 送出点赞事件数据
 */
export interface PostLikeGivenEventData {
  postId: bigint
  userId: bigint // 点赞者
  totalLikesGiven: number // 点赞者送出的总点赞数
}

/**
 * 收到点赞事件数据
 */
export interface PostLikeReceivedEventData {
  postId: bigint
  postAuthorId: bigint // 帖子作者
  totalLikesReceived: number // 帖子作者收到的总点赞数
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
  "post:like:given": PostLikeGivenEventData
  "post:like:received": PostLikeReceivedEventData
  "user:register": UserRegisterEventData
  "user:login": UserLoginEventData
}

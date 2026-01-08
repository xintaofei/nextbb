/**
 * 自动化规则系统 - 类型定义
 */

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

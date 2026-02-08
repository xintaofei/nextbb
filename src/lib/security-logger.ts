type SecurityEventType =
  | "LOGIN_FAILED"
  | "LOGIN_SUCCESS"
  | "LOGIN_RATE_LIMITED"
  | "TOKEN_VERIFICATION_FAILED"
  | "UNAUTHORIZED_ACCESS"
  | "ADMIN_ACCESS_DENIED"
  | "OAUTH_LINK_FAILED"
  | "OAUTH_LINK_SUCCESS"
  | "PASSWORD_MISMATCH"
  | "ACCOUNT_DISABLED"
  | "UNKNOWN_PROVIDER"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_SUCCESS"
  | "PASSWORD_RESET_FAILED"

type SecurityLogData = {
  event: SecurityEventType
  userId?: string | bigint | null
  email?: string
  ip?: string
  provider?: string
  userAgent?: string
  details?: string
  [key: string]: string | number | bigint | boolean | null | undefined
}

/**
 * 记录安全相关事件
 */
export function logSecurityEvent(data: SecurityLogData): void {
  const timestamp = new Date().toISOString()
  const userId = data.userId
    ? typeof data.userId === "bigint"
      ? data.userId.toString()
      : data.userId
    : "unknown"

  const logMessage = [
    `[Security] ${timestamp}`,
    `Event: ${data.event}`,
    `UserID: ${userId}`,
    data.email ? `Email: ${data.email}` : null,
    data.ip ? `IP: ${data.ip}` : null,
    data.provider ? `Provider: ${data.provider}` : null,
    data.details ? `Details: ${data.details}` : null,
  ]
    .filter(Boolean)
    .join(" | ")

  // 根据事件类型选择日志级别
  const criticalEvents = [
    "LOGIN_RATE_LIMITED",
    "UNAUTHORIZED_ACCESS",
    "ADMIN_ACCESS_DENIED",
  ]
  const warningEvents = [
    "LOGIN_FAILED",
    "TOKEN_VERIFICATION_FAILED",
    "PASSWORD_MISMATCH",
    "ACCOUNT_DISABLED",
    "PASSWORD_RESET_FAILED",
  ]

  if (criticalEvents.includes(data.event)) {
    console.error(logMessage)
  } else if (warningEvents.includes(data.event)) {
    console.warn(logMessage)
  } else {
    console.log(logMessage)
  }

  // TODO: 在生产环境中，可以将这些日志发送到日志聚合服务
  // 例如：Datadog, Sentry, CloudWatch, etc.
}

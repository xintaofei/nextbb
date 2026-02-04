import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { getRedisClient } from "@/lib/redis"

type SmtpConfigKey =
  | "smtp.host"
  | "smtp.port"
  | "smtp.secure"
  | "smtp.auth_user"
  | "smtp.auth_pass"
  | "smtp.from_name"
  | "smtp.from_email"

const SMTP_CONFIG_KEYS: SmtpConfigKey[] = [
  "smtp.host",
  "smtp.port",
  "smtp.secure",
  "smtp.auth_user",
  "smtp.auth_pass",
  "smtp.from_name",
  "smtp.from_email",
]

const SMTP_CONFIG_CACHE_KEY = "smtp:config"
const SMTP_CONFIG_CACHE_TTL = 300 // 5 minutes

type SmtpConfig = {
  host: string
  port: number
  secure: boolean
  authUser: string | null
  authPass: string | null
  fromName: string | null
  fromEmail: string
}

export type SendEmailPayload = {
  to: string
  subject: string
  text?: string
  html?: string
}

function parseNumber(value: string, fallback: number): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return fallback
  return parsed
}

function parseBoolean(value: string): boolean {
  return value === "true"
}

async function fetchSmtpConfigFromDb(): Promise<SmtpConfig> {
  const configs = await prisma.system_configs.findMany({
    where: { config_key: { in: SMTP_CONFIG_KEYS } },
    select: { config_key: true, config_value: true },
  })

  const map = new Map<SmtpConfigKey, string>()
  for (const item of configs) {
    map.set(item.config_key as SmtpConfigKey, item.config_value)
  }

  const host = map.get("smtp.host") ?? ""
  const port = parseNumber(map.get("smtp.port") ?? "", 0)
  const secure = parseBoolean(map.get("smtp.secure") ?? "false")
  const authUser = map.get("smtp.auth_user") ?? null
  const authPass = map.get("smtp.auth_pass") ?? null
  const fromName = map.get("smtp.from_name") ?? null
  const fromEmail = map.get("smtp.from_email") ?? ""

  if (!host || port <= 0 || !fromEmail) {
    throw new Error("SMTP 配置不完整")
  }

  if ((authUser && !authPass) || (!authUser && authPass)) {
    throw new Error("SMTP 用户名和密码需要同时配置")
  }

  return {
    host,
    port,
    secure,
    authUser,
    authPass,
    fromName,
    fromEmail,
  }
}

async function getSmtpConfig(): Promise<SmtpConfig> {
  const redis = getRedisClient()

  try {
    const cached = await redis.get(SMTP_CONFIG_CACHE_KEY)
    if (cached) {
      return JSON.parse(cached) as SmtpConfig
    }
  } catch (error) {
    console.warn("Failed to get SMTP config from cache:", error)
  }

  const config = await fetchSmtpConfigFromDb()

  try {
    await redis.setex(
      SMTP_CONFIG_CACHE_KEY,
      SMTP_CONFIG_CACHE_TTL,
      JSON.stringify(config)
    )
  } catch (error) {
    console.warn("Failed to cache SMTP config:", error)
  }

  return config
}

export async function clearSmtpConfigCache(): Promise<void> {
  const redis = getRedisClient()
  try {
    await redis.del(SMTP_CONFIG_CACHE_KEY)
  } catch (error) {
    console.warn("Failed to clear SMTP config cache:", error)
  }
}

export async function sendEmail(payload: SendEmailPayload): Promise<void> {
  const smtp = await getSmtpConfig()

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth:
      smtp.authUser && smtp.authPass
        ? { user: smtp.authUser, pass: smtp.authPass }
        : undefined,
  })

  const from = smtp.fromName
    ? `${smtp.fromName} <${smtp.fromEmail}>`
    : smtp.fromEmail

  await transporter.sendMail({
    from,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  })
}

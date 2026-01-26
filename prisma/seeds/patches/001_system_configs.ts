import type { SeedPatch } from "../types"
import { generateId } from "@/lib/id"

type ConfigItem = {
  configKey: string
  configValue: string
  configType: "string" | "number" | "boolean" | "json"
  category: string
  description: string
  isPublic: boolean
  isSensitive: boolean
  defaultValue: string
}

const defaultConfigs: ConfigItem[] = [
  {
    configKey: "basic.name",
    configValue: "NextBB",
    configType: "string",
    category: "basic",
    description: "论坛名称",
    isPublic: true,
    isSensitive: false,
    defaultValue: "NextBB",
  },
  {
    configKey: "basic.description",
    configValue: "一个现代化的论坛系统",
    configType: "string",
    category: "basic",
    description: "论坛描述",
    isPublic: true,
    isSensitive: false,
    defaultValue: "一个现代化的论坛系统",
  },
  {
    configKey: "basic.logo",
    configValue: "/logo.png",
    configType: "string",
    category: "basic",
    description: "论坛 Logo",
    isPublic: true,
    isSensitive: false,
    defaultValue: "/logo.png",
  },
  {
    configKey: "basic.contact_email",
    configValue: "",
    configType: "string",
    category: "basic",
    description: "联系邮箱",
    isPublic: true,
    isSensitive: false,
    defaultValue: "",
  },
  {
    configKey: "basic.icp",
    configValue: "",
    configType: "string",
    category: "basic",
    description: "网站备案号",
    isPublic: true,
    isSensitive: false,
    defaultValue: "",
  },
  {
    configKey: "basic.welcome_message",
    configValue: "",
    configType: "string",
    category: "basic",
    description: "首页欢迎语",
    isPublic: true,
    isSensitive: false,
    defaultValue: "",
  },
  {
    configKey: "registration.enabled",
    configValue: "true",
    configType: "boolean",
    category: "registration",
    description: "是否允许注册",
    isPublic: true,
    isSensitive: false,
    defaultValue: "true",
  },
  {
    configKey: "registration.email_verify",
    configValue: "false",
    configType: "boolean",
    category: "registration",
    description: "是否需要邮箱验证",
    isPublic: true,
    isSensitive: false,
    defaultValue: "false",
  },
  {
    configKey: "registration.username_min_length",
    configValue: "3",
    configType: "number",
    category: "registration",
    description: "用户名最小长度",
    isPublic: true,
    isSensitive: false,
    defaultValue: "3",
  },
  {
    configKey: "registration.username_max_length",
    configValue: "32",
    configType: "number",
    category: "registration",
    description: "用户名最大长度",
    isPublic: true,
    isSensitive: false,
    defaultValue: "32",
  },
  {
    configKey: "content.topic.publish_permission",
    configValue: "all",
    configType: "string",
    category: "content",
    description: "话题发布权限（all/verified/admin）",
    isPublic: true,
    isSensitive: false,
    defaultValue: "all",
  },
  {
    configKey: "content.post.reply_permission",
    configValue: "all",
    configType: "string",
    category: "content",
    description: "回复权限（all/verified/admin）",
    isPublic: true,
    isSensitive: false,
    defaultValue: "all",
  },
  {
    configKey: "content.moderation.enabled",
    configValue: "false",
    configType: "boolean",
    category: "content",
    description: "是否启用内容审核",
    isPublic: false,
    isSensitive: false,
    defaultValue: "false",
  },
  {
    configKey: "content.filter.enabled",
    configValue: "false",
    configType: "boolean",
    category: "content",
    description: "是否启用敏感词过滤",
    isPublic: false,
    isSensitive: false,
    defaultValue: "false",
  },
  {
    configKey: "content.upload.max_size",
    configValue: "10",
    configType: "number",
    category: "content",
    description: "上传文件最大大小（MB）",
    isPublic: true,
    isSensitive: false,
    defaultValue: "10",
  },
  {
    configKey: "system.pagination.page_size",
    configValue: "20",
    configType: "number",
    category: "system",
    description: "默认分页大小",
    isPublic: true,
    isSensitive: false,
    defaultValue: "20",
  },
  {
    configKey: "system.cache.ttl",
    configValue: "3600",
    configType: "number",
    category: "system",
    description: "缓存过期时间（秒）",
    isPublic: false,
    isSensitive: false,
    defaultValue: "3600",
  },
  {
    configKey: "system.maintenance.enabled",
    configValue: "false",
    configType: "boolean",
    category: "system",
    description: "是否开启维护模式",
    isPublic: true,
    isSensitive: false,
    defaultValue: "false",
  },
  {
    configKey: "system.maintenance.message",
    configValue: "系统维护中，请稍后访问",
    configType: "string",
    category: "system",
    description: "维护模式提示信息",
    isPublic: true,
    isSensitive: false,
    defaultValue: "系统维护中，请稍后访问",
  },
  {
    configKey: "system.translation.enabled_locales",
    configValue: JSON.stringify(["en", "zh"]),
    configType: "json",
    category: "system",
    description: "自动翻译启用的语言列表",
    isPublic: false,
    isSensitive: false,
    defaultValue: JSON.stringify(["en", "zh"]),
  },
]

const patch: SeedPatch = {
  version: 1,
  name: "system_configs",
  async up(prisma) {
    for (const config of defaultConfigs) {
      const existing = await prisma.system_configs.findUnique({
        where: { config_key: config.configKey },
      })
      if (!existing) {
        await prisma.system_configs.create({
          data: {
            id: generateId(),
            config_key: config.configKey,
            config_value: config.configValue,
            config_type: config.configType,
            category: config.category,
            description: config.description,
            is_public: config.isPublic,
            is_sensitive: config.isSensitive,
            default_value: config.defaultValue,
          },
        })
      }
    }
  },
}

export default patch

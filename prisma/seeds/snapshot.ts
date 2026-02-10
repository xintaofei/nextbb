import type { SeedSnapshot } from "./types"
import { generateId } from "@/lib/id"
import { latestVersion } from "./patches"

const snapshot: SeedSnapshot = {
  targetVersion: latestVersion,
  async apply(prisma) {
    await prisma.$transaction(async (tx) => {
      await seedSystemConfigs(tx)
      await seedCategories(tx)
      await seedTags(tx)
    })
  },
}

type TxClient = Parameters<
  Parameters<
    typeof import("@prisma/client").PrismaClient.prototype.$transaction
  >[0]
>[0]

type SeedConfig = {
  key: string
  value: string
  type: string
  cat: string
  desc: string
  pub: boolean
  sensitive?: boolean
}

async function seedSystemConfigs(tx: TxClient): Promise<void> {
  const configs: SeedConfig[] = [
    {
      key: "basic.name",
      value: "NextBB",
      type: "string",
      cat: "basic",
      desc: "论坛名称",
      pub: true,
    },
    {
      key: "basic.description",
      value: "现代化论坛系统",
      type: "string",
      cat: "basic",
      desc: "论坛描述",
      pub: true,
    },
    {
      key: "basic.logo",
      value: "",
      type: "string",
      cat: "basic",
      desc: "论坛 Logo",
      pub: true,
    },
    {
      key: "basic.contact_email",
      value: "",
      type: "string",
      cat: "basic",
      desc: "联系邮箱",
      pub: true,
    },
    {
      key: "basic.icp",
      value: "",
      type: "string",
      cat: "basic",
      desc: "网站备案号",
      pub: true,
    },
    {
      key: "basic.welcome_message",
      value: "",
      type: "string",
      cat: "basic",
      desc: "首页欢迎语",
      pub: true,
    },
    {
      key: "registration.enabled",
      value: "true",
      type: "boolean",
      cat: "registration",
      desc: "是否允许注册",
      pub: true,
    },
    {
      key: "registration.email_verify",
      value: "false",
      type: "boolean",
      cat: "registration",
      desc: "是否需要邮箱验证",
      pub: true,
    },
    {
      key: "registration.username_min_length",
      value: "3",
      type: "number",
      cat: "registration",
      desc: "用户名最小长度",
      pub: true,
    },
    {
      key: "registration.username_max_length",
      value: "32",
      type: "number",
      cat: "registration",
      desc: "用户名最大长度",
      pub: true,
    },
    {
      key: "registration.require_invite_code",
      value: "false",
      type: "boolean",
      cat: "registration",
      desc: "是否需要邀请码才能注册",
      pub: true,
    },
    {
      key: "registration.review_enabled",
      value: "false",
      type: "boolean",
      cat: "registration",
      desc: "是否开启注册审核",
      pub: true,
    },
    {
      key: "content.topic.publish_permission",
      value: "all",
      type: "string",
      cat: "content",
      desc: "话题发布权限",
      pub: true,
    },
    {
      key: "content.post.reply_permission",
      value: "all",
      type: "string",
      cat: "content",
      desc: "回复权限",
      pub: true,
    },
    {
      key: "content.moderation.enabled",
      value: "false",
      type: "boolean",
      cat: "content",
      desc: "是否启用内容审核",
      pub: false,
    },
    {
      key: "content.filter.enabled",
      value: "false",
      type: "boolean",
      cat: "content",
      desc: "是否启用敏感词过滤",
      pub: false,
    },
    {
      key: "content.upload.max_size",
      value: "10",
      type: "number",
      cat: "content",
      desc: "上传文件最大大小（MB）",
      pub: true,
    },
    {
      key: "system.pagination.page_size",
      value: "20",
      type: "number",
      cat: "system",
      desc: "默认分页大小",
      pub: true,
    },
    {
      key: "system.cache.ttl",
      value: "3600",
      type: "number",
      cat: "system",
      desc: "缓存过期时间（秒）",
      pub: false,
    },
    {
      key: "system.maintenance.enabled",
      value: "false",
      type: "boolean",
      cat: "system",
      desc: "是否开启维护模式",
      pub: true,
    },
    {
      key: "system.maintenance.message",
      value: "系统维护中，请稍后访问",
      type: "string",
      cat: "system",
      desc: "维护模式提示信息",
      pub: true,
    },
    {
      key: "system.translation.enabled_locales",
      value: JSON.stringify(["en", "zh"]),
      type: "json",
      cat: "system",
      desc: "自动翻译启用的语言列表",
      pub: false,
    },
    {
      key: "smtp.host",
      value: "",
      type: "string",
      cat: "smtp",
      desc: "SMTP 服务器地址",
      pub: false,
    },
    {
      key: "smtp.port",
      value: "465",
      type: "number",
      cat: "smtp",
      desc: "SMTP 端口",
      pub: false,
    },
    {
      key: "smtp.secure",
      value: "true",
      type: "boolean",
      cat: "smtp",
      desc: "是否启用 TLS/SSL",
      pub: false,
    },
    {
      key: "smtp.auth_user",
      value: "",
      type: "string",
      cat: "smtp",
      desc: "SMTP 用户名",
      pub: false,
    },
    {
      key: "smtp.auth_pass",
      value: "",
      type: "string",
      cat: "smtp",
      desc: "SMTP 密码",
      pub: false,
      sensitive: true,
    },
    {
      key: "smtp.from_name",
      value: "",
      type: "string",
      cat: "smtp",
      desc: "发件人名称",
      pub: false,
    },
    {
      key: "smtp.from_email",
      value: "",
      type: "string",
      cat: "smtp",
      desc: "发件人邮箱",
      pub: false,
    },
  ]

  for (const c of configs) {
    await tx.system_configs.create({
      data: {
        id: generateId(),
        config_key: c.key,
        config_value: c.value,
        config_type: c.type,
        category: c.cat,
        description: c.desc,
        is_public: c.pub,
        is_sensitive: c.sensitive ?? false,
        default_value: c.value,
      },
    })
  }
}

async function seedCategories(tx: TxClient): Promise<void> {
  const categories = [
    {
      icon: "🍵",
      sort: 1,
      bg: "#3B82F6",
      text: "#FFFFFF",
      darkBg: "#002766",
      darkText: "#FFFFFF",
      zh: { name: "综合讨论", desc: "开放式话题交流区" },
      en: { name: "General", desc: "Open discussion area" },
    },
    {
      icon: "❓",
      sort: 2,
      bg: "#10B981",
      text: "#FFFFFF",
      darkBg: "#035339",
      darkText: "#FFFFFF",
      zh: { name: "问答求助", desc: "技术问题与解答" },
      en: { name: "Q&A", desc: "Questions and answers" },
    },
    {
      icon: "✨",
      sort: 3,
      bg: "#F59E0B",
      text: "#FFFFFF",
      darkBg: "#613d00",
      darkText: "#FFFFFF",
      zh: { name: "公告通知", desc: "官方公告与通知" },
      en: { name: "Announcements", desc: "Official announcements" },
    },
    {
      icon: "💡",
      sort: 4,
      bg: "#8B5CF6",
      text: "#FFFFFF",
      darkBg: "#20016b",
      darkText: "#FFFFFF",
      zh: { name: "建议反馈", desc: "功能建议与反馈" },
      en: { name: "Feedback", desc: "Suggestions and feedback" },
    },
  ]

  for (const cat of categories) {
    const id = generateId()
    await tx.categories.create({
      data: {
        id,
        source_locale: "zh",
        icon: cat.icon,
        sort: cat.sort,
        bg_color: cat.bg,
        text_color: cat.text,
        dark_bg_color: cat.darkBg,
        dark_text_color: cat.darkText,
        is_deleted: false,
        translations: {
          createMany: {
            data: [
              {
                locale: "zh",
                name: cat.zh.name,
                description: cat.zh.desc,
                is_source: true,
              },
              {
                locale: "en",
                name: cat.en.name,
                description: cat.en.desc,
                is_source: false,
              },
            ],
          },
        },
      },
    })
  }
}

async function seedTags(tx: TxClient): Promise<void> {
  const tags = [
    {
      icon: "💎",
      sort: 1,
      bg: "#EF4444",
      text: "#FFFFFF",
      darkBg: "#620404",
      darkText: "#FFFFFF",
      zh: { name: "精华", desc: "精选优质内容" },
      en: { name: "Featured", desc: "Featured content" },
    },
    {
      icon: "🔥",
      sort: 2,
      bg: "#F97316",
      text: "#FFFFFF",
      darkBg: "#612800",
      darkText: "#FFFFFF",
      zh: { name: "热门", desc: "热门话题" },
      en: { name: "Hot", desc: "Trending topics" },
    },
    {
      icon: "✅",
      sort: 3,
      bg: "#22C55E",
      text: "#FFFFFF",
      darkBg: "#0b5626",
      darkText: "#FFFFFF",
      zh: { name: "已解决", desc: "问题已解决" },
      en: { name: "Solved", desc: "Problem solved" },
    },
    {
      icon: "📖",
      sort: 4,
      bg: "#6366F1",
      text: "#FFFFFF",
      darkBg: "#040667",
      darkText: "#FFFFFF",
      zh: { name: "教程", desc: "教程与指南" },
      en: { name: "Tutorial", desc: "Tutorials and guides" },
    },
  ]

  for (const tag of tags) {
    const id = generateId()
    await tx.tags.create({
      data: {
        id,
        source_locale: "zh",
        icon: tag.icon,
        sort: tag.sort,
        bg_color: tag.bg,
        text_color: tag.text,
        dark_bg_color: tag.darkBg,
        dark_text_color: tag.darkText,
        is_deleted: false,
        translations: {
          createMany: {
            data: [
              {
                locale: "zh",
                name: tag.zh.name,
                description: tag.zh.desc,
                is_source: true,
              },
              {
                locale: "en",
                name: tag.en.name,
                description: tag.en.desc,
                is_source: false,
              },
            ],
          },
        },
      },
    })
  }
}

export default snapshot

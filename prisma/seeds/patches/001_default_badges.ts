import type { SeedPatch } from "../types"
import { generateId } from "@/lib/id"

const patch: SeedPatch = {
  version: 1,
  name: "0.0.1",
  async up(prisma) {
    // 默认徽章初始化
    const badges = [
      {
        id: generateId(),
        icon: "user-check",
        badge_type: "MEMBER",
        level: 1,
        sort: 1,
        bg_color: "#3b82f6",
        text_color: "#ffffff",
        translations: {
          zh: {
            name: "注册会员",
            description: "成功注册并加入论坛社区",
          },
          en: {
            name: "Registered Member",
            description: "Successfully registered and joined the forum",
          },
        },
      },
      {
        id: generateId(),
        icon: "flame",
        badge_type: "ACTIVITY",
        level: 1,
        sort: 2,
        bg_color: "#f59e0b",
        text_color: "#ffffff",
        translations: {
          zh: {
            name: "活跃用户",
            description: "积极参与社区讨论的活跃成员",
          },
          en: {
            name: "Active User",
            description: "Active member participating in community discussions",
          },
        },
      },
      {
        id: generateId(),
        icon: "award",
        badge_type: "CONTRIBUTION",
        level: 1,
        sort: 3,
        bg_color: "#8b5cf6",
        text_color: "#ffffff",
        translations: {
          zh: {
            name: "优质回答者",
            description: "提供高质量回答的贡献者",
          },
          en: {
            name: "Quality Contributor",
            description: "Contributor providing high-quality answers",
          },
        },
      },
    ]

    for (const badge of badges) {
      const { translations, ...badgeData } = badge

      await prisma.badges.create({
        data: {
          ...badgeData,
          source_locale: "zh",
          is_enabled: true,
          is_visible: true,
          is_deleted: false,
          translations: {
            create: [
              {
                locale: "zh",
                name: translations.zh.name,
                description: translations.zh.description,
                is_source: true,
                version: 1,
              },
              {
                locale: "en",
                name: translations.en.name,
                description: translations.en.description,
                is_source: false,
                version: 1,
              },
            ],
          },
        },
      })
    }
  },
}

export default patch

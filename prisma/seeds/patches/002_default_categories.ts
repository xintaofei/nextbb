import type { SeedPatch } from "../types"
import { generateId } from "@/lib/id"

type CategorySeed = {
  icon: string
  sort: number
  bgColor: string
  textColor: string
  translations: {
    zh: { name: string; description: string }
    en: { name: string; description: string }
  }
}

const defaultCategories: CategorySeed[] = [
  {
    icon: "MessageSquare",
    sort: 1,
    bgColor: "#3B82F6",
    textColor: "#FFFFFF",
    translations: {
      zh: { name: "综合讨论", description: "开放式话题交流区" },
      en: { name: "General", description: "Open discussion area" },
    },
  },
  {
    icon: "HelpCircle",
    sort: 2,
    bgColor: "#10B981",
    textColor: "#FFFFFF",
    translations: {
      zh: { name: "问答求助", description: "技术问题与解答" },
      en: { name: "Q&A", description: "Questions and answers" },
    },
  },
  {
    icon: "Megaphone",
    sort: 3,
    bgColor: "#F59E0B",
    textColor: "#FFFFFF",
    translations: {
      zh: { name: "公告通知", description: "官方公告与通知" },
      en: { name: "Announcements", description: "Official announcements" },
    },
  },
  {
    icon: "Lightbulb",
    sort: 4,
    bgColor: "#8B5CF6",
    textColor: "#FFFFFF",
    translations: {
      zh: { name: "建议反馈", description: "功能建议与反馈" },
      en: { name: "Feedback", description: "Suggestions and feedback" },
    },
  },
]

const patch: SeedPatch = {
  version: 2,
  name: "default_categories",
  async up(prisma) {
    for (const cat of defaultCategories) {
      const id = generateId()
      await prisma.categories.create({
        data: {
          id,
          source_locale: "zh",
          icon: cat.icon,
          sort: cat.sort,
          bg_color: cat.bgColor,
          text_color: cat.textColor,
          is_deleted: false,
          translations: {
            createMany: {
              data: [
                {
                  locale: "zh",
                  name: cat.translations.zh.name,
                  description: cat.translations.zh.description,
                  is_source: true,
                },
                {
                  locale: "en",
                  name: cat.translations.en.name,
                  description: cat.translations.en.description,
                  is_source: false,
                },
              ],
            },
          },
        },
      })
    }
  },
}

export default patch

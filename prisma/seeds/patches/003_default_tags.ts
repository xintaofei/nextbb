import type { SeedPatch } from "../types"
import { generateId } from "@/lib/id"

type TagSeed = {
  icon: string
  sort: number
  bgColor: string
  textColor: string
  translations: {
    zh: { name: string; description: string }
    en: { name: string; description: string }
  }
}

const defaultTags: TagSeed[] = [
  {
    icon: "Star",
    sort: 1,
    bgColor: "#EF4444",
    textColor: "#FFFFFF",
    translations: {
      zh: { name: "精华", description: "精选优质内容" },
      en: { name: "Featured", description: "Featured content" },
    },
  },
  {
    icon: "Flame",
    sort: 2,
    bgColor: "#F97316",
    textColor: "#FFFFFF",
    translations: {
      zh: { name: "热门", description: "热门话题" },
      en: { name: "Hot", description: "Trending topics" },
    },
  },
  {
    icon: "CheckCircle",
    sort: 3,
    bgColor: "#22C55E",
    textColor: "#FFFFFF",
    translations: {
      zh: { name: "已解决", description: "问题已解决" },
      en: { name: "Solved", description: "Problem solved" },
    },
  },
  {
    icon: "BookOpen",
    sort: 4,
    bgColor: "#6366F1",
    textColor: "#FFFFFF",
    translations: {
      zh: { name: "教程", description: "教程与指南" },
      en: { name: "Tutorial", description: "Tutorials and guides" },
    },
  },
]

const patch: SeedPatch = {
  version: 3,
  name: "default_tags",
  async up(prisma) {
    for (const tag of defaultTags) {
      const id = generateId()
      await prisma.tags.create({
        data: {
          id,
          source_locale: "zh",
          icon: tag.icon,
          sort: tag.sort,
          bg_color: tag.bgColor,
          text_color: tag.textColor,
          is_deleted: false,
          translations: {
            createMany: {
              data: [
                {
                  locale: "zh",
                  name: tag.translations.zh.name,
                  description: tag.translations.zh.description,
                  is_source: true,
                },
                {
                  locale: "en",
                  name: tag.translations.en.name,
                  description: tag.translations.en.description,
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

import { createModel } from "@/lib/ai/model-provider"
import { prisma } from "@/lib/prisma"
import { generateObject } from "ai"
import { z } from "zod"
import { TranslationEntityType, LLMUsage } from "@prisma/client"

// Zod schemas for structured output
const SimpleTranslationSchema = z.object({
  name: z.string().describe("The translated name"),
  description: z.string().optional().describe("The translated description"),
})

const TopicTranslationSchema = z.object({
  title: z.string().describe("The translated title"),
  content: z.string().describe("The translated content in Markdown"),
})

const PostTranslationSchema = z.object({
  content: z.string().describe("The translated content in Markdown"),
})

export class TranslationService {
  /**
   * Retrieves the active LLM configuration for translation.
   */
  private async getTranslationModel() {
    const config = await prisma.llm_configs.findUnique({
      where: { usage: LLMUsage.TRANSLATION, is_enabled: true },
    })

    if (!config) {
      throw new Error("No active translation LLM configuration found.")
    }

    return createModel(config)
  }

  /**
   * Generates a system prompt based on the entity type and locales.
   */
  private getSystemPrompt(
    type: TranslationEntityType,
    sourceLocale: string,
    targetLocale: string
  ): string {
    const basePrompt = `You are a professional translator for a modern forum application. 
Your task is to translate content from ${sourceLocale} to ${targetLocale}.
Ensure the translation is natural, culturally appropriate, and fits the context of a community forum.`

    switch (type) {
      case "CATEGORY":
      case "TAG":
      case "BADGE":
        return `${basePrompt}
For Categories, Tags, and Badges:
- Keep names concise and impactful.
- Descriptions should be clear and informative.
- Maintain consistency with standard forum terminology.`

      case "TOPIC":
        return `${basePrompt}
For Topics (Threads):
- The title should be engaging and accurately reflect the content.
- The content may contain Markdown. PRESERVE all Markdown formatting (links, images, code blocks, bold, etc.) exactly as is.
- Translate the meaning, not just word-for-word.`

      case "POST":
        return `${basePrompt}
For Posts (Replies):
- The content may contain Markdown. PRESERVE all Markdown formatting (links, images, code blocks, bold, etc.) exactly as is.
- Maintain the original tone of the user (e.g., helpful, questioning, casual).`

      default:
        return basePrompt
    }
  }

  /**
   * Translates a simple entity (Category, Tag, Badge).
   */
  async translateSimpleEntity(
    type: "CATEGORY" | "TAG" | "BADGE",
    data: { name: string; description?: string | null },
    sourceLocale: string,
    targetLocale: string
  ) {
    const model = await this.getTranslationModel()
    const prompt = `Translate the following ${type.toLowerCase()}:
Name: "${data.name}"
${data.description ? `Description: "${data.description}"` : ""}`

    const { object } = await generateObject({
      model,
      schema: SimpleTranslationSchema,
      system: this.getSystemPrompt(type, sourceLocale, targetLocale),
      prompt,
    })

    return object
  }

  /**
   * Translates a Topic.
   */
  async translateTopic(
    data: { title: string; content: string },
    sourceLocale: string,
    targetLocale: string
  ) {
    const model = await this.getTranslationModel()
    const prompt = `Translate the following topic:
Title: "${data.title}"

Content:
${data.content}`

    const { object } = await generateObject({
      model,
      schema: TopicTranslationSchema,
      system: this.getSystemPrompt("TOPIC", sourceLocale, targetLocale),
      prompt,
    })

    return object
  }

  /**
   * Translates a Post.
   */
  async translatePost(
    data: { content: string },
    sourceLocale: string,
    targetLocale: string
  ) {
    const model = await this.getTranslationModel()
    const prompt = `Translate the following post content:

${data.content}`

    const { object } = await generateObject({
      model,
      schema: PostTranslationSchema,
      system: this.getSystemPrompt("POST", sourceLocale, targetLocale),
      prompt,
    })

    return object
  }
}

export const translationService = new TranslationService()

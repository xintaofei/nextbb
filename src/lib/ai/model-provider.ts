import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createAnthropic } from "@ai-sdk/anthropic"
import { LLMInterfaceMode } from "@prisma/client"
import { LanguageModel } from "ai"

export interface LLMConfig {
  interface_mode: LLMInterfaceMode
  api_key: string
  base_url: string | null
  name: string
}

/**
 * Creates an AI SDK LanguageModel instance based on the provided configuration.
 *
 * @param config The LLM configuration object
 * @returns An instance of LanguageModel
 * @throws Error if the interface mode is not supported
 */
export function createModel(config: LLMConfig): LanguageModel {
  const { interface_mode, api_key, base_url, name } = config

  // Helper to normalize base_url (empty string -> undefined)
  const normalizedBaseUrl = base_url ? base_url : undefined

  switch (interface_mode) {
    case LLMInterfaceMode.OPENAI: {
      const openai = createOpenAI({
        apiKey: api_key,
        baseURL: normalizedBaseUrl,
      })
      return openai(name)
    }

    case LLMInterfaceMode.GEMINI: {
      const google = createGoogleGenerativeAI({
        apiKey: api_key,
        baseURL: normalizedBaseUrl,
      })
      return google(name)
    }

    case LLMInterfaceMode.ANTHROPIC: {
      const anthropic = createAnthropic({
        apiKey: api_key,
        baseURL: normalizedBaseUrl,
      })
      return anthropic(name)
    }

    case LLMInterfaceMode.DEEPSEEK: {
      // DeepSeek is OpenAI compatible
      const deepseek = createOpenAI({
        apiKey: api_key,
        baseURL: normalizedBaseUrl || "https://api.deepseek.com",
      })
      return deepseek(name)
    }

    case LLMInterfaceMode.GROK: {
      // Grok is OpenAI compatible
      const grok = createOpenAI({
        apiKey: api_key,
        baseURL: normalizedBaseUrl || "https://api.x.ai/v1",
      })
      return grok(name)
    }

    default:
      throw new Error(`Unsupported LLM interface mode: ${interface_mode}`)
  }
}

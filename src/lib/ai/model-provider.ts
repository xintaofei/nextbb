import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai"
import {
  createGoogleGenerativeAI,
  GoogleGenerativeAIProvider,
} from "@ai-sdk/google"
import { createAnthropic, AnthropicProvider } from "@ai-sdk/anthropic"
import { LLMInterfaceMode } from "@prisma/client"
import { LanguageModel } from "ai"

export interface LLMConfig {
  interface_mode: LLMInterfaceMode
  api_key: string
  base_url: string | null
  name: string
}

// Union type for all supported providers
type Provider = OpenAIProvider | GoogleGenerativeAIProvider | AnthropicProvider

// Use globalThis to persist cache across hot reloads in development
// and cast it to a type that includes our cache to avoid 'no-var' and type issues.
const globalWithCache = globalThis as unknown as {
  providerCache: Map<string, Provider> | undefined
}

const providerCache =
  globalWithCache.providerCache ?? new Map<string, Provider>()

if (process.env.NODE_ENV !== "production") {
  globalWithCache.providerCache = providerCache
}

/**
 * Creates an AI SDK LanguageModel instance based on the provided configuration.
 * Uses a caching mechanism to reuse provider instances across requests in serverless environments.
 *
 * @param config The LLM configuration object
 * @returns An instance of LanguageModel
 * @throws Error if the interface mode is not supported
 */
export function createModel(config: LLMConfig): LanguageModel {
  const { interface_mode, api_key, base_url, name } = config

  // Helper to normalize base_url (empty string -> undefined)
  const normalizedBaseUrl = base_url ? base_url : undefined

  // Generate a unique cache key for the provider configuration
  // We include interface_mode, api_key, and base_url to ensure that if any of these change,
  // we create a new provider instance.
  const cacheKey = `${interface_mode}:${api_key}:${normalizedBaseUrl ?? "default"}`

  let provider = providerCache.get(cacheKey)

  if (!provider) {
    switch (interface_mode) {
      case LLMInterfaceMode.OPENAI: {
        provider = createOpenAI({
          apiKey: api_key,
          baseURL: normalizedBaseUrl,
        })
        break
      }

      case LLMInterfaceMode.GEMINI: {
        provider = createGoogleGenerativeAI({
          apiKey: api_key,
          baseURL: normalizedBaseUrl,
        })
        break
      }

      case LLMInterfaceMode.ANTHROPIC: {
        provider = createAnthropic({
          apiKey: api_key,
          baseURL: normalizedBaseUrl,
        })
        break
      }

      case LLMInterfaceMode.DEEPSEEK: {
        // DeepSeek is OpenAI compatible
        provider = createOpenAI({
          apiKey: api_key,
          baseURL: normalizedBaseUrl || "https://api.deepseek.com",
        })
        break
      }

      case LLMInterfaceMode.GROK: {
        // Grok is OpenAI compatible
        provider = createOpenAI({
          apiKey: api_key,
          baseURL: normalizedBaseUrl || "https://api.x.ai/v1",
        })
        break
      }

      default:
        throw new Error(`Unsupported LLM interface mode: ${interface_mode}`)
    }

    // Store the created provider in the cache
    providerCache.set(cacheKey, provider)
  }

  // Use explicit casting based on the interface mode to avoid 'any'
  // The cache key structure guarantees that the provider type matches the interface mode
  switch (interface_mode) {
    case LLMInterfaceMode.OPENAI:
    case LLMInterfaceMode.DEEPSEEK:
    case LLMInterfaceMode.GROK:
      return (provider as OpenAIProvider)(name)

    case LLMInterfaceMode.GEMINI:
      return (provider as GoogleGenerativeAIProvider)(name)

    case LLMInterfaceMode.ANTHROPIC:
      return (provider as AnthropicProvider)(name)

    default:
      // This should be unreachable as it's handled in the creation block
      throw new Error(`Unsupported LLM interface mode: ${interface_mode}`)
  }
}

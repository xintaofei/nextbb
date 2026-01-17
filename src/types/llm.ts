export type LLMConfigDTO = {
  id: string
  interface_mode: string
  name: string
  base_url: string
  api_key: string
  usage: string
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export type LLMConfigFormData = {
  interface_mode: string
  name: string
  base_url: string
  api_key: string
  usage: string
  is_enabled: boolean
}

export type LLMUsageRow = {
  usage: string
  config: LLMConfigDTO | null
}

/**
 * 公开配置类型定义
 *
 * 这些配置可以在前端访问，通过 /api/configs/public 获取
 */
export interface PublicConfigs {
  "basic.name": string
  "basic.logo": string
  "basic.description": string
  "basic.contact_email": string
  "basic.icp": string
  "basic.welcome_message": string
  "oauth.github.enabled": boolean
  "oauth.google.enabled": boolean
  "oauth.linuxdo.enabled": boolean
}

/**
 * 配置键类型
 */
export type ConfigKey = keyof PublicConfigs

/**
 * 配置值类型（根据键推断）
 */
export type ConfigValue<K extends ConfigKey> = PublicConfigs[K]

/**
 * LinuxDo OAuth Profile 类型定义
 *
 * 此文件保留类型定义以供其他模块使用。
 * OAuth Provider 实现已迁移到 oauth-factory.ts
 */
export type LinuxDoProfile = {
  id?: string | number
  sub?: string
  name?: string
  username?: string
  preferred_username?: string
  nickname?: string
  login?: string
  email?: string | null
  mail?: string | null
  emailAddress?: string | null
  emails?: Array<string | { value?: string }>
  avatar?: string | null
  avatar_url?: string | null
  picture?: string | null
}

import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import type { OAuthConfig } from "next-auth/providers/oauth"
import type { OAuthProviderConfig } from "@/lib/services/config-service"

/**
 * LinuxDo Profile 类型
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

/**
 * 扩展的 OAuth 配置类型（支持自定义 HTTP 选项）
 */
type OAuthConfigWithHttp<T> = OAuthConfig<T> & {
  httpOptions?: {
    timeout?: number
  }
}

/**
 * 创建 GitHub OAuth Provider
 */
export function createGitHubProvider(config: OAuthProviderConfig) {
  if (!config.enabled || !config.clientId || !config.clientSecret) {
    return null
  }

  return GitHubProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  })
}

/**
 * 创建 Google OAuth Provider
 */
export function createGoogleProvider(config: OAuthProviderConfig) {
  if (!config.enabled || !config.clientId || !config.clientSecret) {
    return null
  }

  return GoogleProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  })
}

/**
 * 创建 LinuxDo OAuth Provider
 */
export function createLinuxDoProvider(
  config: OAuthProviderConfig
): OAuthConfigWithHttp<LinuxDoProfile> | null {
  if (!config.enabled || !config.clientId || !config.clientSecret) {
    return null
  }

  return {
    id: "linuxdo",
    name: "Linux.DO",
    type: "oauth",
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authorization: {
      url: "https://connect.linux.do/oauth2/authorize",
      params: { scope: "openid email profile" },
    },
    token: "https://connect.linux.do/oauth2/token",
    userinfo: "https://connect.linux.do/api/user",
    wellKnown: "https://connect.linux.do/.well-known/openid-configuration",
    checks: ["pkce", "state"],
    httpOptions: { timeout: 60000 },
    idToken: true,
    profile(profile: LinuxDoProfile) {
      let id = ""
      if (profile.id !== undefined) {
        id = String(profile.id)
      } else if (profile.sub !== undefined) {
        id = String(profile.sub)
      }

      let name = ""
      if (typeof profile.name === "string" && profile.name.length > 0) {
        name = profile.name
      } else if (
        typeof profile.username === "string" &&
        profile.username.length > 0
      ) {
        name = profile.username
      } else if (
        typeof profile.login === "string" &&
        profile.login.length > 0
      ) {
        name = profile.login
      }

      const email = typeof profile.email === "string" ? profile.email : null

      let image: string | null = null
      if (typeof profile.avatar_url === "string") {
        image = profile.avatar_url
      } else if (typeof profile.picture === "string") {
        image = profile.picture
      } else if (typeof profile.avatar === "string") {
        image = profile.avatar
      }
      return { id, name, email, image }
    },
  } as OAuthConfigWithHttp<LinuxDoProfile>
}

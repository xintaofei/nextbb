import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import type { OAuthConfig } from "next-auth/providers/oauth"
import type { SocialProviderConfig } from "@/lib/services/social-provider-service"

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

type GenericProfile = {
  id?: string | number
  sub?: string
  name?: string
  username?: string
  preferred_username?: string
  nickname?: string
  login?: string
  email?: string | null
  picture?: string | null
  avatar?: string | null
  avatar_url?: string | null
}

type OAuthConfigWithHttp<T> = OAuthConfig<T> & {
  httpOptions?: {
    timeout?: number
  }
}

function createGitHubProvider(
  config: SocialProviderConfig
): ReturnType<typeof GitHubProvider> {
  return GitHubProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  })
}

function createGoogleProvider(
  config: SocialProviderConfig
): ReturnType<typeof GoogleProvider> {
  return GoogleProvider({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  })
}

function createLinuxDoProvider(
  config: SocialProviderConfig
): OAuthConfigWithHttp<LinuxDoProfile> {
  return {
    id: "linuxdo",
    name: config.name,
    type: "oauth",
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authorization: {
      url: config.authorizeUrl || "https://connect.linux.do/oauth2/authorize",
      params: { scope: config.scope || "openid email profile" },
    },
    token: config.tokenUrl || "https://connect.linux.do/oauth2/token",
    userinfo: config.userinfoUrl || "https://connect.linux.do/api/user",
    wellKnown:
      config.wellKnownUrl ||
      "https://connect.linux.do/.well-known/openid-configuration",
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

function createCustomProvider(
  config: SocialProviderConfig
): OAuthConfigWithHttp<GenericProfile> | null {
  if (!config.authorizeUrl || !config.tokenUrl) {
    console.warn(
      `[OAuthFactory] 自定义 Provider ${config.providerKey} 缺少必要的 URL 配置`
    )
    return null
  }

  return {
    id: config.providerKey,
    name: config.name,
    type: "oauth",
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authorization: {
      url: config.authorizeUrl,
      params: config.scope ? { scope: config.scope } : undefined,
    },
    token: config.tokenUrl,
    userinfo: config.userinfoUrl || undefined,
    wellKnown: config.wellKnownUrl || undefined,
    checks: ["state"],
    httpOptions: { timeout: 60000 },
    profile(profile: GenericProfile) {
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
        typeof profile.preferred_username === "string" &&
        profile.preferred_username.length > 0
      ) {
        name = profile.preferred_username
      } else if (
        typeof profile.nickname === "string" &&
        profile.nickname.length > 0
      ) {
        name = profile.nickname
      }

      const email = typeof profile.email === "string" ? profile.email : null

      let image: string | null = null
      if (typeof profile.picture === "string") {
        image = profile.picture
      } else if (typeof profile.avatar_url === "string") {
        image = profile.avatar_url
      } else if (typeof profile.avatar === "string") {
        image = profile.avatar
      }

      return { id, name, email, image }
    },
  } as OAuthConfigWithHttp<GenericProfile>
}

export type SupportedOAuthConfig =
  | ReturnType<typeof GitHubProvider>
  | ReturnType<typeof GoogleProvider>
  | OAuthConfigWithHttp<LinuxDoProfile>
  | OAuthConfigWithHttp<GenericProfile>

export function createOAuthProvider(
  config: SocialProviderConfig
): SupportedOAuthConfig | null {
  if (!config.clientId || !config.clientSecret) {
    console.warn(
      `[OAuthFactory] Provider ${config.providerKey} 缺少 clientId 或 clientSecret`
    )
    return null
  }

  switch (config.providerKey) {
    case "github":
      return createGitHubProvider(config)
    case "google":
      return createGoogleProvider(config)
    case "linuxdo":
      return createLinuxDoProvider(config)
    default:
      return createCustomProvider(config)
  }
}

import type { OAuthConfig } from "next-auth/providers/oauth"

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

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v || v.length === 0) {
    throw new Error(`${name} is not set`)
  }
  return v
}

type OAuthConfigWithHttp<T> = OAuthConfig<T> & {
  httpOptions?: {
    timeout?: number
  }
}

export const LinuxDoProvider: OAuthConfigWithHttp<LinuxDoProfile> = {
  id: "linuxdo",
  name: "Linux.DO",
  type: "oauth",
  clientId: getEnv("LINUXDO_CLIENT_ID"),
  clientSecret: getEnv("LINUXDO_CLIENT_SECRET"),
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
    } else if (typeof profile.login === "string" && profile.login.length > 0) {
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
}

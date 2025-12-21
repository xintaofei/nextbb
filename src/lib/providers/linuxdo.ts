import type { OAuthConfig } from "next-auth/providers/oauth"

type LinuxDoProfile = {
  id?: string | number
  sub?: string
  name?: string
  username?: string
  email?: string | null
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

function getEnvOr(name: string, fallback: string): string {
  const v = process.env[name]
  return v && v.length > 0 ? v : fallback
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
    url: getEnv("LINUXDO_AUTH_URL"),
    params: { scope: "openid email profile" },
  },
  token: getEnv("LINUXDO_TOKEN_URL"),
  userinfo: getEnv("LINUXDO_USERINFO_URL"),
  wellKnown: getEnv("LINUXDO_WELL_KNOWN"),
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
    if (typeof profile.name === "string") {
      name = profile.name
    } else if (typeof profile.username === "string") {
      name = profile.username
    }

    const email =
      typeof profile.email === "string"
        ? profile.email
        : id !== ""
          ? `${id}@linux.do.local`
          : (null as string | null)

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

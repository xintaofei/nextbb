import type { NextAuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { LinuxDoProvider } from "@/lib/providers/linuxdo"
import type { LinuxDoProfile } from "@/lib/providers/linuxdo"

function getEnv(name: string): string {
  const v = process.env[name]
  if (!v || v.length === 0) {
    throw new Error(`${name} is not set`)
  }
  return v
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV !== "production",
  providers: [
    GitHubProvider({
      clientId: getEnv("GITHUB_CLIENT_ID"),
      clientSecret: getEnv("GITHUB_CLIENT_SECRET"),
      httpOptions: { timeout: 60000 },
    }),
    GoogleProvider({
      clientId: getEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
      httpOptions: { timeout: 60000 },
    }),
    LinuxDoProvider,
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account) return false
      const provider = account.provider
      if (
        provider !== "github" &&
        provider !== "google" &&
        provider !== "linuxdo"
      )
        return false
      const email =
        user.email ??
        (typeof profile?.email === "string" ? profile.email : null) ??
        null
      if (!email) return false
      const existing = await prisma.users.findUnique({
        where: { email },
      })
      if (existing) return true
      const id = generateId()
      const name =
        user.name ??
        (typeof profile?.name === "string" ? profile.name : null) ??
        email.split("@")[0]
      const avatar =
        user.image ??
        (typeof (profile as { picture?: string }).picture === "string"
          ? (profile as { picture?: string }).picture
          : null) ??
        ""
      await prisma.users.create({
        data: {
          id,
          email,
          name,
          avatar,
          password: "oauth",
          status: 1,
          is_deleted: false,
        },
      })
      return true
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "linuxdo" && profile) {
        token.linuxdoProfile = profile as LinuxDoProfile
      }
      if (user?.email) {
        const u = await prisma.users.findUnique({
          where: { email: user.email },
          select: { id: true, email: true, name: true, avatar: true },
        })
        if (u) {
          token.id = u.id.toString()
          token.email = u.email
          token.name = u.name
          token.picture = u.avatar
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = typeof token.id === "string" ? token.id : undefined
      }
      if (token.linuxdoProfile) {
        session.linuxdoProfile = token.linuxdoProfile
      }
      return session
    },
  },
  secret: getEnv("NEXTAUTH_SECRET"),
}

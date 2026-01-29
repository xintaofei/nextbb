import NextAuth from "next-auth"
import { getAuthOptions } from "@/lib/auth-options-cache"

async function handler(
  req: Request,
  ctx: { params: Promise<{ locale: string; nextauth: string[] }> }
) {
  const authOptions = await getAuthOptions()
  // Await params to get the actual values
  await ctx.params
  return NextAuth(authOptions)(req, ctx as never)
}

export { handler as GET, handler as POST }

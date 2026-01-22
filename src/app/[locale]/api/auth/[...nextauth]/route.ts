import NextAuth from "next-auth"
import { createAuthOptions } from "@/lib/auth-options"

async function handler(
  req: Request,
  ctx: { params: Promise<{ locale: string; nextauth: string[] }> }
) {
  const authOptions = await createAuthOptions()
  // Await params to get the actual values
  await ctx.params
  return NextAuth(authOptions)(req, ctx as never)
}

export { handler as GET, handler as POST }

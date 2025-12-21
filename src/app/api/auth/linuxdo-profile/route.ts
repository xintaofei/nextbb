import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import type { LinuxDoProfile } from "@/lib/providers/linuxdo"

export async function GET() {
  const session = await getServerSession(authOptions)
  const data: LinuxDoProfile | null = session?.linuxdoProfile ?? null
  return NextResponse.json({ linuxdoProfile: data } as {
    linuxdoProfile: LinuxDoProfile | null
  })
}

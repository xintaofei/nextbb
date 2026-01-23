import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"

type SocialProviderDTO = {
  id: string
  providerKey: string
  name: string
  clientId: string
  clientSecret: string
  authorizeUrl: string | null
  tokenUrl: string | null
  userinfoUrl: string | null
  wellKnownUrl: string | null
  scope: string | null
  icon: string | null
  sort: number
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

export async function GET() {
  try {
    const auth = await getSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const providers = await prisma.social_providers.findMany({
      orderBy: { sort: "asc" },
    })

    const items: SocialProviderDTO[] = providers.map((p) => ({
      id: String(p.id),
      providerKey: p.provider_key,
      name: p.name,
      clientId: p.client_id,
      clientSecret: "••••••••",
      authorizeUrl: p.authorize_url,
      tokenUrl: p.token_url,
      userinfoUrl: p.userinfo_url,
      wellKnownUrl: p.well_known_url,
      scope: p.scope,
      icon: p.icon,
      sort: p.sort,
      isEnabled: p.is_enabled,
      createdAt: p.created_at.toISOString(),
      updatedAt: p.updated_at.toISOString(),
    }))

    return NextResponse.json(items)
  } catch (error) {
    console.error("Get social providers error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      providerKey,
      name,
      clientId,
      clientSecret,
      authorizeUrl,
      tokenUrl,
      userinfoUrl,
      wellKnownUrl,
      scope,
      icon,
      sort,
      isEnabled,
    } = body

    if (
      !providerKey ||
      typeof providerKey !== "string" ||
      providerKey.length > 32
    ) {
      return NextResponse.json(
        { error: "Provider key is required and must not exceed 32 characters" },
        { status: 400 }
      )
    }

    if (!name || typeof name !== "string" || name.length > 64) {
      return NextResponse.json(
        { error: "Name is required and must not exceed 64 characters" },
        { status: 400 }
      )
    }

    if (!clientId || typeof clientId !== "string" || clientId.length > 256) {
      return NextResponse.json(
        { error: "Client ID is required and must not exceed 256 characters" },
        { status: 400 }
      )
    }

    if (
      !clientSecret ||
      typeof clientSecret !== "string" ||
      clientSecret.length > 256
    ) {
      return NextResponse.json(
        {
          error: "Client Secret is required and must not exceed 256 characters",
        },
        { status: 400 }
      )
    }

    const existing = await prisma.social_providers.findUnique({
      where: { provider_key: providerKey },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Provider key already exists" },
        { status: 400 }
      )
    }

    const provider = await prisma.social_providers.create({
      data: {
        id: generateId(),
        provider_key: providerKey,
        name,
        client_id: clientId,
        client_secret: clientSecret,
        authorize_url: authorizeUrl || null,
        token_url: tokenUrl || null,
        userinfo_url: userinfoUrl || null,
        well_known_url: wellKnownUrl || null,
        scope: scope || null,
        icon: icon || null,
        sort: typeof sort === "number" ? sort : 0,
        is_enabled: typeof isEnabled === "boolean" ? isEnabled : true,
      },
    })

    const dto: SocialProviderDTO = {
      id: String(provider.id),
      providerKey: provider.provider_key,
      name: provider.name,
      clientId: provider.client_id,
      clientSecret: "••••••••",
      authorizeUrl: provider.authorize_url,
      tokenUrl: provider.token_url,
      userinfoUrl: provider.userinfo_url,
      wellKnownUrl: provider.well_known_url,
      scope: provider.scope,
      icon: provider.icon,
      sort: provider.sort,
      isEnabled: provider.is_enabled,
      createdAt: provider.created_at.toISOString(),
      updatedAt: provider.updated_at.toISOString(),
    }

    return NextResponse.json(dto, { status: 201 })
  } catch (error) {
    console.error("Create social provider error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { invalidateSocialProviderCache } from "@/lib/services/social-provider-service"

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getServerSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const providerId = BigInt(id)

    const existing = await prisma.social_providers.findUnique({
      where: { id: providerId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Social provider not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
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

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) {
      if (typeof name !== "string" || name.length > 64) {
        return NextResponse.json(
          { error: "Name must not exceed 64 characters" },
          { status: 400 }
        )
      }
      updateData.name = name
    }

    if (clientId !== undefined) {
      if (typeof clientId !== "string" || clientId.length > 256) {
        return NextResponse.json(
          { error: "Client ID must not exceed 256 characters" },
          { status: 400 }
        )
      }
      updateData.client_id = clientId
    }

    if (clientSecret !== undefined && clientSecret.length > 0) {
      if (typeof clientSecret !== "string" || clientSecret.length > 256) {
        return NextResponse.json(
          { error: "Client Secret must not exceed 256 characters" },
          { status: 400 }
        )
      }
      updateData.client_secret = clientSecret
    }

    if (authorizeUrl !== undefined) {
      updateData.authorize_url = authorizeUrl || null
    }

    if (tokenUrl !== undefined) {
      updateData.token_url = tokenUrl || null
    }

    if (userinfoUrl !== undefined) {
      updateData.userinfo_url = userinfoUrl || null
    }

    if (wellKnownUrl !== undefined) {
      updateData.well_known_url = wellKnownUrl || null
    }

    if (scope !== undefined) {
      updateData.scope = scope || null
    }

    if (icon !== undefined) {
      updateData.icon = icon || null
    }

    if (typeof sort === "number") {
      updateData.sort = sort
    }

    if (typeof isEnabled === "boolean") {
      updateData.is_enabled = isEnabled
    }

    const provider = await prisma.social_providers.update({
      where: { id: providerId },
      data: updateData,
    })

    await invalidateSocialProviderCache()

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

    return NextResponse.json(dto)
  } catch (error) {
    console.error("Update social provider error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getServerSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const providerId = BigInt(id)

    const existing = await prisma.social_providers.findUnique({
      where: { id: providerId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Social provider not found" },
        { status: 404 }
      )
    }

    const linkedAccounts = await prisma.user_social_accounts.count({
      where: { provider_key: existing.provider_key },
    })

    if (linkedAccounts > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete provider with ${linkedAccounts} linked user accounts`,
        },
        { status: 400 }
      )
    }

    await prisma.social_providers.delete({
      where: { id: providerId },
    })

    await invalidateSocialProviderCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete social provider error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

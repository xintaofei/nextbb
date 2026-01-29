import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { DonationSource, DonationStatus } from "@prisma/client"
import { getTranslations } from "next-intl/server"

const UpdateSchema = z.object({
  donor_name: z.string().max(64).optional(),
  donor_email: z.email().max(256).optional().nullable(),
  amount: z.number().positive().optional(),
  currency: z.string().max(8).optional(),
  source: z.enum(DonationSource).optional(),
  status: z.enum(DonationStatus).optional(),
  external_id: z.string().max(128).optional().nullable(),
  is_anonymous: z.boolean().optional(),
  message: z.string().max(500).optional().nullable(),
  admin_note: z.string().max(500).optional().nullable(),
  user_id: z.string().optional().nullable(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations("AdminDonations")

  const { id } = await params
  let donationId: bigint
  try {
    donationId = BigInt(id)
  } catch {
    return NextResponse.json({ error: t("error.invalidId") }, { status: 400 })
  }

  const donation = await prisma.donations.findUnique({
    where: { id: donationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!donation || donation.is_deleted) {
    return NextResponse.json({ error: t("error.notFound") }, { status: 404 })
  }

  return NextResponse.json({
    id: String(donation.id),
    userId: donation.user_id ? String(donation.user_id) : null,
    userName: donation.user?.name ?? null,
    userEmail: donation.user?.email ?? null,
    donorName: donation.donor_name,
    donorEmail: donation.donor_email,
    amount: donation.amount.toString(),
    currency: donation.currency,
    source: donation.source,
    status: donation.status,
    externalId: donation.external_id,
    isAnonymous: donation.is_anonymous,
    message: donation.message,
    adminNote: donation.admin_note,
    confirmedBy: donation.confirmed_by ? String(donation.confirmed_by) : null,
    confirmedAt: donation.confirmed_at?.toISOString() ?? null,
    createdAt: donation.created_at.toISOString(),
    updatedAt: donation.updated_at.toISOString(),
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations("AdminDonations")
  const user = await getServerSessionUser()
  if (!user)
    return NextResponse.json(
      { error: t("error.unauthorized") },
      { status: 401 }
    )

  const { id } = await params
  let donationId: bigint
  try {
    donationId = BigInt(id)
  } catch {
    return NextResponse.json({ error: t("error.invalidId") }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: t("error.invalidJson") }, { status: 400 })
  }

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: t("error.invalidBody"), details: parsed.error.issues },
      { status: 400 }
    )
  }

  const existing = await prisma.donations.findUnique({
    where: { id: donationId },
  })

  if (!existing || existing.is_deleted) {
    return NextResponse.json({ error: t("error.notFound") }, { status: 404 })
  }

  const data = parsed.data
  const updateData: Record<string, unknown> = {}

  if (data.donor_name !== undefined) updateData.donor_name = data.donor_name
  if (data.donor_email !== undefined) updateData.donor_email = data.donor_email
  if (data.amount !== undefined) updateData.amount = data.amount
  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.source !== undefined) updateData.source = data.source
  if (data.external_id !== undefined) updateData.external_id = data.external_id
  if (data.is_anonymous !== undefined)
    updateData.is_anonymous = data.is_anonymous
  if (data.message !== undefined) updateData.message = data.message
  if (data.admin_note !== undefined) updateData.admin_note = data.admin_note
  if (data.user_id !== undefined) {
    updateData.user_id = data.user_id ? BigInt(data.user_id) : null
  }

  if (data.status !== undefined) {
    updateData.status = data.status
    if (
      data.status === DonationStatus.CONFIRMED &&
      existing.status !== DonationStatus.CONFIRMED
    ) {
      updateData.confirmed_by = user.userId
      updateData.confirmed_at = new Date()
    }
  }

  await prisma.donations.update({
    where: { id: donationId },
    data: updateData,
  })

  return NextResponse.json({ message: t("message.updateSuccess") })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations("AdminDonations")

  const { id } = await params
  let donationId: bigint
  try {
    donationId = BigInt(id)
  } catch {
    return NextResponse.json({ error: t("error.invalidId") }, { status: 400 })
  }

  const existing = await prisma.donations.findUnique({
    where: { id: donationId },
  })

  if (!existing) {
    return NextResponse.json({ error: t("error.notFound") }, { status: 404 })
  }

  await prisma.donations.update({
    where: { id: donationId },
    data: { is_deleted: true },
  })

  return NextResponse.json({ message: t("message.deleteSuccess") })
}

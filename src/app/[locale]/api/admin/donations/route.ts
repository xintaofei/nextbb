import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/guard"
import { generateId } from "@/lib/id"
import { DonationSource, DonationStatus } from "@prisma/client"
import { getTranslations } from "next-intl/server"

const QuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
  q: z.string().optional(),
  donor_type: z.enum(["guest", "registered"]).optional(),
  donor_name: z.string().optional(),
  user_id: z.string().regex(/^\d+$/).optional(),
  status: z.enum(DonationStatus).optional(),
  source: z.enum(DonationSource).optional(),
})

const CreateSchema = z.object({
  donor_name: z.string().max(64).optional(),
  donor_email: z.email().max(256).optional(),
  amount: z.number().positive(),
  currency: z.string().max(8).default("CNY"),
  source: z.enum(DonationSource),
  status: z.enum(DonationStatus).default(DonationStatus.PENDING),
  external_id: z.string().max(128).optional(),
  is_anonymous: z.boolean().default(false),
  message: z.string().max(500).optional(),
  admin_note: z.string().max(500).optional(),
  user_id: z.string().optional(),
})

type DonationListItem = {
  id: string
  userId: string | null
  userName: string | null
  donorName: string | null
  donorEmail: string | null
  amount: string
  currency: string
  source: DonationSource
  status: DonationStatus
  externalId: string | null
  isAnonymous: boolean
  message: string | null
  adminNote: string | null
  confirmedBy: string | null
  confirmedAt: string | null
  createdAt: string
}

type DonationListResult = {
  items: DonationListItem[]
  page: number
  pageSize: number
  total: number
  stats: {
    total: number
    totalAmount: string
    confirmed: number
    pending: number
  }
}

export async function GET(req: Request) {
  const t = await getTranslations("AdminDonations")
  const actor = await requireAdmin()
  if (!actor)
    return NextResponse.json(
      { error: t("error.unauthorized") },
      { status: 401 }
    )

  const url = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    donor_type: url.searchParams.get("donor_type") ?? undefined,
    donor_name: url.searchParams.get("donor_name") ?? undefined,
    user_id: url.searchParams.get("user_id") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    source: url.searchParams.get("source") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { error: t("error.invalidQuery") },
      { status: 400 }
    )
  }

  const page = parsed.data.page ? Number(parsed.data.page) : 1
  const pageSize = parsed.data.pageSize ? Number(parsed.data.pageSize) : 20

  const where: {
    OR?: {
      donor_name?: { contains: string }
      donor_email?: { contains: string }
    }[]
    donor_name?: { contains: string }
    user_id?: bigint | null
    status?: DonationStatus
    source?: DonationSource
    is_deleted?: boolean
  } = { is_deleted: false }

  const q = parsed.data.q?.trim()
  if (q && q.length > 0) {
    where.OR = [
      { donor_name: { contains: q } },
      { donor_email: { contains: q } },
    ]
  }

  if (parsed.data.donor_type === "guest") {
    where.user_id = null
    const donorNameQuery = parsed.data.donor_name?.trim()
    if (donorNameQuery && donorNameQuery.length > 0) {
      where.donor_name = { contains: donorNameQuery }
    }
  } else if (parsed.data.donor_type === "registered") {
    if (parsed.data.user_id) {
      where.user_id = BigInt(parsed.data.user_id)
    }
  }

  if (parsed.data.status) {
    where.status = parsed.data.status
  }
  if (parsed.data.source) {
    where.source = parsed.data.source
  }

  const [total, rows, statsResult] = await Promise.all([
    prisma.donations.count({ where }),
    prisma.donations.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.donations.aggregate({
      where: { is_deleted: false },
      _count: { id: true },
      _sum: { amount: true },
    }),
  ])

  const [confirmedCount, pendingCount] = await Promise.all([
    prisma.donations.count({
      where: { is_deleted: false, status: DonationStatus.CONFIRMED },
    }),
    prisma.donations.count({
      where: { is_deleted: false, status: DonationStatus.PENDING },
    }),
  ])

  const items: DonationListItem[] = rows.map((d) => ({
    id: String(d.id),
    userId: d.user_id ? String(d.user_id) : null,
    userName: d.user?.name ?? null,
    donorName: d.donor_name,
    donorEmail: d.donor_email,
    amount: d.amount.toString(),
    currency: d.currency,
    source: d.source,
    status: d.status,
    externalId: d.external_id,
    isAnonymous: d.is_anonymous,
    message: d.message,
    adminNote: d.admin_note,
    confirmedBy: d.confirmed_by ? String(d.confirmed_by) : null,
    confirmedAt: d.confirmed_at?.toISOString() ?? null,
    createdAt: d.created_at.toISOString(),
  }))

  const result: DonationListResult = {
    items,
    page,
    pageSize,
    total,
    stats: {
      total: statsResult._count.id ?? 0,
      totalAmount: statsResult._sum.amount?.toString() ?? "0",
      confirmed: confirmedCount,
      pending: pendingCount,
    },
  }
  return NextResponse.json(result, { status: 200 })
}

export async function POST(req: Request) {
  const t = await getTranslations("AdminDonations")
  const actor = await requireAdmin()
  if (!actor)
    return NextResponse.json(
      { error: t("error.unauthorized") },
      { status: 401 }
    )

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: t("error.invalidJson") }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: t("error.invalidBody"), details: parsed.error.issues },
      { status: 400 }
    )
  }

  const data = parsed.data
  const donationId = generateId()

  const donation = await prisma.donations.create({
    data: {
      id: donationId,
      user_id: data.user_id ? BigInt(data.user_id) : null,
      donor_name: data.donor_name,
      donor_email: data.donor_email,
      amount: data.amount,
      currency: data.currency,
      source: data.source,
      status: data.status,
      external_id: data.external_id,
      is_anonymous: data.is_anonymous,
      message: data.message,
      admin_note: data.admin_note,
      confirmed_by:
        data.status === DonationStatus.CONFIRMED ? actor.userId : null,
      confirmed_at:
        data.status === DonationStatus.CONFIRMED ? new Date() : null,
    },
  })

  return NextResponse.json(
    {
      id: String(donation.id),
      message: t("message.createSuccess"),
    },
    { status: 201 }
  )
}

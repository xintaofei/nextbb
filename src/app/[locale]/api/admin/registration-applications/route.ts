import { NextResponse } from "next/server"
import { z } from "zod"
import { RegistrationApplicationStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const QuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
  q: z.string().optional(),
  status: z.enum(RegistrationApplicationStatus).optional(),
})

type RegistrationApplicationItem = {
  id: string
  email: string
  username: string
  applicationReason: string
  status: RegistrationApplicationStatus
  reviewReason: string | null
  reviewer: { id: string; name: string } | null
  createdAt: string
  reviewedAt: string | null
  userId: string | null
}

type RegistrationApplicationListResult = {
  items: RegistrationApplicationItem[]
  page: number
  pageSize: number
  total: number
}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  }

  const page = parsed.data.page ? Number(parsed.data.page) : 1
  const requestedPageSize = parsed.data.pageSize
    ? Number(parsed.data.pageSize)
    : DEFAULT_PAGE_SIZE
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const q = parsed.data.q?.trim()

  const where: {
    OR?: { email?: { contains: string }; username?: { contains: string } }[]
    status?: RegistrationApplicationStatus
  } = {}

  if (q && q.length > 0) {
    where.OR = [{ email: { contains: q } }, { username: { contains: q } }]
  }

  if (parsed.data.status) {
    where.status = parsed.data.status
  }

  const total = await prisma.registration_applications.count({ where })
  const rows = await prisma.registration_applications.findMany({
    where,
    orderBy: { created_at: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      email: true,
      username: true,
      application_reason: true,
      status: true,
      review_reason: true,
      created_at: true,
      reviewed_at: true,
      user_id: true,
      reviewer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const items: RegistrationApplicationItem[] = rows.map((row) => ({
    id: String(row.id),
    email: row.email,
    username: row.username,
    applicationReason: row.application_reason,
    status: row.status,
    reviewReason: row.review_reason,
    reviewer: row.reviewer
      ? { id: String(row.reviewer.id), name: row.reviewer.name }
      : null,
    createdAt: row.created_at.toISOString(),
    reviewedAt: row.reviewed_at ? row.reviewed_at.toISOString() : null,
    userId: row.user_id ? String(row.user_id) : null,
  }))

  const result: RegistrationApplicationListResult = {
    items,
    page,
    pageSize,
    total,
  }

  return NextResponse.json(result, { status: 200 })
}

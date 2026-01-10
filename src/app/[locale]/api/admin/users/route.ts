import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/guard"

const QuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
  q: z.string().optional(),
  status: z.string().regex(/^\d+$/).optional(), // 1=正常, 0=禁用
  deleted: z.enum(["true", "false"]).optional(),
})

type UserListItem = {
  id: string
  email: string
  name: string
  avatar: string
  isAdmin: boolean
  status: number
  isDeleted: boolean
  createdAt: string
}

type UserListResult = {
  items: UserListItem[]
  page: number
  pageSize: number
  total: number
}

export async function GET(req: Request) {
  const actor = await requireAdmin()
  if (!actor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const parsed = QuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    deleted: url.searchParams.get("deleted") ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  }
  const page = parsed.data.page ? Number(parsed.data.page) : 1
  const pageSize = parsed.data.pageSize ? Number(parsed.data.pageSize) : 20

  const where: {
    OR?: { email?: { contains: string }; name?: { contains: string } }[]
    status?: number
    is_deleted?: boolean
  } = {}
  const q = parsed.data.q?.trim()
  if (q && q.length > 0) {
    where.OR = [{ email: { contains: q } }, { name: { contains: q } }]
  }
  if (parsed.data.status) {
    where.status = Number(parsed.data.status)
  }
  if (parsed.data.deleted) {
    where.is_deleted = parsed.data.deleted === "true"
  }

  const total = await prisma.users.count({ where })
  const rows = await prisma.users.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      is_admin: true,
      status: true,
      is_deleted: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const items: UserListItem[] = rows.map((u) => ({
    id: String(u.id),
    email: u.email,
    name: u.name,
    avatar: u.avatar,
    isAdmin: u.is_admin,
    status: u.status,
    isDeleted: u.is_deleted,
    createdAt: u.created_at.toISOString(),
  }))

  const result: UserListResult = { items, page, pageSize, total }
  return NextResponse.json(result, { status: 200 })
}

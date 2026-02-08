import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CACHE_TTL_MS = 5 * 60 * 1000
let cachedData: {
  users: number
  topics: number
  posts: number
  interactions: number
} | null = null
let cacheTimestamp = 0

export async function GET() {
  try {
    const now = Date.now()
    if (cachedData && now - cacheTimestamp < CACHE_TTL_MS) {
      return NextResponse.json(cachedData)
    }

    const [users, topics, posts, likes, bookmarks] = await Promise.all([
      prisma.users.count({ where: { is_deleted: false } }),
      prisma.topics.count({ where: { is_deleted: false } }),
      prisma.posts.count({ where: { is_deleted: false } }),
      prisma.post_likes.count(),
      prisma.post_bookmarks.count(),
    ])

    cachedData = {
      users,
      topics,
      posts,
      interactions: likes + bookmarks,
    }
    cacheTimestamp = now

    return NextResponse.json(cachedData)
  } catch (error) {
    console.error("Failed to fetch overview stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

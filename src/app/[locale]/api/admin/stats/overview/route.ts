import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [users, topics, posts, likes, bookmarks] = await Promise.all([
      prisma.users.count({ where: { is_deleted: false } }),
      prisma.topics.count({ where: { is_deleted: false } }),
      prisma.posts.count({ where: { is_deleted: false } }),
      prisma.post_likes.count(),
      prisma.post_bookmarks.count(),
    ])

    return NextResponse.json({
      users,
      topics,
      posts,
      interactions: likes + bookmarks,
    })
  } catch (error) {
    console.error("Failed to fetch overview stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

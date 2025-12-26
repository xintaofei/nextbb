import {
  TimelineStepsItem,
  TimelineStepsConnector,
  TimelineStepsIcon,
  TimelineStepsContent,
  TimelineStepsAction,
  TimelineStepsTitle,
  TimelineStepsTime,
  TimelineStepsDescription,
} from "@/components/ui/timeline-steps"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bookmark, Heart, Reply, Pencil, Trash } from "lucide-react"
import { formatRelative } from "@/lib/time"
import { PostItem } from "@/types/topic"

export function TopicPostItem({
  post,
  index,
  anchorId,
  currentUserId,
  mutatingPostId,
  likeMutating,
  bookmarkMutating,
  editMutating,
  deleteMutating,
  onLike,
  onBookmark,
  onEdit,
  onDelete,
  onReply,
  floorOpText,
  replyText,
  deletedText,
  highlight = false,
}: {
  post: PostItem
  index: number
  anchorId?: string
  currentUserId: string | null
  mutatingPostId: string | null
  likeMutating: boolean
  bookmarkMutating: boolean
  editMutating: boolean
  deleteMutating: boolean
  onLike: (postId: string) => void | Promise<void>
  onBookmark: (postId: string) => void | Promise<void>
  onEdit: (postId: string, initialContent: string) => void
  onDelete: (postId: string) => void | Promise<void>
  onReply: (postId: string, authorName: string) => void
  floorOpText: string
  replyText: string
  deletedText: string
  highlight?: boolean
}) {
  return (
    <TimelineStepsItem
      id={anchorId}
      data-post-anchor
      className={highlight ? "animate-(--animate-highlight-fade)" : ""}
    >
      <TimelineStepsConnector />
      <TimelineStepsIcon
        size="lg"
        className="sticky top-4 overflow-hidden p-0.5"
      >
        <Avatar className="size-full">
          <AvatarImage src={post.author.avatar} alt="@avatar" />
          <AvatarFallback>{post.author.name}</AvatarFallback>
        </Avatar>
      </TimelineStepsIcon>
      <TimelineStepsContent className={`border-b`}>
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-row gap-2">
            <TimelineStepsTitle>{post.author.name}</TimelineStepsTitle>
            <TimelineStepsTime>
              {formatRelative(post.createdAt)}
            </TimelineStepsTime>
          </div>
          <span className="text-muted-foreground text-sm">
            {index === 0 ? floorOpText : "#" + index}
          </span>
        </div>
        <TimelineStepsDescription>
          {post.isDeleted ? (
            <span className="text-muted-foreground">{deletedText}</span>
          ) : (
            post.content
          )}
        </TimelineStepsDescription>
        <TimelineStepsAction>
          {post.isDeleted ? null : (
            <>
              {post.author.id !== currentUserId ? (
                <>
                  <Button
                    variant="ghost"
                    disabled={mutatingPostId === post.id || likeMutating}
                    onClick={() => onLike(post.id)}
                  >
                    <Heart
                      className={post.liked ? "text-red-500" : undefined}
                      fill={post.liked ? "currentColor" : "none"}
                    />
                    {post.likes > 0 && (
                      <span className="ml-1 text-sm">{post.likes}</span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={mutatingPostId === post.id || bookmarkMutating}
                    onClick={() => onBookmark(post.id)}
                  >
                    <Bookmark
                      className={post.bookmarked ? "text-primary" : undefined}
                      fill={post.bookmarked ? "currentColor" : "none"}
                    />
                    {post.bookmarks > 0 && (
                      <span className="ml-1 text-sm">{post.bookmarks}</span>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(post.id, post.content)}
                    disabled={mutatingPostId === post.id || editMutating}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(post.id)}
                    disabled={mutatingPostId === post.id || deleteMutating}
                  >
                    <Trash />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  onReply(post.id, post.author.name)
                }}
              >
                <Reply />
                {replyText}
              </Button>
            </>
          )}
        </TimelineStepsAction>
      </TimelineStepsContent>
    </TimelineStepsItem>
  )
}

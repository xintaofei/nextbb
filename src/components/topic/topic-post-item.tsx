import {
  TimelineStepsItem,
  TimelineStepsConnector,
  TimelineStepsIcon,
  TimelineStepsContent,
  TimelineStepsAction,
  TimelineStepsTitle,
  TimelineStepsDescription,
} from "@/components/ui/timeline-steps"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Bookmark,
  Heart,
  Reply,
  Pencil,
  Trash,
  Coins,
  Check,
  X,
  Gift,
} from "lucide-react"
import { RelativeTime } from "@/components/common/relative-time"
import { PostItem } from "@/types/topic"
import { UserBadgesDisplay } from "@/components/common/user-badges-display"
import { UserInfoCard } from "@/components/common/user-info-card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useMemo, ReactNode } from "react"
import { EditorStatic } from "@/components/ui/editor-static"

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
  topicTypeSlot,
  showBountyButton = false,
  onReward,
  rewardMutating = false,
  bountyAmount,
  showAcceptButton = false,
  onAccept,
  acceptMutating = false,
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
  topicTypeSlot?: ReactNode
  showBountyButton?: boolean
  onReward?: (
    postId: string,
    receiverId: string,
    amount: number
  ) => void | Promise<void>
  rewardMutating?: boolean
  bountyAmount?: number
  showAcceptButton?: boolean
  onAccept?: (postId: string, isAccepted: boolean) => void | Promise<void>
  acceptMutating?: boolean
}) {
  const contentValue = useMemo(() => {
    try {
      return JSON.parse(post.content)
    } catch {
      return [{ type: "p", children: [{ text: post.content }] }]
    }
  }, [post.content])

  return (
    <TimelineStepsItem
      id={anchorId}
      data-post-anchor
      className={highlight ? "animate-(--animate-highlight-fade)" : ""}
    >
      <TimelineStepsConnector className="max-sm:hidden" />
      <TimelineStepsIcon
        size="lg"
        className="sticky top-18 md:top-4 overflow-hidden p-0.5 max-sm:hidden"
      >
        <UserInfoCard
          userId={post.author.id}
          userName={post.author.name}
          userAvatar={post.author.avatar}
          side="right"
        >
          <Avatar className="size-full cursor-pointer">
            <AvatarImage src={post.author.avatar} alt="@avatar" />
            <AvatarFallback>{post.author.name}</AvatarFallback>
          </Avatar>
        </UserInfoCard>
      </TimelineStepsIcon>
      <TimelineStepsContent className={`border-b`}>
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex flex-row gap-4 max-sm:gap-2 items-center">
            <UserInfoCard
              userId={post.author.id}
              userName={post.author.name}
              userAvatar={post.author.avatar}
              side="right"
            >
              <Avatar className="hidden max-sm:flex size-6 cursor-pointer">
                <AvatarImage src={post.author.avatar} alt="@avatar" />
                <AvatarFallback>{post.author.name}</AvatarFallback>
              </Avatar>
            </UserInfoCard>
            <TimelineStepsTitle>{post.author.name}</TimelineStepsTitle>
            {post.badges && post.badges.length > 0 && (
              <UserBadgesDisplay
                badges={post.badges}
                maxDisplay={1}
                size="sm"
              />
            )}
            {post.bountyReward && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1"
              >
                <Coins className="h-3 w-3" />+{post.bountyReward.amount}
              </Badge>
            )}
            {post.lotteryWin && (
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1"
              >
                <Gift className="h-3 w-3" />
                中奖
              </Badge>
            )}
            {post.questionAcceptance && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                最佳答案
              </Badge>
            )}
          </div>
          <span className="text-muted-foreground text-sm">
            {index === 0 ? floorOpText : "#" + index}
          </span>
        </div>
        <TimelineStepsDescription>
          {post.isDeleted ? (
            <span className="text-muted-foreground">{deletedText}</span>
          ) : (
            <EditorStatic value={contentValue} variant="none" />
          )}
        </TimelineStepsDescription>
        {topicTypeSlot}
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
              {showBountyButton &&
                onReward &&
                bountyAmount &&
                !post.bountyReward && (
                  <Button
                    variant="outline"
                    className="border-amber-200 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                    onClick={() =>
                      onReward(post.id, post.author.id, bountyAmount)
                    }
                    disabled={mutatingPostId === post.id || rewardMutating}
                  >
                    <Coins className="h-4 w-4" />
                    给赏 ({bountyAmount})
                  </Button>
                )}
              {showAcceptButton && onAccept && (
                <Button
                  variant={post.questionAcceptance ? "default" : "outline"}
                  className={
                    post.questionAcceptance
                      ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                      : "border-green-200 hover:bg-green-50 dark:border-green-900/50 dark:hover:bg-green-950/20 text-green-700 dark:text-green-400"
                  }
                  onClick={() => onAccept(post.id, !!post.questionAcceptance)}
                  disabled={mutatingPostId === post.id || acceptMutating}
                >
                  {post.questionAcceptance ? (
                    <>
                      <X className="h-4 w-4" />
                      取消采纳
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      采纳
                    </>
                  )}
                </Button>
              )}
              <div className="flex gap-5 h-5">
                <Separator orientation="vertical" />
                <div className="flex flex-row gap-1 items-center text-muted-foreground">
                  <RelativeTime date={post.createdAt} />
                </div>
              </div>
            </>
          )}
        </TimelineStepsAction>
      </TimelineStepsContent>
    </TimelineStepsItem>
  )
}

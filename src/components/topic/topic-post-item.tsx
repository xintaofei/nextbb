import {
  TimelineSteps,
  TimelineStepsItem,
  TimelineStepsConnector,
  TimelineStepsIcon,
  TimelineStepsContent,
  TimelineStepsAction,
} from "@/components/ui/timeline-steps"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostItem } from "@/types/topic"
import { UserInfoCard } from "@/components/common/user-info-card"
import { ReactNode, useMemo, useState, memo, useCallback } from "react"
import useSWR from "swr"
import {
  PostHeader,
  PostContent,
  PostActions,
  PostReplyExpandButton,
  parseOptions,
} from "@/components/topic/post-parts"
import { Skeleton } from "@/components/ui/skeleton"
import { RelativeTime } from "@/components/common/relative-time"
import parse from "html-react-parser"

const repliesFetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load")
  return (await res.json()) as { items: PostItem[] }
}

const SubReplyItem = memo(function SubReplyItem({ sub }: { sub: PostItem }) {
  return (
    <TimelineStepsItem size="sm">
      <TimelineStepsConnector size="sm" />
      <TimelineStepsIcon size="sm" className="overflow-hidden p-0">
        <UserInfoCard
          userId={sub.author.id}
          userName={sub.author.name}
          userAvatar={sub.author.avatar}
          side="right"
        >
          <Avatar className="size-full cursor-pointer">
            <AvatarImage
              src={sub.author.avatar || undefined}
              alt={sub.author.name}
            />
            <AvatarFallback>{sub.author.name}</AvatarFallback>
          </Avatar>
        </UserInfoCard>
      </TimelineStepsIcon>
      <TimelineStepsContent>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{sub.author.name}</span>
          <span className="text-xs text-muted-foreground">
            <RelativeTime date={sub.createdAt} />
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {sub.contentHtml ? (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-normal">
              {parse(sub.contentHtml, parseOptions)}
            </div>
          ) : (
            sub.content
          )}
        </div>
      </TimelineStepsContent>
    </TimelineStepsItem>
  )
})

interface TopicPostItemProps {
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
  repliesText: string
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
}

export const TopicPostItem = memo(function TopicPostItem({
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
  repliesText,
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
}: TopicPostItemProps) {
  const displayAvatar = useMemo(() => {
    return post.author.avatar || undefined
  }, [post.author.avatar])

  const [expanded, setExpanded] = useState(false)

  const handleShowReplies = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const { data: subRepliesData, isLoading: loadingSubReplies } = useSWR(
    expanded ? `/api/post/${post.id}/replies` : null,
    repliesFetcher
  )

  const subReplies = subRepliesData?.items || []

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
            <AvatarImage src={displayAvatar} alt="@avatar" />
            <AvatarFallback>{post.author.name}</AvatarFallback>
          </Avatar>
        </UserInfoCard>
      </TimelineStepsIcon>
      <TimelineStepsContent className={`border-b`}>
        <PostHeader post={post} index={index} floorOpText={floorOpText} />

        <PostContent post={post} deletedText={deletedText} />

        {topicTypeSlot}

        <div>
          {!post.isDeleted && (
            <TimelineStepsAction>
              <PostReplyExpandButton
                post={post}
                onShowReplies={handleShowReplies}
                repliesText={repliesText}
              />
              <PostActions
                post={post}
                currentUserId={currentUserId}
                mutatingPostId={mutatingPostId}
                likeMutating={likeMutating}
                bookmarkMutating={bookmarkMutating}
                editMutating={editMutating}
                deleteMutating={deleteMutating}
                onLike={onLike}
                onBookmark={onBookmark}
                onEdit={onEdit}
                onDelete={onDelete}
                onReply={onReply}
                replyText={replyText}
                showBountyButton={showBountyButton}
                onReward={onReward}
                rewardMutating={rewardMutating}
                bountyAmount={bountyAmount}
                showAcceptButton={showAcceptButton}
                onAccept={onAccept}
                acceptMutating={acceptMutating}
              />
            </TimelineStepsAction>
          )}
          {expanded && (
            <TimelineSteps className="my-4">
              {loadingSubReplies ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TimelineStepsItem key={i} size="sm">
                    <TimelineStepsConnector size="sm" />
                    <TimelineStepsIcon
                      size="sm"
                      className="border-none bg-muted"
                    />
                    <TimelineStepsContent>
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </TimelineStepsContent>
                  </TimelineStepsItem>
                ))
              ) : subReplies.length > 0 ? (
                subReplies.map((sub) => <SubReplyItem key={sub.id} sub={sub} />)
              ) : (
                <div className="text-sm text-muted-foreground py-2 pl-2">
                  No replies yet.
                </div>
              )}
            </TimelineSteps>
          )}
        </div>
      </TimelineStepsContent>
    </TimelineStepsItem>
  )
})

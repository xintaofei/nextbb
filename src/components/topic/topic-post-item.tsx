import {
  TimelineStepsItem,
  TimelineStepsConnector,
  TimelineStepsIcon,
  TimelineStepsContent,
} from "@/components/ui/timeline-steps"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostItem } from "@/types/topic"
import { UserInfoCard } from "@/components/common/user-info-card"
import { ReactNode, useMemo } from "react"
import {
  PostHeader,
  PostContent,
  PostActions,
} from "@/components/topic/post-parts"

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
}: TopicPostItemProps) {
  const displayAvatar = useMemo(() => {
    return post.author.avatar || undefined
  }, [post.author.avatar])

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
      </TimelineStepsContent>
    </TimelineStepsItem>
  )
}

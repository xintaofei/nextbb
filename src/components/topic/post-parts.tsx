import {
  TimelineStepsTitle,
  TimelineStepsDescription,
} from "@/components/ui/timeline-steps"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  ChevronDown,
  Languages,
  Loader2,
} from "lucide-react"
import { useState } from "react"
import { RelativeTime } from "@/components/common/relative-time"
import { PostItem } from "@/types/topic"
import { UserBadgesDisplay } from "@/components/common/user-badges-display"
import { UserInfoCard } from "@/components/common/user-info-card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { memo } from "react"
import parse, {
  DOMNode,
  Element,
  domToReact,
  HTMLReactParserOptions,
} from "html-react-parser"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

// --- Helper Components ---

export const PostBadges = memo(function PostBadges({
  post,
  size = "sm",
}: {
  post: PostItem
  size?: "xs" | "sm" | "md" | "lg"
}) {
  const tCommon = useTranslations("Common")
  const tQuestion = useTranslations("Question")

  return (
    <>
      {post.badges && post.badges.length > 0 && (
        <UserBadgesDisplay badges={post.badges} maxDisplay={1} size={size} />
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
          {tCommon("won")}
        </Badge>
      )}
      {post.questionAcceptance && (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1"
        >
          <Check className="h-3 w-3" />
          {tQuestion("acceptance.status.bestAnswer")}
        </Badge>
      )}
    </>
  )
})

export const PostHeader = memo(function PostHeader({
  post,
  index,
  floorOpText,
  size = "sm",
  currentLocale,
  onLanguageChange,
}: {
  post: PostItem
  index: number
  floorOpText: React.ReactNode
  size?: "xs" | "sm" | "md" | "lg"
  currentLocale?: string
  onLanguageChange?: (locale: string) => void
}) {
  const displayAvatar = post.author.avatar || undefined
  const [languages, setLanguages] = useState<
    { locale: string; isSource: boolean }[]
  >([])
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
    if (open && languages.length === 0) {
      setIsLoadingLanguages(true)
      try {
        const res = await fetch(`/api/post/${post.id}/languages`)
        if (res.ok) {
          const data = await res.json()
          setLanguages(data.languages)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoadingLanguages(false)
      }
    }
  }

  return (
    <div className="flex flex-row justify-between items-center w-full">
      <div className="flex flex-row gap-4 max-sm:gap-2 items-center">
        <UserInfoCard
          userId={post.author.id}
          userName={post.author.name}
          userAvatar={post.author.avatar}
          side="right"
        >
          <Avatar className="hidden max-sm:flex size-6 cursor-pointer">
            <AvatarImage src={displayAvatar} alt="@avatar" />
            <AvatarFallback>{post.author.name}</AvatarFallback>
          </Avatar>
        </UserInfoCard>
        <TimelineStepsTitle>{post.author.name}</TimelineStepsTitle>
        <PostBadges post={post} size={size} />
      </div>
      <div className="flex items-center gap-2">
        {/* 多语言 */}
        {onLanguageChange && currentLocale && (
          <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-5 px-2 text-muted-foreground text-${size}`}
                  >
                    <Languages className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>此帖子最初使用 {currentLocale} 编写</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>多语言选择</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoadingLanguages ? (
                <div className="p-2 flex justify-center items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <DropdownMenuRadioGroup
                  value={currentLocale}
                  onValueChange={onLanguageChange}
                >
                  {languages.map((lang) => (
                    <DropdownMenuRadioItem
                      key={lang.locale}
                      value={lang.locale}
                    >
                      {lang.locale}
                      {lang.isSource && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Source)
                        </span>
                      )}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <span className={`text-muted-foreground text-${size}`}>
          {index === 0 ? floorOpText : "#" + index}
        </span>
      </div>
    </div>
  )
})

export const parseOptions: HTMLReactParserOptions = {
  replace: (domNode) => {
    if (
      domNode instanceof Element &&
      domNode.name === "span" &&
      domNode.attribs["data-type"] === "mention"
    ) {
      const userId = domNode.attribs["data-id"]
      return (
        <UserInfoCard userId={userId} side="top">
          <span
            className={cn("cursor-pointer", domNode.attribs.class)}
            style={
              domNode.attribs.style
                ? (domNode.attribs.style as unknown as React.CSSProperties)
                : undefined
            }
          >
            {domToReact(domNode.children as DOMNode[], parseOptions)}
          </span>
        </UserInfoCard>
      )
    }
  },
}

export const PostContent = memo(function PostContent({
  post,
  deletedText,
  translatedContent,
}: {
  post: PostItem
  deletedText: string
  translatedContent?: string | null
}) {
  return (
    <TimelineStepsDescription>
      {post.isDeleted ? (
        <span className="text-muted-foreground">{deletedText}</span>
      ) : translatedContent ? (
        <div className="prose dark:prose-invert max-w-none whitespace-normal">
          {parse(translatedContent, parseOptions)}
        </div>
      ) : post.contentHtml ? (
        <div className="prose dark:prose-invert max-w-none whitespace-normal">
          {parse(post.contentHtml, parseOptions)}
        </div>
      ) : (
        post.content
      )}
    </TimelineStepsDescription>
  )
})

interface PostActionsProps {
  post: PostItem
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
  replyText: string
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

export const PostReplyExpandButton = memo(function PostReplyExpandButton({
  post,
  onShowReplies,
  repliesText,
  isExpanded,
}: {
  post: PostItem
  onShowReplies?: (postId: string) => void
  repliesText?: string
  isExpanded?: boolean
}) {
  if (post.replyCount > 0 && onShowReplies) {
    return (
      <Button
        variant={isExpanded ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onShowReplies(post.id)}
      >
        {post.replyCount} {repliesText}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </Button>
    )
  }
  return <span></span>
})

export const PostActions = memo(function PostActions({
  post,
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
  replyText,
  showBountyButton,
  onReward,
  rewardMutating,
  bountyAmount,
  showAcceptButton,
  onAccept,
  acceptMutating,
}: PostActionsProps) {
  const tBounty = useTranslations("Topic.Bounty")
  const tQuestion = useTranslations("Topic.Question")

  if (post.isDeleted) return null

  return (
    <div className="flex flex-row justify-between items-center gap-2">
      {post.author.id !== currentUserId ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            disabled={mutatingPostId === post.id || likeMutating}
            onClick={() => onLike(post.id)}
            aria-label="Like"
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
            size="sm"
            disabled={mutatingPostId === post.id || bookmarkMutating}
            onClick={() => onBookmark(post.id)}
            aria-label="Bookmark"
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
            className="size-8"
            onClick={() => onEdit(post.id, post.content)}
            disabled={mutatingPostId === post.id || editMutating}
            aria-label="Edit"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            className="size-8"
            onClick={() => onDelete(post.id)}
            disabled={mutatingPostId === post.id || deleteMutating}
            aria-label="Delete"
          >
            <Trash />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          onReply(post.id, "")
        }}
      >
        <Reply />
        {replyText}
      </Button>
      {showBountyButton && onReward && bountyAmount && !post.bountyReward && (
        <Button
          variant="outline"
          size="sm"
          className="border-amber-200 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400"
          onClick={() => onReward(post.id, post.author.id, bountyAmount)}
          disabled={mutatingPostId === post.id || rewardMutating}
        >
          <Coins className="h-4 w-4" />
          {tBounty("action.reward")} ({bountyAmount})
        </Button>
      )}
      {showAcceptButton && onAccept && (
        <Button
          variant={post.questionAcceptance ? "default" : "outline"}
          size="sm"
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
              {tQuestion("actions.cancelAccept")}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {tQuestion("actions.accept")}
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
    </div>
  )
})

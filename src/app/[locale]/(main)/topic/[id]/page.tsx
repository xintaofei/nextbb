"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { BadgeCheckIcon, Bookmark, Flag, Heart, Reply } from "lucide-react"
import {
  TimelineSteps,
  TimelineStepsAction,
  TimelineStepsConnector,
  TimelineStepsContent,
  TimelineStepsDescription,
  TimelineStepsIcon,
  TimelineStepsItem,
  TimelineStepsTime,
  TimelineStepsTitle,
} from "@/components/ui/timeline-steps"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { TopicNavigator } from "@/components/topic/topic-navigator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslations } from "next-intl"

export default function TopicPage() {
  const { id } = useParams<{ id: string }>()
  const tc = useTranslations("Common")
  const t = useTranslations("Topic")

  const topic = {
    id: id,
    title: "关于目前常用大模型平台的数据隐私的问题",
  }

  const posts = [
    {
      id: "1",
      author: {
        id: "1",
        name: "冬天的秘密",
        avatar: "https://github.com/shadcn.png",
      },
      content:
        "比较好奇想听听各位佬对目前类似ChatGPT，Gemini，Grok这种大模型对用户数据信息处理的理解？\n" +
        "因为我目前在跟导写论文，导再三强调不要把idea告诉AI，只能把AI当图书馆，我就很怕AI会有类似idea泄露的问题，所以求教各位佬对这个问题的看法",
      time: "3分钟",
    },
    {
      id: "2",
      author: {
        id: "2",
        name: "Xggz2",
        avatar: "https://github.com/maxleiter.png",
      },
      content: "Swedish should be 100% now! Trying to keep it up-to-date",
      time: "3分钟",
    },
    {
      id: "3",
      author: {
        id: "2",
        name: "Xggz3",
        avatar: "https://github.com/evilrabbit.png",
      },
      content: "Swedish should be 100% now! Trying to keep it up-to-date",
      time: "3分钟",
    },
    {
      id: "4",
      author: {
        id: "2",
        name: "Xggz4",
        avatar: "https://github.com/shadcn.png",
      },
      content: "Swedish should be 100% now! Trying to keep it up-to-date",
      time: "3分钟",
    },
    {
      id: "5",
      author: {
        id: "2",
        name: "Xggz5",
        avatar: "https://github.com/shadcn.png",
      },
      content: "Swedish should be 100% now! Trying to keep it up-to-date",
      time: "3分钟",
    },
    {
      id: "6",
      author: {
        id: "2",
        name: "Xggz6",
        avatar: "https://github.com/evilrabbit.png",
      },
      content: "Swedish should be 100% now! Trying to keep it up-to-date",
      time: "3分钟",
    },
    {
      id: "7",
      author: {
        id: "2",
        name: "Xggz7",
        avatar: "https://github.com/evilrabbit.png",
      },
      content: "Swedish should be 100% now! Trying to keep it up-to-date",
      time: "3分钟",
    },
    {
      id: "8",
      author: {
        id: "2",
        name: "Xggz8",
        avatar: "https://github.com/maxleiter.png",
      },
      content: "Swedish should be 100% now! Trying to keep it up-to-date",
      time: "3分钟",
    },
  ]

  const relatedTopics = [
    {
      id: "101",
      title: "如何在生产中安全使用AI助手",
      replies: 12,
      views: 1543,
      activity: "2 小时前",
    },
    {
      id: "102",
      title: "企业内部知识库与大模型集成方案",
      replies: 8,
      views: 987,
      activity: "5 小时前",
    },
    {
      id: "103",
      title: "Prompt 编写最佳实践合集",
      replies: 23,
      views: 3201,
      activity: "1 天前",
    },
    {
      id: "104",
      title: "开源模型与闭源模型的权衡",
      replies: 15,
      views: 2109,
      activity: "3 天前",
    },
    {
      id: "105",
      title: "开源模型与闭源模型的权衡",
      replies: 15,
      views: 2109,
      activity: "3 天前",
    },
  ]

  return (
    <div className="flex min-h-screen w-full flex-col p-8 gap-8">
      <div className="flex flex-col gap-2">
        <Link href={`/topic/${topic.id}`}>
          <span className="cursor-pointer max-w-full text-2xl font-medium whitespace-normal wrap-break-word">
            {topic.title}
          </span>
        </Link>
        <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
          <Badge variant="secondary">{tc("Badge.secondary")}</Badge>
          <Badge
            variant="secondary"
            className="bg-blue-500 text-white dark:bg-blue-600"
          >
            <BadgeCheckIcon />
            {tc("Badge.verified")}
          </Badge>
          <Badge variant="destructive">{tc("Badge.destructive")}</Badge>
          <Badge variant="outline">{tc("Badge.outline")}</Badge>
        </div>
      </div>
      <div className="flex flex-row justify-between gap-8">
        <div className="flex-1">
          <TimelineSteps>
            {posts.map((post, index) => (
              <TimelineStepsItem
                id={`post-${index + 1}`}
                data-post-anchor
                key={post.id}
              >
                <TimelineStepsConnector />
                <TimelineStepsIcon size="lg" className="overflow-hidden p-0">
                  <Avatar className="size-full">
                    <AvatarImage src={post.author.avatar} alt="@shadcn" />
                    <AvatarFallback>{post.author.name}</AvatarFallback>
                  </Avatar>
                </TimelineStepsIcon>
                <TimelineStepsContent className="border-b">
                  <div className="flex flex-row justify-between items-center w-full">
                    <div className="flex flex-row gap-2">
                      <TimelineStepsTitle>
                        {post.author.name}
                      </TimelineStepsTitle>
                      <TimelineStepsTime>
                        {tc("Time.minutesAgo", { count: 5 })}
                      </TimelineStepsTime>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {index === 0 ? t("floor.op") : "#" + index}
                    </span>
                  </div>
                  <TimelineStepsDescription>
                    {post.content}
                  </TimelineStepsDescription>
                  <TimelineStepsAction>
                    <Button variant="ghost" size="icon">
                      <Heart />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Bookmark />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Flag />
                    </Button>
                    <Button variant="ghost">
                      <Reply className="text-foreground" />
                      {t("reply")}
                    </Button>
                  </TimelineStepsAction>
                </TimelineStepsContent>
              </TimelineStepsItem>
            ))}
          </TimelineSteps>
        </div>
        <TopicNavigator total={posts.length} />
      </div>
      <Table className="w-full table-fixed">
        <colgroup>
          <col />
          <col className="w-20" />
          <col className="w-20" />
          <col className="w-20" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>{tc("Table.topic")}</TableHead>
            <TableHead className="text-center">{tc("Table.replies")}</TableHead>
            <TableHead className="text-center">{tc("Table.views")}</TableHead>
            <TableHead className="text-center">
              {tc("Table.activity")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {relatedTopics.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="max-w-full">
                <Link href={`/topic/${t.id}`}>
                  <span className="cursor-pointer max-w-full text-lg font-medium whitespace-normal break-words">
                    {t.title}
                  </span>
                </Link>
                <div className="flex max-w-full flex-wrap gap-2 overflow-hidden mt-2">
                  <Badge variant="secondary">{tc("Badge.secondary")}</Badge>
                  <Badge
                    variant="secondary"
                    className="bg-blue-500 text-white dark:bg-blue-600"
                  >
                    <BadgeCheckIcon />
                    {tc("Badge.verified")}
                  </Badge>
                  <Badge variant="destructive">{tc("Badge.destructive")}</Badge>
                  <Badge variant="outline">{tc("Badge.outline")}</Badge>
                </div>
              </TableCell>
              <TableCell className="text-center">{t.replies}</TableCell>
              <TableCell className="text-center">{t.views}</TableCell>
              <TableCell className="text-center text-muted-foreground">
                {t.activity}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

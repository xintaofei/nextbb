"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { BadgeCheckIcon, ChevronsUpDown, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NewTopicButton } from "@/components/main/new-topic/new-topic-button"
import { NewTopicDialog } from "@/components/main/new-topic/new-topic-dialog"

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>()
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false)

  const categories: Record<string, { name: string; description: string }> = {
    "1": { name: "AI讨论", description: "围绕大模型、应用与实践的交流" },
    "2": { name: "资源分享", description: "工具、教程、脚本与经验的集中分享" },
    "3": { name: "求助与答疑", description: "问题求助与技术答疑讨论区" },
    "4": { name: "闲聊区", description: "与主题相关的轻松聊天与想法" },
  }

  const category = categories[id] ?? {
    name: `类别 ${id}`,
    description: "暂无描述",
  }

  const topics = [
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
  ]

  return (
    <div className="flex min-h-screen w-full flex-col px-8 gap-4">
      <div className="flex flex-row justify-between items-start py-8">
        <div className="flex flex-col">
          <h1 className="text-5xl">{category.name}</h1>
          <span className="text-muted-foreground mt-2">
            {category.description}
          </span>
        </div>
        <InputGroup className="w-80">
          <InputGroupInput placeholder="Search..." />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-4">
          <div className="flex flex-row gap-2">
            <Button
              variant="outline"
              role="combobox"
              className="w-20 justify-between"
            >
              类别
              <ChevronsUpDown className="opacity-50" />
            </Button>
            <Button
              variant="outline"
              role="combobox"
              className="w-20 justify-between"
            >
              标签
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </div>
          <Tabs defaultValue="1">
            <TabsList>
              <TabsTrigger value="1">最新</TabsTrigger>
              <TabsTrigger value="2">热门</TabsTrigger>
              <TabsTrigger value="3">排行榜</TabsTrigger>
              <TabsTrigger value="4">类别</TabsTrigger>
              <TabsTrigger value="5">我的帖子</TabsTrigger>
              <TabsTrigger value="6">收藏</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-row gap-2">
          <NewTopicButton onClick={() => setIsNewTopicDialogOpen(true)} />
        </div>
      </div>
      <Table className="w-full table-fixed">
        <colgroup>
          <col />
          <col className="w-40" />
          <col className="w-20" />
          <col className="w-20" />
          <col className="w-20" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={2}>话题</TableHead>
            <TableHead className="text-center">回复</TableHead>
            <TableHead className="text-center">浏览量</TableHead>
            <TableHead className="text-center">活动</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="flex flex-col gap-2">
                <Link href={`/topic/${t.id}`}>
                  <span className="cursor-pointer max-w-full text-lg font-medium whitespace-normal break-words">
                    {t.title}
                  </span>
                </Link>
                <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge
                    variant="secondary"
                    className="bg-blue-500 text-white dark:bg-blue-600"
                  >
                    <BadgeCheckIcon />
                    Verified
                  </Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                  <Avatar>
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="@shadcn"
                    />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarImage
                      src="https://github.com/maxleiter.png"
                      alt="@maxleiter"
                    />
                    <AvatarFallback>LR</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarImage
                      src="https://github.com/evilrabbit.png"
                      alt="@evilrabbit"
                    />
                    <AvatarFallback>ER</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarImage
                      src="https://github.com/evilrabbit.png"
                      alt="@evilrabbit"
                    />
                    <AvatarFallback>ER</AvatarFallback>
                  </Avatar>
                  <Avatar>
                    <AvatarImage
                      src="https://github.com/maxleiter.png"
                      alt="@evilrabbit"
                    />
                    <AvatarFallback>ER</AvatarFallback>
                  </Avatar>
                </div>
              </TableCell>
              <TableCell className="text-center">{t.replies}</TableCell>
              <TableCell className="text-center">{t.views}</TableCell>
              <TableCell className="text-center">{t.activity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <NewTopicDialog
        open={isNewTopicDialogOpen}
        onOpenChange={setIsNewTopicDialogOpen}
      />
    </div>
  )
}

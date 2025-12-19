"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
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
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { NewTopicDialog } from "@/components/new-topic/new-topic-dialog"
import { useTranslations } from "next-intl"

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>()
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false)
  const tc = useTranslations("Common")
  const tCat = useTranslations("Category")

  type CategoryInfo = {
    id: string
    name: string
    icon?: string
    description: string | null
  }

  const [category, setCategory] = useState<CategoryInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`/api/category/${id}`, { cache: "no-store" })
        if (!res.ok) {
          const fallback: CategoryInfo = {
            id,
            name: tCat("defaultName", { id }),
            icon: "📁",
            description: null,
          }
          if (!cancelled) setCategory(fallback)
          return
        }
        const data: CategoryInfo = await res.json()
        if (!cancelled) setCategory(data)
      } catch {
        const fallback: CategoryInfo = {
          id,
          name: tCat("defaultName", { id }),
          icon: "📁",
          description: null,
        }
        if (!cancelled) setCategory(fallback)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, tCat])

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
          <div className="flex items-center gap-3">
            <span className="text-5xl leading-none">
              {category?.icon ?? "📁"}
            </span>
            <h1 className="text-5xl">
              {category?.name ?? tCat("defaultName", { id })}
            </h1>
          </div>
          <span className="text-muted-foreground mt-2">
            {category?.description ?? tCat("noDescription")}
          </span>
        </div>
        <InputGroup className="w-80">
          <InputGroupInput placeholder={tc("Search.placeholder")} />
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
              {tc("Filters.category")}
              <ChevronsUpDown className="opacity-50" />
            </Button>
            <Button
              variant="outline"
              role="combobox"
              className="w-20 justify-between"
            >
              {tc("Filters.tag")}
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </div>
          <Tabs defaultValue="1">
            <TabsList>
              <TabsTrigger value="1">{tc("Tabs.latest")}</TabsTrigger>
              <TabsTrigger value="2">{tc("Tabs.hot")}</TabsTrigger>
              <TabsTrigger value="3">{tc("Tabs.leaderboard")}</TabsTrigger>
              <TabsTrigger value="4">{tc("Tabs.categories")}</TabsTrigger>
              <TabsTrigger value="5">{tc("Tabs.myPosts")}</TabsTrigger>
              <TabsTrigger value="6">{tc("Tabs.favorites")}</TabsTrigger>
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
            <TableHead colSpan={2}>{tc("Table.topic")}</TableHead>
            <TableHead className="text-center">{tc("Table.replies")}</TableHead>
            <TableHead className="text-center">{tc("Table.views")}</TableHead>
            <TableHead className="text-center">
              {tc("Table.activity")}
            </TableHead>
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

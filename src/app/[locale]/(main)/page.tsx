import { useTranslations } from "next-intl"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  BadgeCheckIcon,
  Check,
  ChevronsUpDown,
  Edit,
  SearchIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

export default function Home() {
  const t = useTranslations("Index")

  const topics = [
    {
      id: "1",
      title: "Claude巨头打架太有意思啦，猛猛蹬！",
    },
    {
      id: "2",
      title: "依旧基于方块佬的OpenWebUI response函数，添加了工具调用功能",
    },
    {
      id: "3",
      title: "OIIOII【动漫生成agent】的邀请码两个，有兴趣的可以去玩一下！",
    },
    {
      id: "4",
      title: "你们有遇到没办法用2fa登陆馒头的情况吗",
    },
    {
      id: "5",
      title: "【Claude Code 2API】助力每一个额度清零的梦想！🚀",
    },
    {
      id: "6",
      title: "【抽奖】5个谷歌学生优惠家庭组车位（美区）",
    },
    {
      id: "7",
      title: "周末回来，怎么大家都疯了",
    },
    {
      id: "8",
      title: "有支持vless+reality的安卓客户端吗",
    },
    {
      id: "9",
      title: "十几年前买的十几张的老式手机卡竟然还活着",
    },
    {
      id: "10",
      title:
        "Gpt5.2(high)上线竞技场直接聊天已经两天，稳定霸榜倒数第10&11 勉强超越glm4.6v flash",
    },
    {
      id: "11",
      title: "GPT5.2pro有概率做对今年的CMO2025第一天压轴",
    },
    {
      id: "12",
      title: "甲骨文账号，终于创建成功！",
    },
    {
      id: "13",
      title: "GPT k12教师 是不是被降智了？",
    },
    {
      id: "14",
      title: "tadaCloudflare优选IP筛选工具震撼来袭！",
    },
  ]

  return (
    <div className="flex min-h-screen w-full flex-col pl-8 gap-4">
      <div className="flex flex-row justify-between items-center py-8">
        <h1 className="text-5xl">{t("title")}</h1>
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
          <Button variant="secondary">
            <Edit />
            新建话题
          </Button>
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
          {topics.map((topic) => (
            <TableRow key={topic.id}>
              <TableCell className="flex flex-col gap-2">
                <Label className="max-w-full text-lg whitespace-normal break-words">
                  {topic.title}
                </Label>
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
              <TableCell className="text-center">12</TableCell>
              <TableCell className="text-center">123</TableCell>
              <TableCell className="text-center">3分钟</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

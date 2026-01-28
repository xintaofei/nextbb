import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { TopicType } from "@/types/topic-type"

type PollVoter = {
  id: string
  name: string
  avatar: string
}

type PollOptionResponse = {
  id: string
  text: string
  voteCount: number
  percentage: number
  rank: number
  userVoted: boolean
  voters: PollVoter[] | null
}

type PollConfigResponse = {
  allowMultiple: boolean
  maxChoices: number | null
  showResultsBeforeVote: boolean
  showVoterList: boolean
  totalVotes: number
  totalVoteCount: number
}

type PollDataResponse = {
  config: PollConfigResponse
  options: PollOptionResponse[]
  userVotedOptionIds: string[]
  canVote: boolean
  hasVoted: boolean
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getServerSessionUser()
    const { id: idStr } = await ctx.params

    // 验证主题ID
    let topicId: bigint
    try {
      topicId = BigInt(idStr)
    } catch {
      return NextResponse.json(
        { error: "Invalid topic ID format" },
        { status: 400 }
      )
    }

    // 查询主题信息
    const topic = await prisma.topics.findFirst({
      where: {
        id: topicId,
        is_deleted: false,
      },
      select: {
        id: true,
        type: true,
        status: true,
        end_time: true,
      },
    })

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 })
    }

    if (topic.type !== TopicType.POLL) {
      return NextResponse.json(
        { error: "Topic is not a poll" },
        { status: 404 }
      )
    }

    // 查询投票配置
    const config = await prisma.poll_configs.findUnique({
      where: { topic_id: topicId },
      select: {
        allow_multiple: true,
        max_choices: true,
        show_results_before_vote: true,
        show_voter_list: true,
      },
    })

    if (!config) {
      return NextResponse.json(
        { error: "Poll config not found" },
        { status: 404 }
      )
    }

    // 查询所有投票选项
    const options = await prisma.poll_options.findMany({
      where: {
        topic_id: topicId,
        is_deleted: false,
      },
      select: {
        id: true,
        option_text: true,
        sort: true,
        votes: {
          select: {
            user_id: true,
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { sort: "asc" },
    })

    // 统计每个选项的投票数
    const optionsWithStats = options.map((opt) => ({
      id: String(opt.id),
      text: opt.option_text,
      voteCount: opt.votes.length,
      votes: opt.votes,
    }))

    // 计算总投票人数
    const allVoterIds = new Set<string>()
    const allVotes: bigint[] = []
    options.forEach((opt) => {
      opt.votes.forEach((vote) => {
        allVoterIds.add(String(vote.user_id))
        allVotes.push(vote.user_id)
      })
    })

    const totalVotes = allVoterIds.size
    const totalVoteCount = allVotes.length

    // 排序并计算百分比和排名
    const sortedOptions = [...optionsWithStats].sort(
      (a, b) => b.voteCount - a.voteCount
    )

    let currentRank = 1
    let previousCount = -1
    const rankMap = new Map<string, number>()

    sortedOptions.forEach((opt, index) => {
      if (opt.voteCount !== previousCount) {
        currentRank = index + 1
        previousCount = opt.voteCount
      }
      rankMap.set(opt.id, currentRank)
    })

    // 查询当前用户的投票记录
    let userVotedOptionIds: string[] = []
    if (auth) {
      const userVotes = await prisma.poll_votes.findMany({
        where: {
          user_id: auth.userId,
          option: {
            topic_id: topicId,
            is_deleted: false,
          },
        },
        select: {
          option_id: true,
        },
      })
      userVotedOptionIds = userVotes.map((v) => String(v.option_id))
    }

    // 构建返回数据
    const responseOptions: PollOptionResponse[] = optionsWithStats.map(
      (opt) => {
        const percentage =
          totalVoteCount > 0 ? (opt.voteCount / totalVoteCount) * 100 : 0

        let voters: PollVoter[] | null = null
        if (config.show_voter_list) {
          voters = opt.votes.map((v) => ({
            id: String(v.user.id),
            name: v.user.name,
            avatar: v.user.avatar,
          }))
        }

        return {
          id: opt.id,
          text: opt.text,
          voteCount: opt.voteCount,
          percentage: Math.round(percentage * 100) / 100,
          rank: rankMap.get(opt.id) || optionsWithStats.length + 1,
          userVoted: userVotedOptionIds.includes(opt.id),
          voters,
        }
      }
    )

    // 判断是否可以投票
    const hasVoted = userVotedOptionIds.length > 0
    const isClosed = topic.status === "CLOSED"
    const isExpired = topic.end_time
      ? new Date(topic.end_time) < new Date()
      : false
    const canVote = !!auth && !isClosed && !isExpired

    const response: PollDataResponse = {
      config: {
        allowMultiple: config.allow_multiple,
        maxChoices: config.max_choices,
        showResultsBeforeVote: config.show_results_before_vote,
        showVoterList: config.show_voter_list,
        totalVotes,
        totalVoteCount,
      },
      options: responseOptions,
      userVotedOptionIds,
      canVote,
      hasVoted,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching poll data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

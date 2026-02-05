import { ConversationThread } from "@/components/conversations/conversation-thread"

type ConversationThreadPageProps = {
  params: Promise<{ id: string }>
}

export default async function ConversationThreadPage({
  params,
}: ConversationThreadPageProps) {
  const { id } = await params
  return <ConversationThread conversationId={id} />
}

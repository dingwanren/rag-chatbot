import { ChatArea } from '@/components/chat/ChatArea'

interface ChatDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const { id } = await params

  // TODO: Fetch chat data by id
  const chatTitle = `Chat ${id}`

  return <ChatArea chatId={id} chatTitle={chatTitle} />
}

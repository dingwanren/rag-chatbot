import { KnowledgeBasePage } from '@/components/knowledge/KnowledgeBasePage'

interface KnowledgeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function KnowledgeDetailPage({ params }: KnowledgeDetailPageProps) {
  const { id } = await params

  // TODO: Fetch knowledge base data by id
  const knowledgeBaseName = `Knowledge Base ${id}`

  return <KnowledgeBasePage knowledgeBaseId={id} knowledgeBaseName={knowledgeBaseName} />
}

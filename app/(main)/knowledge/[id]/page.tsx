interface KnowledgeDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function KnowledgeDetailPage({ params }: KnowledgeDetailPageProps) {
  const { id } = await params

  // TODO: Fetch knowledge base data by id
  const knowledgeBaseName = `Knowledge Base ${id}`

  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-semibold mb-4">{knowledgeBaseName}</h1>
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>知识库详情区域 - 待实现</p>
      </div>
    </div>
  )
}

import { NextResponse } from 'next/server'
import { upsertTestVector } from '@/lib/pinecone'

export async function GET() {
  try {
    const result = await upsertTestVector()
    return NextResponse.json(result)
  } catch (error) {
    console.error('test-pinecone error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'upsert failed' },
      { status: 500 }
    )
  }
}

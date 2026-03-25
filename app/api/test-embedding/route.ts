import { NextResponse } from 'next/server'
import { embedText } from '@/lib/embedding'

export async function GET() {
  try {
    console.log('=== 开始测试 embedding ===')
    
    const text = "测试一下 embedding 是否正常"
    console.log('输入文本:', text)
    
    const embedding = await embedText(text)
    
    console.log('=== 测试结果 ===')
    console.log('embedding length:', embedding.length)
    console.log('前 10 个值:', embedding.slice(0, 10))
    
    return NextResponse.json({
      success: true,
      length: embedding.length,
      sample: embedding.slice(0, 10),
    })
  } catch (error) {
    console.error('=== 测试失败 ===')
    console.error('error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

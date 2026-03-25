/**
 * 将文本按字符长度切分成 chunks，相邻 chunk 有重叠
 * @param text - 要切分的文本
 * @param chunkSize - 每个 chunk 的最大字符数
 * @param chunkOverlap - 相邻 chunk 的重叠字符数
 * @returns 切分后的字符串数组
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): string[] {
  // 处理空文本
  if (!text || text.trim().length === 0) {
    return []
  }

  // 校验参数
  if (chunkSize <= 0) {
    throw new Error('chunkSize 必须大于 0')
  }

  if (chunkOverlap < 0) {
    throw new Error('chunkOverlap 不能为负数')
  }

  if (chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap 必须小于 chunkSize')
  }

  const chunks: string[] = []
  const step = chunkSize - chunkOverlap
  let startIndex = 0

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length)
    const chunk = text.slice(startIndex, endIndex)

    // 过滤空字符串
    if (chunk.trim().length > 0) {
      chunks.push(chunk)
    }

    startIndex += step

    // 如果已经到达末尾，退出循环
    if (endIndex >= text.length) {
      break
    }
  }

  return chunks
}

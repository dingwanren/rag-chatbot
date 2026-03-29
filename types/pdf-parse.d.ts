declare module 'pdf-parse' {
  interface PDFMetadata {
    info: Record<string, any>
    metadata?: any
    version: string
    id?: string
  }

  interface PDFData {
    numpages: number
    numrender: number
    info: PDFMetadata
    version: string
    text: string
  }

  function pdf(buffer: Buffer, options?: any): Promise<PDFData>
  export default pdf
}

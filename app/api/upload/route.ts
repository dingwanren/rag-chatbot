import { NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { pinecone } from "@/lib/pinecone";
import { Md5 } from "ts-md5";

const splitDoc = async (doc: Document) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 0,
  });
  const texts = await splitter.splitText(doc.pageContent);

  return texts;
};

const embedChunks = async (chunks: string[]) => {
  const indexName = "chatbot";

  const records = chunks.map((c) => ({
    id: Md5.hashStr(c),
    text: c,
  }));

  // Target the index and Upsert the records into a namespace
  await pinecone.index(indexName).namespace("pdf-doc").upsertRecords(records);
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    // 收到文件后需要解析,langchain有工具
    // 1. 分割成docs
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: "application/pdf" });

    const loader = new WebPDFLoader(blob, {
      // required params = ...
      // optional params = ...
    });

    const docs = await loader.load();

    /**
     *  2. split docs
     *  https://docs.langchain.com/oss/javascript/integrations/splitters#text-structure-based
     */
    const splitDocs = await Promise.all(docs.map(splitDoc));

    // 3. 上传至向量库
    const res = await Promise.all(splitDocs.map(embedChunks));

    console.log("上传向量库", res);

    return NextResponse.json({
      message: "File upload successfully!",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      message: "File upload failed!",
    });
  }
}

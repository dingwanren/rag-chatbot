import type { Metadata } from "next";
import QueryClientProvider from "@/QueryClientProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Chatbot",
  description: "AI-powered RAG chatbot application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <QueryClientProvider>{children}</QueryClientProvider>
      </body>
    </html>
  );
}

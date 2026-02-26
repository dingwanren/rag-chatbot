import { AppSidebar } from "@/components/layout/AppSidebar"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <AppSidebar className="w-72 flex-shrink-0" />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

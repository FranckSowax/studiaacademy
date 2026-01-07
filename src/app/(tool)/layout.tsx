import { ToolHeader } from '@/components/layout/tool-header'

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <ToolHeader />
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  )
}

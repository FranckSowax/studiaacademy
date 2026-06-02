export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeacherLayoutShell } from '@/components/teacher/TeacherLayoutShell'

export default async function ProfesseurLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <TeacherLayoutShell>{children}</TeacherLayoutShell>
}

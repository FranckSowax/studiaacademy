export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getTeacherProfile } from '../../../actions'
import { KahootCreateForm } from '@/components/teacher/KahootCreateForm'

export default async function NouveauKahootPage() {
  const teacher = await getTeacherProfile()
  if (!teacher) redirect('/professeur')
  return <KahootCreateForm />
}

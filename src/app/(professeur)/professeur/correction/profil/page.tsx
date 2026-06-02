export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTeacherProfile } from '../../../actions'
import { CorrectionProfilForm } from '@/components/teacher/CorrectionProfilForm'
import type { WizardConfig, LearnedPatterns } from '@/types/teacher'

export default async function ProfilCorrectionPage() {
  const teacher = await getTeacherProfile()
  if (!teacher) redirect('/professeur')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('correction_profiles')
    .select('*')
    .eq('teacher_id', teacher.id)
    .single()

  const config: WizardConfig = profile?.wizard_config ?? {
    severite: 'standard',
    points_partiels: 'demi_points',
    tolerance_ortho: 'mineure',
    valorise_demarche: true,
  }
  const patterns: LearnedPatterns = profile?.learned_patterns ?? {}

  return (
    <CorrectionProfilForm
      initialConfig={config}
      patterns={patterns}
      version={profile?.version ?? 0}
    />
  )
}

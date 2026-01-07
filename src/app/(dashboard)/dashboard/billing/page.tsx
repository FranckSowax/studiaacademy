import { BillingView } from '@/components/dashboard/billing-view'
import { mockBillingData } from '@/lib/data/mock-billing'

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Facturation & Abonnements</h2>
        <p className="text-muted-foreground">Gérez vos paiements et votre abonnement.</p>
      </div>
      <BillingView data={mockBillingData} />
    </div>
  )
}

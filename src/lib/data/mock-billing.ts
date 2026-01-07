import { BillingData } from '@/types/billing'

export const mockBillingData: BillingData = {
  wallet: {
    balance: 15000,
    currency: 'XAF',
  },
  transactions: [
    {
      id: 'tx-1',
      date: '2024-01-15T10:30:00Z',
      description: 'Achat de crédits (Pack Standard)',
      amount: 10000,
      type: 'credit_purchase',
      status: 'completed',
      paymentMethod: 'Mobile Money',
      invoiceUrl: '#',
    },
    {
      id: 'tx-2',
      date: '2024-01-16T14:15:00Z',
      description: 'Paiement Service: Générateur de CV',
      amount: -2000,
      type: 'service_payment',
      status: 'completed',
      paymentMethod: 'Credits',
    },
    {
      id: 'tx-3',
      date: '2024-01-18T09:00:00Z',
      description: 'Paiement Service: Analyse CV IA',
      amount: -1500,
      type: 'service_payment',
      status: 'completed',
      paymentMethod: 'Credits',
    },
    {
      id: 'tx-4',
      date: '2024-01-20T16:45:00Z',
      description: 'Achat de crédits (Pack Découverte)',
      amount: 5000,
      type: 'credit_purchase',
      status: 'completed',
      paymentMethod: 'Stripe',
      invoiceUrl: '#',
    },
  ],
}

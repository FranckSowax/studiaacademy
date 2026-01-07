export type TransactionType = 'credit_purchase' | 'service_payment' | 'refund'
export type TransactionStatus = 'completed' | 'pending' | 'failed'

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  invoiceUrl?: string
  paymentMethod?: string // 'Mobile Money', 'Stripe', 'Credits'
}

export interface Wallet {
  balance: number
  currency: string
}

export interface BillingData {
  wallet: Wallet
  transactions: Transaction[]
}

'use client'

import { useState } from 'react'
import { BillingData } from '@/types/billing'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreditCard, Download, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { PaymentModal } from '@/components/billing/payment-modal'
import { TopUpModal } from '@/components/billing/top-up-modal'
import { CreditPack } from '@/lib/data/credit-packs'

interface BillingViewProps {
  data: BillingData
}

export function BillingView({ data }: BillingViewProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false)
  const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null)

  const handlePackSelect = (pack: CreditPack) => {
    setSelectedPack(pack)
    setIsTopUpModalOpen(false)
    setIsPaymentModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Wallet Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde actuel</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.wallet.balance.toLocaleString()} {data.wallet.currency}</div>
            <p className="text-xs text-muted-foreground">
              Disponible pour vos achats
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setIsTopUpModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Recharger
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Transactions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
          <CardDescription>
            Vos derniers paiements et rechargements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Facture</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {new Date(tx.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {tx.amount > 0 ? (
                            <div className="p-1 bg-green-100 rounded-full text-green-600">
                                <ArrowDownLeft className="h-3 w-3" />
                            </div>
                        ) : (
                            <div className="p-1 bg-slate-100 rounded-full text-slate-600">
                                <ArrowUpRight className="h-3 w-3" />
                            </div>
                        )}
                        {tx.description}
                    </div>
                  </TableCell>
                  <TableCell>{tx.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'completed' ? 'secondary' : 'outline'} className={tx.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                      {tx.status === 'completed' ? 'Complété' : tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${tx.amount > 0 ? 'text-green-600' : ''}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} XAF
                  </TableCell>
                  <TableCell className="text-right">
                    {tx.invoiceUrl && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={tx.invoiceUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <TopUpModal 
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          onSelectPack={handlePackSelect}
        />

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          amount={selectedPack?.price || 0}
          description={selectedPack ? `Rechargement: ${selectedPack.name}` : ''}
          onSuccess={() => {
            // In a real app, this would trigger a re-fetch of data
            console.log('Payment successful')
          }}
        />
      </Card>
    </div>
  )
}

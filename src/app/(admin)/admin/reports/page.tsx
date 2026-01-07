'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export default function AdminReportsPage() {
  // Mock data for reports
  const reports = [
    {
      id: 'rep-1',
      type: 'content',
      subject: 'Commentaire inapproprié',
      source: 'Forum Communautaire',
      reportedBy: 'jean.dupont@example.com',
      status: 'pending',
      date: '2024-01-20T10:00:00Z',
    },
    {
      id: 'rep-2',
      type: 'user',
      subject: 'Compte suspect',
      source: 'Système',
      reportedBy: 'Automatique',
      status: 'resolved',
      date: '2024-01-19T15:30:00Z',
    },
    {
      id: 'rep-3',
      type: 'bug',
      subject: 'Erreur sur le générateur de CV',
      source: 'Support',
      reportedBy: 'marie.curie@science.org',
      status: 'pending',
      date: '2024-01-21T09:15:00Z',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Signalements</h2>
          <p className="text-muted-foreground">Gérez les signalements et la modération.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signalements récents</CardTitle>
          <CardDescription>
            Liste des incidents signalés par les utilisateurs ou le système.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Signalé par</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {report.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{report.subject}</TableCell>
                  <TableCell>{report.source}</TableCell>
                  <TableCell>{report.reportedBy}</TableCell>
                  <TableCell>
                    <Badge
                      variant={report.status === 'resolved' ? 'secondary' : 'destructive'}
                      className={report.status === 'resolved' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                    >
                      {report.status === 'resolved' ? 'Résolu' : 'En attente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

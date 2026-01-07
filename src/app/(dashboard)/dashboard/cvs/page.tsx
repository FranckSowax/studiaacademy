import { mockCVs } from '@/lib/data/mock-cvs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Edit, Download, Trash2, Plus, Calendar } from 'lucide-react'

export default function CvsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mes CVs</h2>
          <p className="text-muted-foreground">Gérez vos CVs et lettres de motivation.</p>
        </div>
        <Button asChild>
          <Link href="/services/create">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau CV
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockCVs.map((cv) => (
          <Card key={cv.id} className="flex flex-col group">
            <CardHeader className="relative pb-2">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90">
                    <Trash2 className="h-4 w-4" />
                 </Button>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="text-xs font-normal">
                  CV
                </Badge>
              </div>
              <CardTitle className="line-clamp-1">{cv.title}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                Modifié le {new Date(cv.updatedAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-sm text-muted-foreground line-clamp-3">
                {cv.profile.summary || "Aucun résumé disponible."}
              </div>
              <div className="mt-4 flex flex-wrap gap-1">
                 {cv.skills.slice(0, 3).map(skill => (
                    <Badge key={skill.id} variant="secondary" className="text-[10px]">
                        {skill.name}
                    </Badge>
                 ))}
                 {cv.skills.length > 3 && (
                    <Badge variant="secondary" className="text-[10px]">
                        +{cv.skills.length - 3}
                    </Badge>
                 )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1" size="sm" asChild>
                <Link href={`/services/create?id=${cv.id}`}>
                  <Edit className="mr-2 h-3 w-3" />
                  Éditer
                </Link>
              </Button>
              <Button variant="secondary" size="sm">
                <Download className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        ))}

        {mockCVs.length === 0 && (
           <div className="col-span-full p-12 text-center border-2 border-dashed rounded-lg">
             <p className="text-muted-foreground">Vous n'avez pas encore créé de CV.</p>
             <Button variant="link" asChild className="mt-2">
               <Link href="/services/create">Créer mon premier CV</Link>
             </Button>
           </div>
        )}
      </div>
    </div>
  )
}

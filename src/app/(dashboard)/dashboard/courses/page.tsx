import { mockCourses } from '@/lib/data/mock-courses'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PlayCircle, Clock } from 'lucide-react'

export default function CoursesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mes Formations</h2>
        <p className="text-muted-foreground">Suivez votre progression et accédez à vos cours.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockCourses.map((course) => (
          <Card key={course.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <Badge variant="secondary" className="capitalize">
                  {course.level}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {course.duration}
                </div>
              </div>
              <CardTitle className="line-clamp-1">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {course.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-sm text-muted-foreground">
                Instructeur: <span className="font-medium text-foreground">{course.instructor}</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progression</span>
                  <span>0%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-0" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" asChild>
                <Link href={`/services/${course.id}/start`}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Commencer
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {mockCourses.length === 0 && (
           <div className="col-span-full p-12 text-center border-2 border-dashed rounded-lg">
             <p className="text-muted-foreground">Vous n'êtes inscrit à aucune formation pour le moment.</p>
             <Button variant="link" asChild className="mt-2">
               <Link href="/services">Parcourir le catalogue</Link>
             </Button>
           </div>
        )}
      </div>
    </div>
  )
}

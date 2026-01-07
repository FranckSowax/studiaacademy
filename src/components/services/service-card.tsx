import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Service } from '@/types/service'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

interface ServiceCardProps {
  service: Service
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Badge variant="outline" className="mb-2 capitalize">
            {service.category || 'Service'}
          </Badge>
          {service.price === 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
              Gratuit
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl">{service.name}</CardTitle>
        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
          {service.shortDescription || service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2 text-sm text-muted-foreground">
            {service.free_limit > 0 && (
                <div className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    <span>{service.free_limit} essais gratuits</span>
                </div>
            )}
            <div className="flex items-center font-medium text-foreground">
                {service.price > 0 ? `${service.price.toLocaleString()} XAF` : 'Gratuit'}
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={service.href}>
            Accéder <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

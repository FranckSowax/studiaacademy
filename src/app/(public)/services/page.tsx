import { ServiceCard } from '@/components/services/service-card'
import { ServiceSearch } from '@/components/services/service-search'
import { ServiceFilters } from '@/components/services/service-filters'
import { mockServices } from '@/lib/data/mock-services'

export default async function ServicesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const query = (searchParams.q as string)?.toLowerCase() || ''
  const category = searchParams.category as string
  const price = searchParams.price as string

  const filteredServices = mockServices.filter((service) => {
    const matchesQuery = service.name.toLowerCase().includes(query) || 
                         service.description?.toLowerCase().includes(query)
    const matchesCategory = category ? service.category === category : true
    const matchesPrice = price === 'free' ? service.price === 0 : 
                         price === 'paid' ? service.price > 0 : true
    
    return matchesQuery && matchesCategory && matchesPrice
  })

  return (
    <div className="container py-12 md:py-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Nos Services</h1>
           <p className="text-muted-foreground text-lg mt-2">Découvrez l'ensemble de nos outils pour booster votre carrière.</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
         <ServiceSearch />
         <ServiceFilters />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Aucun service ne correspond à votre recherche.
          </div>
        )}
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="container py-12 md:py-24 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">Politique de Confidentialité</h1>
      <div className="prose dark:prose-invert">
        <p>Dernière mise à jour : {new Date().toLocaleDateString()}</p>
        <h2 className="text-2xl font-semibold mt-6 mb-4">1. Collecte des données</h2>
        <p>Nous collectons les informations que vous nous fournissez directement...</p>
        {/* More privacy policy details */}
      </div>
    </div>
  )
}

export default function TermsPage() {
  return (
    <div className="container py-12 md:py-24 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">Conditions d'utilisation</h1>
      <div className="prose dark:prose-invert">
        <p>Dernière mise à jour : {new Date().toLocaleDateString()}</p>
        <h2 className="text-2xl font-semibold mt-6 mb-4">1. Acceptation des conditions</h2>
        <p>En accédant à Studia Academy, vous acceptez d'être lié par ces conditions d'utilisation.</p>
        {/* More terms would go here */}
      </div>
    </div>
  )
}

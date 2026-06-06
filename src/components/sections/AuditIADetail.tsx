import {
  Workflow, Database, Cpu, Users, ShieldCheck, MessageSquare,
  BarChart3, FileText, Rocket, Target, Clock, TrendingUp,
  Search, Map, GraduationCap, CheckCircle2, Lightbulb, Lock,
} from 'lucide-react'

// Bloc détaillé du module « Audit IA Entreprises ».
// Arguments adaptés aux entreprises & administrations gabonaises. Pas de tarifs (sur devis).

const STATS = [
  { value: '360°', label: 'Diagnostic complet' },
  { value: '4 axes', label: 'Processus · données · outils · équipes' },
  { value: 'ROI', label: 'Cas d’usage priorisés par gain' },
  { value: '6–12 mois', label: 'Feuille de route concrète' },
]

const POURQUOI = [
  { icon: Clock, titre: 'Gagner du temps', desc: 'Automatisez les tâches répétitives (courriers, devis, reporting) et libérez vos équipes.' },
  { icon: TrendingUp, titre: 'Réduire les coûts', desc: 'Moins d’erreurs, des process plus rapides, des ressources mieux utilisées.' },
  { icon: BarChart3, titre: 'Mieux décider', desc: 'Exploitez vos données pour piloter l’activité avec des tableaux de bord clairs.' },
  { icon: Target, titre: 'Rester compétitif', desc: 'Prenez de l’avance pendant que le marché local découvre à peine l’IA.' },
]

const ETAPES = [
  { icon: MessageSquare, titre: 'Cadrage', desc: 'Entretien avec la direction : objectifs, contraintes et priorités métier.' },
  { icon: Search, titre: 'Diagnostic 360°', desc: 'Analyse des processus, des données, des outils et des compétences en place.' },
  { icon: Lightbulb, titre: 'Cas d’usage IA', desc: 'Identification des quick wins et des chantiers structurants à fort impact.' },
  { icon: Map, titre: 'Feuille de route', desc: 'Plan priorisé par ROI, avec coûts, délais et indicateurs de réussite.' },
  { icon: Rocket, titre: 'Déploiement', desc: 'Mise en œuvre accompagnée et formation des équipes — pas juste un rapport.' },
]

const DOMAINES = [
  { icon: Workflow, titre: 'Processus métier', desc: 'Tâches manuelles et répétitives candidates à l’automatisation.' },
  { icon: Database, titre: 'Données', desc: 'Qualité, disponibilité et exploitation de vos données existantes.' },
  { icon: Cpu, titre: 'Outils & systèmes', desc: 'Bureautique, cloud, ERP, messagerie : ce qui peut être connecté à l’IA.' },
  { icon: Users, titre: 'Compétences & équipes', desc: 'Maturité numérique et besoins de formation pour réussir le changement.' },
  { icon: MessageSquare, titre: 'Relation client', desc: 'Support, WhatsApp, communication : où l’IA améliore l’expérience.' },
  { icon: Lock, titre: 'Sécurité & conformité', desc: 'Confidentialité des données et bonnes pratiques de gouvernance.' },
]

const USECASES = [
  'Automatisation administrative (courriers, devis, factures)',
  'Assistant client & support WhatsApp 24/7',
  'Analyse de données & reporting automatique',
  'Recrutement assisté (tri de CV, tests, fiches de poste)',
  'Marketing & création de contenu',
  'Aide à la décision pour les dirigeants',
]

const LIVRABLES = [
  'Rapport d’audit complet et compréhensible',
  'Cartographie des cas d’usage IA priorisés',
  'Feuille de route sur 6 à 12 mois',
  'Estimation des gains (ROI) et du budget',
  'Plan de formation des équipes',
]

const FORMULES = [
  {
    nom: 'Diagnostic Flash', cible: 'TPE / PME',
    points: ['Entretien de cadrage', 'Diagnostic des priorités', 'Top 5 des cas d’usage rapides'],
    highlight: false,
  },
  {
    nom: 'Audit Complet 360°', cible: 'PME / Administrations',
    points: ['Diagnostic 360° approfondi', 'Cartographie complète des cas d’usage', 'Feuille de route priorisée + ROI'],
    highlight: true,
  },
  {
    nom: 'Audit + Déploiement', cible: 'Organisations ambitieuses',
    points: ['Tout l’Audit 360°', 'Mise en œuvre accompagnée', 'Formation des équipes & support'],
    highlight: false,
  },
]

const POURQUOI_STUDIA = [
  { icon: ShieldCheck, titre: 'Ancrage local', desc: 'Des recommandations pensées pour le contexte gabonais (réseau, FCFA, réalités terrain).' },
  { icon: Lock, titre: 'Confidentialité', desc: 'Vos données et informations stratégiques restent protégées.' },
  { icon: GraduationCap, titre: 'Montée en compétence', desc: 'Vos équipes deviennent autonomes, l’IA n’est pas une boîte noire.' },
  { icon: Cpu, titre: 'Outils déjà prêts', desc: 'Studia opère déjà des outils IA concrets, immédiatement mobilisables.' },
]

export function AuditIADetail({ couleur }: { couleur: string }) {
  const soft = `${couleur}18`
  return (
    <>
      {/* Chiffres clés */}
      <section className="w-full py-12 bg-white border-y border-[#f0ebe3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center p-5 rounded-2xl bg-[#fbf8f3] border border-[#f0ebe3]">
                <div className="text-2xl md:text-3xl font-extrabold font-heading" style={{ color: couleur }}>{s.value}</div>
                <p className="text-xs md:text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi un audit IA */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-3">Pourquoi un audit IA maintenant ?</h2>
          <p className="text-gray-600 max-w-3xl mb-10">
            L’intelligence artificielle n’est plus réservée aux grands groupes. Bien ciblée, elle fait gagner
            du temps et de l’argent à toute organisation — encore faut-il savoir par où commencer.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POURQUOI.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.titre} className="bg-[#fbf8f3] rounded-2xl p-5 border border-[#f0ebe3]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: soft }}>
                    <Icon className="w-5 h-5" style={{ color: couleur }} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{p.titre}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Déroulé de l'audit */}
      <section className="w-full py-16 bg-[#fbf8f3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-8">Comment se déroule l’audit</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ETAPES.map((e, i) => {
              const Icon = e.icon
              return (
                <div key={e.titre} className="relative bg-white rounded-2xl p-5 border border-[#f0ebe3]">
                  <span className="absolute top-4 right-4 text-3xl font-extrabold opacity-10" style={{ color: couleur }}>{i + 1}</span>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: soft }}>
                    <Icon className="w-5 h-5" style={{ color: couleur }} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{e.titre}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{e.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Ce que nous auditons */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-8">Ce que nous auditons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOMAINES.map((d) => {
              const Icon = d.icon
              return (
                <div key={d.titre} className="bg-[#fbf8f3] rounded-2xl p-5 border border-[#f0ebe3]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: soft }}>
                    <Icon className="w-5 h-5" style={{ color: couleur }} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{d.titre}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{d.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cas d'usage + livrables */}
      <section className="w-full py-16 bg-[#fbf8f3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-6">Des cas d’usage concrets</h2>
            <ul className="space-y-3">
              {USECASES.map((u) => (
                <li key={u} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-[#f0ebe3]">
                  <Lightbulb className="w-5 h-5 mt-0.5 flex-none" style={{ color: couleur }} />
                  <span className="text-sm text-gray-700">{u}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-gray-900 mb-6">Vos livrables</h2>
            <ul className="space-y-3">
              {LIVRABLES.map((l) => (
                <li key={l} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-[#f0ebe3]">
                  <FileText className="w-5 h-5 mt-0.5 flex-none" style={{ color: couleur }} />
                  <span className="text-sm text-gray-700">{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Formules */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-3">Nos formules d’audit</h2>
          <p className="text-gray-600 max-w-3xl mb-8">Du diagnostic rapide à l’accompagnement complet, selon votre taille et vos ambitions.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FORMULES.map((f) => (
              <div
                key={f.nom}
                className="rounded-3xl p-6 border bg-white flex flex-col"
                style={f.highlight ? { borderColor: couleur, boxShadow: `0 10px 40px -12px ${couleur}55` } : { borderColor: '#f0ebe3' }}
              >
                {f.highlight && (
                  <span className="self-start text-xs font-bold px-3 py-1 rounded-full text-white mb-3" style={{ backgroundColor: couleur }}>
                    Recommandé
                  </span>
                )}
                <h3 className="font-bold font-heading text-gray-900 text-lg">{f.nom}</h3>
                <p className="text-xs font-semibold mb-3" style={{ color: couleur }}>{f.cible}</p>
                <ul className="space-y-2 flex-1">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-none" style={{ color: couleur }} />{p}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-sm font-bold" style={{ color: couleur }}>Sur devis</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Chaque audit est adapté à votre organisation. Contactez-nous pour un cadrage gratuit et un devis personnalisé.
          </p>
        </div>
      </section>

      {/* Pourquoi Studia */}
      <section className="w-full py-16 bg-[#fbf8f3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-8">Pourquoi Studia ?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POURQUOI_STUDIA.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.titre} className="bg-white rounded-2xl p-5 border border-[#f0ebe3]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: soft }}>
                    <Icon className="w-5 h-5" style={{ color: couleur }} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{p.titre}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

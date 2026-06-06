import {
  Languages, GraduationCap, Globe2, ShieldCheck, Wallet, Award,
  Briefcase, Brain, ClipboardCheck, Plane, HeartHandshake, FileText,
  Stethoscope, Users, MessageCircle, CheckCircle2, CalendarClock,
} from 'lucide-react'

// Bloc détaillé du programme « Studia China Pass » (page module Universités Chinoises).
// Contenu 100% public : programme, parcours, curriculum, financement, formules, réassurance.

const STATS = [
  { value: '6–9 mois', label: 'Préparation à Libreville' },
  { value: '+280', label: 'Universités chinoises agréées' },
  { value: '4 voies', label: 'De financement possibles' },
  { value: '360°', label: 'Suivi étudiant & famille' },
]

const PARCOURS = [
  { icon: MessageCircle, titre: 'Entretien d’orientation', desc: 'Bilan personnalisé du profil, du projet et des filières visées en Chine.' },
  { icon: Languages, titre: 'Préparation à Libreville', desc: 'Mandarin + Anglais intensifs pendant 6 à 9 mois, sur le campus Studia Academy.' },
  { icon: ClipboardCheck, titre: 'Candidatures & bourses', desc: 'Constitution et dépôt des dossiers universités + demandes de bourses.' },
  { icon: Plane, titre: 'Départ & installation', desc: 'Accompagnement visa, voyage et installation dans la ville d’accueil.' },
  { icon: HeartHandshake, titre: 'Suivi jusqu’au diplôme', desc: 'Accompagnement 360° de l’étudiant et de la famille tout au long du cursus.' },
]

const CURRICULUM = [
  { icon: Languages, titre: 'Mandarin (HSK)', desc: 'Objectif HSK 3 minimum, HSK 4 pour les profils avancés — clé d’accès aux universités et aux bourses.' },
  { icon: GraduationCap, titre: 'Anglais (IELTS)', desc: 'Préparation IELTS 6.0 à 6.5 pour ouvrir l’accès aux programmes enseignés en anglais.' },
  { icon: Briefcase, titre: 'Entrepreneuriat sino-africain', desc: 'Atelier sur les opportunités business Chine–Afrique pour valoriser le parcours.' },
  { icon: Brain, titre: 'Préparation interculturelle', desc: 'Coaching pré-départ : autonomie, gestion du choc culturel et du stress académique.' },
  { icon: Award, titre: 'Certification Studia', desc: 'Un certificat numéroté et vérifiable par QR code, reconnaissable par les partenaires.' },
]

const FINANCEMENT = [
  { titre: 'Bourse CSC', desc: 'China Scholarship Council — bourse du gouvernement chinois.' },
  { titre: 'Bourses universitaires', desc: 'Accordées directement par les universités d’accueil.' },
  { titre: 'Bourses provinciales', desc: 'Programmes régionaux, souvent moins compétitifs.' },
  { titre: 'Financement bancaire', desc: 'Crédit étudiant via nos partenaires, remboursable après obtention.' },
]

const FORMULES = [
  {
    nom: 'Essentiel', prix: '1 450 000 FCFA',
    points: ['Préparation linguistique Mandarin + Anglais', 'Orientation académique', 'Aide au dossier de candidature'],
    highlight: false,
  },
  {
    nom: 'Premium Bourse', prix: '2 750 000 FCFA',
    points: ['Tout l’Essentiel', 'Accompagnement complet aux bourses', 'Accompagnement visa & installation'],
    highlight: true,
  },
  {
    nom: 'Excellence 360°', prix: '4 750 000 FCFA',
    points: ['Tout le Premium', 'Suivi 360° multi-années de la famille', 'Référent dédié & réassurance complète'],
    highlight: false,
  },
]

const REASSURANCE = [
  { icon: Users, titre: 'Référent unique', desc: 'Une personne nommée, joignable sur WhatsApp et par téléphone, connue de la famille dès l’orientation.' },
  { icon: FileText, titre: 'Bulletin trimestriel', desc: 'Assiduité, résultats, bien-être, point financier et alertes — un rapport signé, pas un simple email.' },
  { icon: Stethoscope, titre: 'Convention médicale', desc: 'Un correspondant médical francophone identifié dans la ville d’accueil avant tout départ.' },
  { icon: CalendarClock, titre: 'Cellule familiale', desc: 'Une réunion régulière avec les familles et le témoignage d’étudiants déjà en Chine.' },
  { icon: HeartHandshake, titre: 'Communauté & parrainage', desc: 'Chaque nouvel étudiant est parrainé par un « senior Studia » déjà installé en Chine.' },
]

export function ChinaPassDetail({ couleur }: { couleur: string }) {
  const soft = `${couleur}18`
  return (
    <>
      {/* Bandeau chiffres clés */}
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

      {/* Le programme + parcours */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-3">Un programme intégré, de A à Z</h2>
          <p className="text-gray-600 max-w-3xl mb-10">
            Studia China Pass accompagne l’étudiant à chaque étape : de la préparation linguistique à Libreville
            jusqu’à l’obtention du diplôme en Chine, avec un suivi permanent de la famille.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PARCOURS.map((e, i) => {
              const Icon = e.icon
              return (
                <div key={e.titre} className="relative bg-[#fbf8f3] rounded-2xl p-5 border border-[#f0ebe3]">
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

      {/* Curriculum */}
      <section className="w-full py-16 bg-[#fbf8f3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-8">Ce que vous apprenez</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CURRICULUM.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.titre} className="bg-white rounded-2xl p-5 border border-[#f0ebe3] shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: soft }}>
                    <Icon className="w-5 h-5" style={{ color: couleur }} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{c.titre}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Financement */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="w-6 h-6" style={{ color: couleur }} />
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">4 voies de financement</h2>
          </div>
          <p className="text-gray-600 max-w-3xl mb-8">
            Nous activons toutes les options pour rendre les études en Chine accessibles. Le coût final dépend
            des bourses obtenues, que nous recherchons activement avec vous.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FINANCEMENT.map((f) => (
              <div key={f.titre} className="bg-[#fbf8f3] rounded-2xl p-5 border border-[#f0ebe3]">
                <ShieldCheck className="w-5 h-5 mb-2" style={{ color: couleur }} />
                <h3 className="font-bold text-gray-900 text-sm mb-1">{f.titre}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formules & tarifs */}
      <section className="w-full py-16 bg-[#fbf8f3]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 mb-3">Nos formules</h2>
          <p className="text-gray-600 max-w-3xl mb-8">Trois niveaux d’accompagnement, du socle linguistique au suivi familial complet.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FORMULES.map((f) => (
              <div
                key={f.nom}
                className="rounded-3xl p-6 border bg-white flex flex-col"
                style={f.highlight ? { borderColor: couleur, boxShadow: `0 10px 40px -12px ${couleur}55` } : { borderColor: '#f0ebe3' }}
              >
                {f.highlight && (
                  <span className="self-start text-xs font-bold px-3 py-1 rounded-full text-white mb-3" style={{ backgroundColor: couleur }}>
                    Le plus choisi
                  </span>
                )}
                <h3 className="font-bold font-heading text-gray-900 text-lg">{f.nom}</h3>
                <div className="text-2xl font-extrabold my-2" style={{ color: couleur }}>{f.prix}</div>
                <ul className="space-y-2 mt-3 flex-1">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-none" style={{ color: couleur }} />{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Tarifs indicatifs hors frais universitaires et de visa. Une offre dédiée aux entreprises (parrainage RSE)
            est disponible sur demande.
          </p>
        </div>
      </section>

      {/* Réassurance familiale */}
      <section className="w-full py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <Globe2 className="w-6 h-6" style={{ color: couleur }} />
            <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900">La sérénité des familles, notre priorité</h2>
          </div>
          <p className="text-gray-600 max-w-3xl mb-8">
            Envoyer son enfant étudier en Chine est une grande décision. Notre dispositif 360° garde le lien
            entre l’étudiant, la famille et Studia, à chaque instant.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REASSURANCE.map((r) => {
              const Icon = r.icon
              return (
                <div key={r.titre} className="bg-[#fbf8f3] rounded-2xl p-5 border border-[#f0ebe3]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: soft }}>
                    <Icon className="w-5 h-5" style={{ color: couleur }} />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{r.titre}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

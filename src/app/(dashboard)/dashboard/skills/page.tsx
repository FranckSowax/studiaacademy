'use client'

import { BarChart3, TrendingUp, Target, Zap, BookOpen, Code, Palette, Database, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const skillCategories = [
  {
    id: 1,
    name: 'Design Graphique',
    icon: Palette,
    color: '#e97e42',
    level: 75,
    skills: [
      { name: 'Canva', level: 90 },
      { name: 'Photoshop', level: 65 },
      { name: 'Illustrator', level: 45 },
    ],
  },
  {
    id: 2,
    name: 'Développement Web',
    icon: Code,
    color: '#8B5CF6',
    level: 60,
    skills: [
      { name: 'WordPress', level: 80 },
      { name: 'HTML/CSS', level: 55 },
      { name: 'JavaScript', level: 35 },
    ],
  },
  {
    id: 3,
    name: 'Automatisation',
    icon: Zap,
    color: '#10B981',
    level: 45,
    skills: [
      { name: 'Make (Integromat)', level: 60 },
      { name: 'Zapier', level: 40 },
      { name: 'n8n', level: 20 },
    ],
  },
  {
    id: 4,
    name: 'Marketing Digital',
    icon: Globe,
    color: '#3B82F6',
    level: 55,
    skills: [
      { name: 'SEO', level: 70 },
      { name: 'Réseaux Sociaux', level: 65 },
      { name: 'Email Marketing', level: 40 },
    ],
  },
]

const recentTests = [
  { id: 1, name: 'Test de compétences Canva', score: 85, date: '10 Jan 2025' },
  { id: 2, name: 'Évaluation WordPress', score: 72, date: '05 Jan 2025' },
  { id: 3, name: 'Quiz SEO Fondamentaux', score: 90, date: '28 Déc 2024' },
]

export default function SkillsPage() {
  const overallLevel = Math.round(
    skillCategories.reduce((acc, cat) => acc + cat.level, 0) / skillCategories.length
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes Compétences</h1>
          <p className="text-gray-500">Suivez votre progression et développez vos skills</p>
        </div>
        <Link href="/services/competency-test">
          <Button className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white">
            <Target className="w-4 h-4 mr-2" />
            Passer un test
          </Button>
        </Link>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#e97e42] to-[#d56a2e] rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Niveau Global</p>
              <p className="text-2xl font-bold text-gray-800">{overallLevel}%</p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-full"
              style={{ width: `${overallLevel}%` }}
            />
          </div>
        </div>

        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#fff7ed] rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#e97e42]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Formations suivies</p>
              <p className="text-2xl font-bold text-gray-800">12</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">+3 ce mois-ci</p>
        </div>

        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tests réussis</p>
              <p className="text-2xl font-bold text-gray-800">8/10</p>
            </div>
          </div>
          <p className="text-sm text-green-600">80% de réussite</p>
        </div>
      </div>

      {/* Compétences par catégorie */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Compétences par domaine</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skillCategories.map((category) => {
            const Icon = category.icon
            return (
              <div
                key={category.id}
                className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] p-5 hover:shadow-lg hover:shadow-[#e97e42]/10 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: category.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{category.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${category.level}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: category.color }}>
                        {category.level}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {category.skills.map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-28">{skill.name}</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${skill.level}%`,
                            backgroundColor: category.color,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{skill.level}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tests récents */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Tests récents</h2>
        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] overflow-hidden">
          {recentTests.map((test, idx) => (
            <div
              key={test.id}
              className={`p-4 flex items-center gap-4 ${
                idx < recentTests.length - 1 ? 'border-b border-[#f0ebe3]' : ''
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  test.score >= 80
                    ? 'bg-green-50'
                    : test.score >= 60
                    ? 'bg-[#fff7ed]'
                    : 'bg-red-50'
                }`}
              >
                <span
                  className={`font-bold ${
                    test.score >= 80
                      ? 'text-green-600'
                      : test.score >= 60
                      ? 'text-[#e97e42]'
                      : 'text-red-500'
                  }`}
                >
                  {test.score}%
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{test.name}</h4>
                <p className="text-sm text-gray-500">{test.date}</p>
              </div>
              <Button variant="outline" size="sm" className="border-[#e97e42] text-[#e97e42] hover:bg-[#fff7ed]">
                Refaire
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

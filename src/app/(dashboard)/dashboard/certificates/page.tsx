'use client'

import { Award, Download, Share2, ExternalLink, Calendar, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const certificates = [
  {
    id: 1,
    title: 'Canva Pro : Design Graphique pour Tous',
    issueDate: '15 Décembre 2024',
    credentialId: 'STUD-CAN-2024-001',
    instructor: 'Marie Nguema',
    skills: ['Design Graphique', 'Canva', 'Création Visuelle'],
    status: 'obtained',
  },
  {
    id: 2,
    title: 'WordPress & Création de Sites Web',
    issueDate: '20 Novembre 2024',
    credentialId: 'STUD-WP-2024-002',
    instructor: 'Patrick Mba',
    skills: ['WordPress', 'Web Design', 'Hébergement'],
    status: 'obtained',
  },
]

const inProgressCourses = [
  {
    id: 1,
    title: 'Automatisation avec Make & Zapier',
    progress: 65,
    instructor: 'Franck Obame',
  },
  {
    id: 2,
    title: 'Photoshop : De Zéro à Expert',
    progress: 30,
    instructor: 'Claire Ndong',
  },
]

export default function CertificatesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mes Certificats</h1>
          <p className="text-gray-500">Vos certifications et formations en cours</p>
        </div>
      </div>

      {/* Certificats obtenus */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#e97e42]" />
          Certificats obtenus ({certificates.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] overflow-hidden hover:shadow-lg hover:shadow-[#e97e42]/10 transition-all"
            >
              {/* Certificate Header */}
              <div className="bg-gradient-to-r from-[#e97e42] to-[#d56a2e] p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6" />
                    <span className="text-sm font-medium">Studia Academy</span>
                  </div>
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">{cert.title}</h3>
              </div>

              {/* Certificate Body */}
              <div className="p-4">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Délivré le {cert.issueDate}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: <span className="font-mono text-gray-700">{cert.credentialId}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Formateur: <span className="text-gray-700">{cert.instructor}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {cert.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-[#fff7ed] text-[#e97e42] px-2 py-1 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#e97e42] to-[#d56a2e] hover:from-[#d56a2e] hover:to-[#c45a20] text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button variant="outline" className="border-[#e97e42] text-[#e97e42] hover:bg-[#fff7ed]">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="border-[#e97e42] text-[#e97e42] hover:bg-[#fff7ed]">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formations en cours */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Formations en cours</h2>
        <div className="bg-[#fbf8f3] rounded-2xl border border-[#f0ebe3] overflow-hidden">
          {inProgressCourses.map((course, idx) => (
            <div
              key={course.id}
              className={`p-4 flex items-center gap-4 ${
                idx < inProgressCourses.length - 1 ? 'border-b border-[#f0ebe3]' : ''
              }`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800">{course.title}</h4>
                <p className="text-sm text-gray-500">{course.instructor}</p>
              </div>
              <div className="w-32">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Progression</span>
                  <span className="font-semibold text-[#e97e42]">{course.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#e97e42] to-[#d56a2e] rounded-full"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
              <Link
                href={`/dashboard/courses`}
                className="text-[#e97e42] hover:text-[#d56a2e] font-medium text-sm"
              >
                Continuer
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

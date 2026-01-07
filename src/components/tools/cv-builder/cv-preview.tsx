'use client'

import { CVData } from '@/types/cv'
import { Mail, Phone, MapPin, Linkedin, Globe } from 'lucide-react'

interface CVPreviewProps {
  data: CVData
}

export function CVPreview({ data }: CVPreviewProps) {
  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-lg p-[20mm] text-sm">
      {/* Header */}
      <header className="border-b pb-6 mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-wide text-primary mb-2">
          {data.profile.fullName || 'Votre Nom'}
        </h1>
        <p className="text-xl text-slate-600 mb-4 font-medium">
          {data.profile.jobTitle || 'Titre du poste'}
        </p>
        
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          {data.profile.email && (
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {data.profile.email}
            </div>
          )}
          {data.profile.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {data.profile.phone}
            </div>
          )}
          {data.profile.address && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {data.profile.address}
            </div>
          )}
          {data.profile.linkedin && (
            <div className="flex items-center gap-1">
              <Linkedin className="h-3 w-3" />
              {data.profile.linkedin}
            </div>
          )}
          {data.profile.website && (
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {data.profile.website}
            </div>
          )}
        </div>
      </header>

      {/* Summary */}
      {data.profile.summary && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-1">
            Profil
          </h2>
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {data.profile.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {data.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-1">
            Expérience Professionnelle
          </h2>
          <div className="space-y-5">
            {data.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-base text-slate-800">{exp.jobTitle}</h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {exp.startDate} - {exp.current ? 'Présent' : exp.endDate}
                  </span>
                </div>
                <div className="text-primary font-medium mb-2 text-xs uppercase tracking-wide">
                  {exp.company}{exp.location ? `, ${exp.location}` : ''}
                </div>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {data.education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-1">
            Formation
          </h2>
          <div className="space-y-4">
            {data.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-slate-800">{edu.degree}</h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {edu.startDate} - {edu.current ? 'Présent' : edu.endDate}
                  </span>
                </div>
                <div className="text-slate-600">
                  {edu.school}{edu.location ? `, ${edu.location}` : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {data.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-1">
            Compétences
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <span 
                key={skill.id} 
                className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

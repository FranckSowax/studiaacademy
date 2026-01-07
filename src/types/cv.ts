export interface CVProfile {
  fullName: string
  email: string
  phone: string
  address: string
  summary: string
  jobTitle: string
  website?: string
  linkedin?: string
}

export interface CVExperience {
  id: string
  jobTitle: string
  company: string
  location: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
}

export interface CVEducation {
  id: string
  degree: string
  school: string
  location: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
}

export interface CVSkill {
  id: string
  name: string
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface CVLanguage {
  id: string
  name: string
  proficiency: 'basic' | 'intermediate' | 'fluent' | 'native'
}

export interface CVData {
  profile: CVProfile
  experience: CVExperience[]
  education: CVEducation[]
  skills: CVSkill[]
  languages: CVLanguage[]
  hobbies?: string[]
}

export const initialCVData: CVData = {
  profile: {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    summary: '',
    jobTitle: '',
  },
  experience: [],
  education: [],
  skills: [],
  languages: [],
}

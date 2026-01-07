export interface CourseModule {
  id: string
  title: string
  type: 'video' | 'quiz' | 'text'
  duration: string // e.g. "5:30"
  content?: string // Text content or video URL
  videoUrl?: string
  quizId?: string // Link to a quiz if type is quiz
}

export interface CourseChapter {
  id: string
  title: string
  modules: CourseModule[]
}

export interface Course {
  id: string
  title: string
  description: string
  instructor: string
  duration: string
  level: 'beginner' | 'intermediate' | 'advanced'
  chapters: CourseChapter[]
}

export interface UserCourseProgress {
  courseId: string
  completedModuleIds: string[]
  lastAccessedModuleId?: string
  progressPercentage: number
}
